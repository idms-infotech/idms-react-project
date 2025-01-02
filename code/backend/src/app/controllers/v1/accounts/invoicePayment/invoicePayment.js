const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/accounts/invoicePaymentModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {outputData, getAllAggregationFooter} = require("../../../../helpers/utility");
const {generateCreateData, getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {
    getAllInvoicePaymentAttributes,
    getAllInvoicePaymentExcelAttributes,
    getAllInvoicePaymentReportsAttributes
} = require("../../../../models/accounts/helpers/invoicePaymentHelper");
const {getAllCustomers} = require("../../sales/customerMaster/customerMaster");
const {
    getAllServiceInvoice,
    updateSIPaymentStatusOnInvoicePayment
} = require("../../sales/serviceInvoice/serviceInvoice");
const {default: mongoose} = require("mongoose");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const InvoicePaymentRepository = require("../../../../models/accounts/repository/invoicePaymentRepository");
const ObjectId = mongoose.Types.ObjectId;
exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1
        } = req.query;
        let query = {
            company: ObjectId(req.user.company),
            status: {$nin: [OPTIONS.defaultStatus.CLOSED]}
        };
        let skip = Math.max(0, page - 1) * pageSize;
        let project = getAllInvoicePaymentAttributes();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        } else {
            project = getAllInvoicePaymentExcelAttributes();
        }
        let rows = await Model.aggregate([
            {$match: query},
            {
                $addFields: {
                    firstPayment: {$first: "$paymentHistory"}
                }
            },
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            ...outputData(rows)
        });
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.create = asyncHandler(async (req, res) => {
    try {
        let existingInvoice = await Model.findOne(
            {
                serviceInvoice: req.body.serviceInvoice
            },
            {_id: 1}
        );
        if (existingInvoice) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("Service Invoice");
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        if (createdObj && createdObj.paymentHistory.length) {
            const totalReceivedAmount = createdObj.paymentHistory.reduce(
                (total, payment) => total + payment.receivedAmount + payment.invoiceDiscount + payment.TDSAmount,
                0
            );
            if (createdObj.totalAmountWithTax == totalReceivedAmount) {
                await updateSIPaymentStatusOnInvoicePayment(createdObj.serviceInvoice);
                createdObj.status = OPTIONS.defaultStatus.CLOSED;
            } else {
                createdObj.status = OPTIONS.defaultStatus.PARTIALLY_PAID;
            }
        }
        const saveObj = new Model(createdObj);

        const itemDetails = await saveObj.save();
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Invoice Payment")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Invoice Payment", e);
        if (req.files) {
            removeFilesInError(req.files.supportingDocumentsFile);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await generateCreateData(itemDetails, req.body);
        if (req.body.paymentHistory && req.body.paymentHistory.length) {
            itemDetails.paymentHistory = req.body.paymentHistory;
        }
        if (itemDetails && itemDetails.paymentHistory.length) {
            const totalReceivedAmount = itemDetails.paymentHistory.reduce(
                (total, payment) => total + payment.receivedAmount + payment.invoiceDiscount + payment.TDSAmount,
                0
            );
            if (itemDetails.totalAmountWithTax == totalReceivedAmount) {
                await updateSIPaymentStatusOnInvoicePayment(itemDetails.serviceInvoice);
                itemDetails.status = OPTIONS.defaultStatus.CLOSED;
            } else {
                itemDetails.status = OPTIONS.defaultStatus.PARTIALLY_PAID;
            }
        }
        itemDetails = await itemDetails.save();
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Invoice Payment has been")
        });
    } catch (e) {
        console.error("update Invoice Payment", e);
        if (req.files) {
            removeFilesInError(req.files.supportingDocumentsFile);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Invoice Payment")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Invoice Payment");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Invoice Payment", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Invoice Payment");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Invoice Payment", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const customersList = await getAllCustomers(req.user.company, {customerName: 1, company: 0});
        const serviceInvoiceList = await getAllServiceInvoice(req.user.company, {
            serviceInvoiceNumber: 1,
            serviceInvoiceDate: 1,
            totalValue: 1,
            totalAmountWithTax: 1,
            customerName: 1,
            customer: 1,
            projectName: 1,
            project: 1
        });
        const paymentMethod = await getAllModuleMaster(req.user.company, "PAYMENT_METHOD");
        return res.success({
            paymentMethod,
            customersList,
            serviceInvoiceList
        });
    } catch (error) {
        console.error("getAllMasterData Invoice Payment", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const customersList = await getAllCustomers(req.user.company, {customerName: 1, company: 0});
        const {toDate = null, fromDate = null, customer = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!customer && {customer: ObjectId(customer)}),
            ...(!!toDate &&
                !!fromDate && {
                    serviceInvoiceDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = getAllInvoicePaymentReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    lastPayment: {$last: "$paymentHistory"}
                }
            },
            {
                $addFields: {
                    invoiceAge: {
                        $dateDiff: {
                            startDate: "$serviceInvoiceDate",
                            endDate: "$lastPayment.receivedDate",
                            unit: "day"
                        }
                    }
                }
            }
        ];
        let rows = await InvoicePaymentRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            ...rows,
            customersList
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getTotalNoOfPaymentReceivedPerDay = async company => {
    const rows = await Model.aggregate([
        {
            $match: {
                company: ObjectId(company),
                createdAt: {
                    $lte: getEndDateTime(new Date()),
                    $gte: getStartDateTime(new Date())
                }
            }
        },
        {
            $group: {
                _id: null,
                count: {$sum: {$cond: [{$eq: ["$status", "Awaiting Approval"]}, 1, 0]}}
                // totalPaymentReceivedValue: {$sum: "$paymentHistory.receivedAmount"}
            }
        },
        {
            $project: {
                _id: 0,
                count: 1
                // totalPaymentReceivedValue: 1
            }
        }
    ]);
    return rows.length > 0 ? rows[0] : [];
};

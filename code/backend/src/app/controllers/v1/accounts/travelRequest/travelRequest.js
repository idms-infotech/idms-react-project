const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/accounts/travelRequestModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {outputData, getAllAggregationFooter} = require("../../../../helpers/utility");
const {generateCreateData, getMatchData} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const ObjectId = mongoose.Types.ObjectId;
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {
    getAllTravelRequestTransactions,
    getAllTravelRequestTransactionsExcelData,
    getAllTravelRequestReportsTransactions
} = require("../../../../models/accounts/helpers/travelRequestHelper");
const {getEndDateTime, getStartDateTime, dateToAnyFormat} = require("../../../../helpers/dateTime");
const {getAllCustomers} = require("../../sales/customerMaster/customerMaster");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {TRAVEL_REQUEST} = require("../../../../mocks/schemasConstant/accountsConstant");
const TravelRequestRepository = require("../../../../models/accounts/repository/travelRequestRepository");

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
        let skip = Math.max(0, page - 1) * pageSize;
        let project = getAllTravelRequestTransactions();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        } else {
            project = getAllTravelRequestTransactionsExcelData();
        }
        let rows = await Model.aggregate([
            {$match: {company: ObjectId(req.user.company)}},
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            ...outputData(rows)
        });
    } catch (e) {
        console.error("getAllTravelRequest", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        if (req.files) {
            if (req.files.supportingDocumentsFile && req.files.supportingDocumentsFile.length > 0) {
                createdObj["supportingDocumentsFile"] = req.files.supportingDocumentsFile[0].filename;
            }
        }
        const saveObj = new Model(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Travel Request")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Travel Request", e);
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

        if (req.files) {
            if (req.files.supportingDocumentsFile && req.files.supportingDocumentsFile.length > 0) {
                if (itemDetails.supportingDocumentsFile) {
                    removeFile(
                        `${req.files.supportingDocumentsFile[0].destination}/${itemDetails.supportingDocumentsFile}`
                    );
                }
                itemDetails.supportingDocumentsFile = req.files.supportingDocumentsFile[0].filename;
            }
        }

        itemDetails = await itemDetails.save();
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Travel Request has been")
        });
    } catch (e) {
        console.error("update Travel Request", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Travel Request")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Travel Request");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Travel Request", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Travel Request");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Travel Request", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...TRAVEL_REQUEST.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        const customersList = await getAllCustomers(req.user.company, {customerName: 1, company: 0});
        const paymentMethod = await getAllModuleMaster(req.user.company, "PAYMENT_METHOD");
        let modeOfTransport = await getAllModuleMaster( req.user.company, "MODE_OF_TRANSPORT");
        return res.success({
            autoIncrementNo,
            paymentMethod,
            customersList,
            modeOfTransport,
        });
    } catch (error) {
        console.error("getAllMasterData Travel Request", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {toDate = null, fromDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            status: {$in: ["Approved"]},
            ...(!!toDate &&
                !!fromDate && {
                    requestDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = getAllTravelRequestReportsTransactions();
        let pipeline = [
            {
                $match: query
            }
        ];
        let rows = await TravelRequestRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            ...rows
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllTravelRequest = async (company, project = {}) => {
    try {
        let rows = await Model.find({company: company}, project).sort({
            createdAt: -1
        });
        return rows;
    } catch (e) {
        console.error("getAllTravelRequest", e);
    }
};

exports.getTotalNoOfTravelRequestRaisedPerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$requestDate"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                matchDate: currentDate
            }
        },
        {
            $group: {
                _id: null,
                count: {$sum: {$cond: [{$eq: ["$status", "Awaiting Approval"]}, 1, 0]}}
            }
        },
        {
            $project: {
                _id: 0,
                count: 1
            }
        }
    ]);
    return rows[0]?.count || 0;
};

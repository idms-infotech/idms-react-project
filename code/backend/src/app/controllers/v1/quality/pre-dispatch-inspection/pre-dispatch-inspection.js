const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/quality/preDispatchInspectionModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {default: mongoose} = require("mongoose");
const {getAllCustomers} = require("../../sales/customerMaster/customerMaster");
const {
    getAllSalesInvoiceForPDIR,
    getAllBySalesInvoiceByIdForPDIR,
    updateSalesInvoiceOnPDIRGenerate
} = require("../../dispatch/salesInvoice/salesInvoice");
const {CONSTANTS} = require("../../../../../config/config");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {
    getAllPreDispatchInspectionAttributes,
    getAllPreDispatchInspectionReportsAttributes
} = require("../../../../models/quality/helpers/preDispatchInspectionHelper");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const PreDispatchInspectionRepository = require("../../../../models/quality/repository/preDispatchInspectionRepository");
const ProductSpecificationRepository = require("../../../../models/quality/repository/productSpecificationRepository");
const ProductCategorySpecificationsRepository = require("../../../../models/quality/repository/productCategorySpecificationsRepository");
const {getQMSMappingByModuleAndTitle} = require("../../settings/report-qms-mapping/report-qms-mapping");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllPreDispatchInspectionAttributes();

        let pipeline = [
            {
                $match: {
                    isGenerated: {$ne: true},
                    company: ObjectId(req.user.company)
                }
            }
        ];
        let rows = await PreDispatchInspectionRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        for (const ele of rows.rows) {
            if (ele.preDispatchDetails.some(x => x.status == "Approved")) {
                ele.status = "Approved";
            }
            if (ele.preDispatchDetails.some(x => x.status == "Need Re-Validation")) {
                ele.status = "Need Re-Validation";
            }
            if (ele.preDispatchDetails.some(x => x.status == "Rejected")) {
                ele.status = "Rejected";
            }
        }

        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
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
        const saveObj = new Model(createdObj);

        const itemDetails = await saveObj.save();
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Pre Dispatch Inspection")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Pre Dispatch Inspection", e);
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

        itemDetails = await itemDetails.save();
        if (itemDetails && itemDetails.isGenerated) {
            await updateSalesInvoiceOnPDIRGenerate(req.user.company, itemDetails.salesInvoice);
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Pre Dispatch Inspection has been")
        });
    } catch (e) {
        console.error("update Pre Dispatch Inspection", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Pre Dispatch Inspection")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Pre Dispatch Inspection");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Pre Dispatch Inspection", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Pre Dispatch Inspection");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Pre Dispatch Inspection", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getPDIRDetailsById = asyncHandler(async (req, res) => {
    try {
        const display = await getQMSMappingByModuleAndTitle(req.user.company, "Quality", "PDI Report");
        let existing = await Model.findById(req.params.id)
            .populate({
                path: "company",
                model: "Company",
                select: {
                    companyName: 1,
                    logoUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$logo"]}
                }
            })
            .populate("preDispatchDetails.SKU", "productCategory");
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Pre Dispatch Inspection");
            return res.unprocessableEntity(errors);
        }
        return res.success({existing, display});
    } catch (e) {
        console.error("getById Pre Dispatch Inspection", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const customersOptions = await filteredCustomerList([
            {$match: {company: ObjectId(req.user.company), isCustomerActive: "A"}},
            {$sort: {customerName: 1}},
            {
                $addFields: {
                    customerBillingAddress: {$arrayElemAt: ["$customerBillingAddress", 0]}
                }
            },
            {
                $project: {
                    customerName: 1,
                    customerCode: 1,
                    customerBillingState: "$customerBillingAddress.state",
                    customerBillingCity: "$customerBillingAddress.city",
                    customerBillingPinCode: "$customerBillingAddress.pinCode"
                }
            }
        ]);
        return res.success({
            customersOptions
        });
    } catch (error) {
        console.error("getAllMasterData Pre Dispatch Inspection", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getPDIRDetailsBySalesInvoiceId = asyncHandler(async (req, res) => {
    try {
        const modulePrefix = await findAppParameterValue("PDIR_ENTRY_MODULE_PREFIX", req.user.company);
        let salesInvoice = await getAllBySalesInvoiceByIdForPDIR(req.params.id, req.user.company);
        salesInvoice = JSON.parse(JSON.stringify(salesInvoice));
        salesInvoice.preDispatchCode = String(salesInvoice.salesInvoiceNumber).replace(
            new RegExp(salesInvoice?.salesInvModulePrefix, "g"),
            modulePrefix
        );
        salesInvoice.salesInvoiceDate = salesInvoice.salesInvoiceDate.split("T")[0];
        salesInvoice.salesInvoiceDetails = salesInvoice.salesInvoiceDetails.map(ele => {
            return {
                SKU: ele.SKU?._id,
                partNumber:
                    ele.SKU?.customerInfo.find(ele => String(ele.customer) == String(salesInvoice.customer._id))
                        ?.customerPartNo ?? "",
                SKUNo: ele.SKU?.SKUNo,
                SKUName: ele.SKU?.SKUName,
                SKUDescription: ele.SKU?.SKUDescription,
                productCategory: ele.SKU?.productCategory,
                batchDate: ele.batchDate ? ele.batchDate.split("T")[0] : "",
                tBatchNo: ele?.tBatchNo,
                UOM: ele?.unit,
                dispatchQty: ele?.dispatchQty,
                PDIEntryDetails: []
            };
        });
        let {_id, ...rest} = salesInvoice;
        return res.success(rest);
    } catch (e) {
        console.error("Pre Dispatch Details Sales Invoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const customerList = await getAllCustomers(req.user.company, {customerName: 1});
        const {customer = null, fromDate = null, toDate = null} = req.query;
        let project = getAllPreDispatchInspectionReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            isGenerated: true,
            ...(!!customer && {
                customer: ObjectId(customer)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    preDispatchDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerName: 1, _id: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},
            {
                $lookup: {
                    from: "CustomerPDIRMapping",
                    localField: "customer._id",
                    foreignField: "customer",
                    pipeline: [{$project: {template: 1}}],
                    as: "customerPDIRMapping"
                }
            },
            {
                $unwind: {
                    path: "$customerPDIRMapping",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];
        const display = await getQMSMappingByModuleAndTitle(req.user.company, "Quality", "PDI Report");
        let rows = await PreDispatchInspectionRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            ...rows,
            display,
            customerList
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getProductSpecificationBySKUId = asyncHandler(async (req, res) => {
    try {
        let productSpecification = await ProductSpecificationRepository.findOneDoc(
            {
                SKU: req.query.SKUId,
                status: OPTIONS.defaultStatus.ACTIVE,
                company: req.user.company
            },
            {specificationInfo: 1}
        );
        if (!productSpecification) {
            productSpecification = await ProductCategorySpecificationsRepository.findOneDoc(
                {
                    displayProductCategoryName: req.query.category,
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: req.user.company
                },
                {specificationInfo: 1}
            );
        }
        return res.success(productSpecification);
    } catch (e) {
        console.error("getAllMasterData Pre Dispatch Inspection", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSalesInvoiceForPDIREntry = asyncHandler(async (req, res) => {
    try {
        const salesInvoices = await getAllSalesInvoiceForPDIR(req.user.company, req.query.customerId);
        return res.success(salesInvoices);
    } catch (e) {
        console.error("getAllSalesInvoiceForPDIREntry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

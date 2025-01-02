const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllProspectSupplierAttributes,
    getAllProspectSupplierReportsAttributes
} = require("../../../../models/purchase/helpers/prospectSupplierHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {PROSPECT_SUPPLIER} = require("../../../../mocks/schemasConstant/purchaseConstant");
const ProspectSupplierRepository = require("../../../../models/purchase/repository/prospectSupplierRepository");
const {getAllPaymentTerms} = require("../../sales/paymentTerms/paymentTerms");
const {getAllSupplierCategory} = require("../../settings/supplierCategory/supplierCategory");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {OPTIONS} = require("../../../../helpers/global.options");
const SupplierRepository = require("../../../../models/purchase/repository/supplierRepository");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllProspectSupplierAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), supplierStatus: OPTIONS.defaultStatus.CREATED}},
            {
                $addFields: {
                    supplierBillingAddress: {$first: "$supplierBillingAddress"}
                }
            }
        ];
        let rows = await ProspectSupplierRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
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
        const itemDetails = await ProspectSupplierRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Prospect Supplier")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Prospect Supplier", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ProspectSupplierRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await ProspectSupplierRepository.updateDoc(itemDetails, req.body);
        if (itemDetails.supplierStatus == OPTIONS.defaultStatus.APPROVED) {
            let {_id, supplierStatus, regNo, regDate, supplierAssessmentRemarks, status, ...rest} = JSON.parse(
                JSON.stringify(itemDetails)
            );
            rest.isSupplierActive = "I";
            await SupplierRepository.createDoc(rest);
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Prospect Supplier has been")
        });
    } catch (e) {
        console.error("update Prospect Supplier", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await ProspectSupplierRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Prospect Supplier")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Prospect Supplier");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Prospect Supplier", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await ProspectSupplierRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Prospect Supplier");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Prospect Supplier", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            PROSPECT_SUPPLIER.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        const paymentTermsOptions = await getAllPaymentTerms(req.user.company);
        const supplierCategories = await getAllSupplierCategory(req.user.company);
        const purchaseCountryOptions = await getAllModuleMaster(req.user.company, "PURCHASE_COUNTRY");
        const zonesOptions = await getAllModuleMaster(req.user.company, "REGION_ZONES");
        return res.success({
            autoIncrementNo,
            paymentTermsOptions: paymentTermsOptions?.map(x => {
                return {
                    label: x?.paymentDescription,
                    value: x?.paymentDescription
                };
            }),
            supplierCategories,
            purchaseCountryOptions,
            zonesOptions
        });
    } catch (error) {
        console.error("getAllMasterData Prospect Supplier", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {toDate = null, fromDate = null} = req.query;
        let project = getAllProspectSupplierReportsAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    supplierStatus: {$in: [OPTIONS.defaultStatus.APPROVED, OPTIONS.defaultStatus.REJECTED]},
                    ...(!!toDate &&
                        !!fromDate && {
                            regDate: {
                                $lte: getEndDateTime(toDate),
                                $gte: getStartDateTime(fromDate)
                            }
                        })
                }
            },
            {
                $addFields: {
                    supplierBillingAddress: {$first: "$supplierBillingAddress"}
                }
            }
        ];
        let rows = await ProspectSupplierRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

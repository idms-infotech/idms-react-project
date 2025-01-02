const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllCustomerOpenPOAttributes} = require("../../../../models/sales/helpers/customerOpenPOHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {CUSTOMER_OPEN_PO} = require("../../../../mocks/schemasConstant/salesConstant");
const CustomerOpenPORepository = require("../../../../models/sales/repository/customerOpenPORepository");
const {getAllCustomerCategory} = require("../../settings/customerCategory/customerCategory");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllCustomerOpenPOAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await CustomerOpenPORepository.getAllPaginate({
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
        const itemDetails = await CustomerOpenPORepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Customer Open PO")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Customer Open PO", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await CustomerOpenPORepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await CustomerOpenPORepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Customer Open PO has been")
        });
    } catch (e) {
        console.error("update Customer Open PO", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await CustomerOpenPORepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Customer Open PO")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Customer Open PO");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Customer Open PO", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await CustomerOpenPORepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Customer Open PO");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Customer Open PO", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            CUSTOMER_OPEN_PO.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        let customerCategoryOptions = await getAllCustomerCategory(req.user.company, {
            category: 1,
            categoryType: 1
        });
        const customerOptions = await filteredCustomerList([
            {$match: {company: ObjectId(req.user.company), isCustomerActive: "A"}},
            {$sort: {customerName: 1}},
            {
                $addFields: {
                    customerBillingObj: {$arrayElemAt: ["$customerBillingAddress", 0]}
                }
            },
            {
                $project: {
                    customerCode: 1,
                    customerBillingState: "$customerBillingObj.state",
                    customerBillingCity: "$customerBillingObj.city",
                    customerBillingPinCode: "$customerBillingObj.pinCode",
                    customerName: 1,
                    customerCategory: 1,
                    categoryType: 1,
                    customerPaymentTerms: 1,
                    customerCurrency: 1,
                    customerShippingAddress: 1,
                    customerBillingAddress: 1,
                    transporter: 1,
                    transporterId: 1,
                    freightTerms: 1
                }
            }
        ]);
        return res.success({autoIncrementNo, customerCategoryOptions, customerOptions});
    } catch (error) {
        console.error("getAllMasterData Customer Open PO", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getSKUListByCustomerId = asyncHandler(async (req, res) => {
    try {
        const {customerId = null} = req.query;
        let SKUList = await filteredSKUMasterList([
            {
                $match: {
                    isActive: "A"
                    // SKUStage: {$ne: JOB_CARD_STAGE.PROTOTYPE}
                }
            },
            {$unwind: {path: "$customerInfo", preserveNullAndEmptyArrays: true}},
            {$match: {"customerInfo.customer": ObjectId(customerId)}},
            {
                $project: {
                    isSelect: {$literal: false},
                    SKU: "$_id",
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    UOM: "$primaryUnit",
                    customerPartNo: {$ifNull: ["$customerInfo.customerPartNo", null]},
                    lineItemNo: {$literal: null},
                    itemRevisionNo: {$literal: null}
                }
            }
        ]);
        return res.success({
            SKUList
        });
    } catch (e) {
        console.error("getSKUListByCustomerId", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

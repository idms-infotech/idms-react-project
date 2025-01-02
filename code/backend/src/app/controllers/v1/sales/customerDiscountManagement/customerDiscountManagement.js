const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllCustomerDiscountManagementAttributes
} = require("../../../../models/sales/helpers/customerDiscountManagementHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {CUSTOMER_DISCOUNT_MANAGEMENT} = require("../../../../mocks/schemasConstant/salesConstant");
const CustomerDiscManagementRepository = require("../../../../models/sales/repository/customerDiscountManagementRepository");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");
const {getAllCustomerCategory} = require("../../settings/customerCategory/customerCategory");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllCustomerDiscountManagementAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await CustomerDiscManagementRepository.getAllPaginate({
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
        const itemDetails = await CustomerDiscManagementRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Customer Discount Management")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Customer Discount Management", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await CustomerDiscManagementRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await CustomerDiscManagementRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Customer Discount Management has been")
        });
    } catch (e) {
        console.error("update Customer Discount Management", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await CustomerDiscManagementRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Customer Discount Management")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Customer Discount Management");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Customer Discount Management", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await CustomerDiscManagementRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Customer Discount Management");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Customer Discount Management", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            CUSTOMER_DISCOUNT_MANAGEMENT.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );

        let salesCategory = await getAllCustomerCategory(req.user.company);
        return res.success({
            autoIncrementNo,
            salesCategoryOptions: salesCategory.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            })
        });
    } catch (error) {
        console.error("getAllMasterData Customer Discount Management", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getCustomerByCategory = asyncHandler(async (req, res) => {
    try {
        let customerOptions = await filteredCustomerList([
            {
                $match: {
                    isCustomerActive: "A",
                    customerCategory: req.query.customerCategory,
                    company: ObjectId(req.user.company)
                }
            },
            {$sort: {customerName: 1}},
            {
                $project: {
                    customerCategory: 1,
                    customerName: 1,
                    customer: "$_id",
                    _id: 0
                }
            }
        ]);
        return res.success(customerOptions);
    } catch (e) {
        console.error("getCustomerById Customer Discount Management", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getSKUListByCustomer = asyncHandler(async (req, res) => {
    try {
        const SKUList = await filteredSKUMasterList([
            {$match: {company: ObjectId(req.user.company), isActive: "A"}},
            {
                $unwind: "$customerInfo"
            },
            {
                $match: {
                    "customerInfo.customer": ObjectId(req.query.customer)
                }
            },
            {$sort: {createdAt: -1}},
            {
                $project: {
                    SKU: "$_id",
                    SKUCategory: "$productCategory",
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    unitPrice: "$customerInfo.standardSellingRate",
                    discountInfo: {
                        discountType: {$literal: null},
                        discountValue: {$literal: null},
                        discountDescription: {$literal: null},
                        usageLimit: {$literal: null},
                        discountStartDate: {$literal: null},
                        discountEndDate: {$literal: null},
                        minPurchaseQty: {$literal: null},
                        minPurchaseAmt: {$literal: null}
                    },
                    _id: 0
                }
            }
        ]);
        return res.success(SKUList);
    } catch (e) {
        console.error("getSKUListByCustomer Customer Discount Management", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

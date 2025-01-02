const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllSKUMasterJP15Attributes} = require("../../../../models/planning/helpers/SKUMasterJP15Helper");
const SKUMasterJP15Repository = require("../../../../models/planning/repository/SKUMasterJP15Repository");
const {getAutoIncrementNumber} = require("../../../../helpers/utility");
const {filteredJWPrincipalList} = require("../../../../models/planning/repository/JWPrincipalRepository");
const {filteredSaleHSNList} = require("../../../../models/sales/repository/salesHSNRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getAllMapCategoryHSN} = require("../../sales/mapCategoryHSNMaster/mapCategoryHSN");
const {getAllSKUCategoryJP15} = require("../../settings/SKUCategoryJP/SKUCategoryJP");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSKUMasterJP15Attributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await SKUMasterJP15Repository.getAllPaginate({
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
        const itemDetails = await SKUMasterJP15Repository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("SKU Master JP15")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create SKU Master JP15", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await SKUMasterJP15Repository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await SKUMasterJP15Repository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("SKU Master JP15 has been")
        });
    } catch (e) {
        console.error("update SKU Master JP15", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await SKUMasterJP15Repository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("SKU Master JP15")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU Master JP15");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById SKU Master JP15", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await SKUMasterJP15Repository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU Master JP15");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById SKU Master JP15", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let SKUCategoryList = await getAllSKUCategoryJP15(req.user.company, null);
        let autoIncValues = {};
        let productCategories;
        if (SKUCategoryList.length > 0) {
            productCategories = SKUCategoryList.map(x => {
                return {
                    label: x.displayProductCategoryName,
                    value: x.displayProductCategoryName,
                    application: x.application,
                    productNumber: x.SKUCategoryName,
                    productCode: x.productCode,
                    key: x.SKUCategoryName
                };
            });
            for (const ele of SKUCategoryList) {
                autoIncValues[ele.SKUCategoryName] = getAutoIncrementNumber(
                    ele.SKUCategoryPrefix,
                    "",
                    ele.SKUCategoryAutoIncrement,
                    ele.digit
                );
            }
        }
        const HSNOptions = await filteredSaleHSNList([
            {$match: {company: ObjectId(req.user.company), isActive: "Y"}},
            {
                $project: {
                    value: "$hsnCode",
                    hsnCode: 1,
                    goodsDescription: 1,
                    gstRate: 1,
                    igstRate: 1,
                    cgstRate: 1,
                    sgstRate: 1,
                    ugstRate: 1,
                    select: {$literal: false}
                }
            }
        ]);
        const JWPrincipalOptions = await filteredJWPrincipalList([
            {$match: {company: ObjectId(req.user.company), status: OPTIONS.defaultStatus.ACTIVE}},
            {$sort: {JWPrincipalName: 1}},

            {
                $project: {
                    label: "$JWPrincipalName",
                    value: "$_id",
                    currency: "$currency",
                    JWPrincipalCode: 1,
                    state: "$primaryAddress.state",
                    city: "$primaryAddress.city",
                    pinCode: "$primaryAddress.pinCode"
                }
            }
        ]);
        const mapHSNCategoryList = await getAllMapCategoryHSN(
            {status: OPTIONS.defaultStatus.ACTIVE, company: req.user.company},
            {HSNCode: 1, HSN: 1, productCategory: 1, igstRate: 1, sgstRate: 1, cgstRate: 1, ugstRate: 1}
        );
        return res.success({
            autoIncValues,
            HSNOptions,
            productCategoryOptions: productCategories,
            JWPrincipalOptions,
            mapHSNCategoryList
        });
    } catch (error) {
        console.error("getAllMasterData SKU Master JP15", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

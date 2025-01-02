const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllKITMasterAttributes} = require("../../../../models/production/helpers/KITMasterHelper");
const KITMasterRepository = require("../../../../models/production/repository/KITMasterRepository");
const {getAllKITCategory} = require("../../settings/KITCategory/KITCategory");
const {getAutoIncrementNumber} = require("../../../../helpers/utility");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {filteredSaleHSNList} = require("../../../../models/sales/repository/salesHSNRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const CompanyRepository = require("../../../../models/settings/repository/companyRepository");
const { getAllMapCategoryHSN } = require("../../sales/mapCategoryHSNMaster/mapCategoryHSN");
const { OPTIONS } = require("../../../../helpers/global.options");
const { getAllCustomerCategory } = require("../../settings/customerCategory/customerCategory");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllKITMasterAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await KITMasterRepository.getAllPaginate({
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
        const itemDetails = await KITMasterRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("KIT Master")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create KIT Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await KITMasterRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await KITMasterRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("KIT Master has been")
        });
    } catch (e) {
        console.error("update KIT Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await KITMasterRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("KIT Master")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("KIT Master");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById KIT Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await KITMasterRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("KIT Master");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById KIT Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const categoryList = await getAllKITCategory(req.user.company, null);
        let autoIncValues = {};
        let productCategories = [];
        if (categoryList.length > 0) {
            productCategories = categoryList.map(x => {
                return {
                    label: x.displayCategoryName,
                    value: x.displayCategoryName,
                    application: x.application,
                    productNumber: x.categoryName,
                    productCode: x.productCode,
                    key: x.categoryName
                };
            });
            for (const ele of categoryList) {
                autoIncValues[ele.categoryName] = getAutoIncrementNumber(
                    ele.categoryPrefix,
                    "",
                    ele.autoIncrementNo,
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
        const customerOptions = await filteredCustomerList([
            {$match: {company: ObjectId(req.user.company), isCustomerActive: "A"}},
            {$sort: {customerName: 1}},
            {
                $addFields: {
                    customerBillingAddress: {$arrayElemAt: ["$customerBillingAddress", 0]}
                }
            },
            {
                $project: {
                    label: "$customerName",
                    value: "$_id",
                    currency: "$customerCurrency",
                    customerCode: 1,
                    customerBillingState: "$customerBillingAddress.state",
                    customerBillingCity: "$customerBillingAddress.city",
                    customerBillingPinCode: "$customerBillingAddress.pinCode"
                }
            }
        ]);
        const rateTypeOptions = await getAllModuleMaster(req.user.company, "CUSTOMER_RATE_TYPE");
        const WXLDimensionsUnit = await getAllModuleMaster(req.user.company, "WXL_DIMENSIONS_UNIT");
        const companyObj = await CompanyRepository.getDocById(req.user.company, {companyType: 1});
        const mapHSNCategoryList = await getAllMapCategoryHSN(
            {status: OPTIONS.defaultStatus.ACTIVE, company: req.user.company},
            {HSNCode: 1, HSN: 1, productCategory: 1, igstRate: 1, sgstRate: 1, cgstRate: 1, ugstRate: 1}
        );
        let customerCatOptions = await getAllCustomerCategory(req.user.company);
        if (customerCatOptions?.length) {
            customerCatOptions = customerCatOptions.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            });
        }
        return res.success({
            autoIncValues,
            productCategories,
            HSNOptions,
            customerOptions,
            rateTypeOptions,
            companyType: companyObj.companyType,
            WXLDimensionsUnit,
            mapHSNCategoryList,
            customerCatOptions
        });
    } catch (error) {
        console.error("getAllMasterData KIT Master", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

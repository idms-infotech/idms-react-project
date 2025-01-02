const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/planning/productMasterModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const units = require("../../../../mocks/unit.json");
const {default: mongoose} = require("mongoose");
const {getAllProductMasterAttributes} = require("../../../../models/planning/helpers/productMasterHelper");
const {PRODUCT_MASTER} = require("../../../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {filteredHSNList} = require("../../../../models/purchase/repository/hsnRepository");
const {getAllProductMasterAggregate} = require("../../../../models/planning/repository/productMasterRepository");
const {filteredProductCategoryMasterList} = require("../../../../models/settings/repository/productCategoryRepository");
const ObjectId = mongoose.Types.ObjectId;
const {getAllModuleMaster} = require("../../settings/module-master/module-master");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllProductMasterAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            }
        ];

        let rows = await getAllProductMasterAggregate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllProductMaster", e);
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
                message: MESSAGES.apiSuccessStrings.ADDED("Product Master")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Product Master", e);
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
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Product Master has been")
        });
    } catch (e) {
        console.error("update Product Master", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Product Master")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Product Master");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Product Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Product Master");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Product Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const productCategories = await filteredProductCategoryMasterList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {$sort: {seq: 1}},
            {
                $project: {
                    productNumber: 1,
                    productCode: 1,
                    displayProductCategoryName: 1,
                    application: 1
                }
            }
        ]);
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...PRODUCT_MASTER.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        let hsnCodes = await filteredHSNList([
            {$match: {company: ObjectId(req.user.company), isActive: "Y"}},
            {$sort: {createdAt: -1}},
            {
                $project: {
                    _id: 1,
                    hsnCode: 1
                }
            }
        ]);
        let WXLDimensionsUnit = await getAllModuleMaster(req.user.company, "WXL_DIMENSIONS_UNIT");
        return res.success({
            autoIncrementNo,
            hsnCodes,
            UOMOptions: units.map(x => {
                return {
                    value: x.value,
                    label: x.label
                };
            }),
            // productCategories: productCategories?.split(",")?.map(x => {
            //     return {
            //         label: x,
            //         value: x
            //     };
            // })
            productCategories: productCategories.map(x => {
                return {
                    label: x.displayProductCategoryName,
                    value: x.displayProductCategoryName,
                    application: x.application,
                    productNumber: x.productNumber,
                    productCode: x.productCode
                };
            }),
            WXLDimensionsUnit: WXLDimensionsUnit?.map(x => x.value)
        });
    } catch (error) {
        console.error("getAllMasterData SKU", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllProductMaster = async (company, project = {}) => {
    try {
        let rows = await Model.find({isActive: "A", company: company}, project).sort({createdAt: -1});
        return rows;
    } catch (e) {
        console.error("getAllProductMaster", e);
    }
};

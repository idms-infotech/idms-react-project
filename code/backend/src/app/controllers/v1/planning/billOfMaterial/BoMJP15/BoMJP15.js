const {ObjectId} = require("../../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../../helpers/messages.options");
const {getAllBillOfMaterialJP15Attributes} = require("../../../../../models/planning/helpers/BoMJP15Helper");
const {getAndSetAutoIncrementNo} = require("../../../settings/autoIncrement/autoIncrement");
const {BOM_JP15} = require("../../../../../mocks/schemasConstant/planningConstant");
const BillOfMaterialJP15Repository = require("../../../../../models/planning/repository/BoMJP15Repository");
const {filteredSKUMasterJP15List} = require("../../../../../models/planning/repository/SKUMasterJP15Repository");
const {OPTIONS} = require("../../../../../helpers/global.options");
const {
    filteredPlanningItemMasterList
} = require("../../../../../models/planning/repository/planningItemMasterRepository");
const {getAllCheckedItemJPList} = require("../../../settings/itemCategoryJP/itemCategoryJP");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllBillOfMaterialJP15Attributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await BillOfMaterialJP15Repository.getAllPaginate({
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
        const itemDetails = await BillOfMaterialJP15Repository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Bill Of Material JP15")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Bill Of Material JP15", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await BillOfMaterialJP15Repository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await BillOfMaterialJP15Repository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Bill Of Material JP15 has been")
        });
    } catch (e) {
        console.error("update Bill Of Material JP15", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await BillOfMaterialJP15Repository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Bill Of Material JP15")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Bill Of Material JP15");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Bill Of Material JP15", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await BillOfMaterialJP15Repository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Bill Of Material JP15");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Bill Of Material JP15", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(BOM_JP15.AUTO_INCREMENT_DATA(), req.user.company, false);
        const SKUMasterJP15Options = await filteredSKUMasterJP15List([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {
                    SKUMasterJP15: "$_id",
                    SKUCode: "$SKUNo",
                    SKUName: 1,
                    SKUDescription: 1,
                    UOM: 1
                }
            }
        ]);
        let itemCategoriesList = await getAllCheckedItemJPList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            BOM: true
        });
        itemCategoriesList = itemCategoriesList?.map(x => x?.category);
        let itemsList = await filteredPlanningItemMasterList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(req.user.company),
                    itemCategory: {$in: itemCategoriesList}
                }
            },
            {
                $addFields: {
                    JWPrincipalDetails: {$first: "$JWPrincipalDetails"}
                }
            },
            {
                $unwind: {
                    path: "$JWPrincipalDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    item: "$_id",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    partNo: "$JWPrincipalDetails.mfrPartNo",
                    UOM: 1,
                    partCount: {$literal: 0},
                    unitCost: "$JWPrincipalDetails.itemValue",
                    materialCost: {$literal: 0},
                    _id: 0
                }
            },
            {
                $sort: {itemCode: 1}
            }
        ]);
        return res.success({autoIncrementNo, SKUMasterJP15Options, itemsList});
    } catch (error) {
        console.error("getAllMasterData Bill Of Material JP15", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

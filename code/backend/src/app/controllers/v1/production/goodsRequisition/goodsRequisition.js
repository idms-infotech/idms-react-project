const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/production/goodsRequisitionModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const mongoose = require("mongoose");
const {getAllInventoryCorrectionByItems} = require("../../stores/Inventory/Inventory");
const {getAllItemCategory} = require("../../purchase/itemCategoryMaster/itemCategoryMaster");
const {getAllUsers} = require("../../settings/user/user");
const {getCompanyLocations} = require("../../settings/company/company");
const {
    getAllGoodsRequisitionAttributes,
    getAllFilterDataAttributes
} = require("../../../../models/production/helpers/goodsRequisitionHelper");
const {GOODS_REQUISITION} = require("../../../../mocks/schemasConstant/productionConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const GRRepository = require("../../../../models/production/repository/GRRepository");
const ItemRepository = require("../../../../models/purchase/repository/itemRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let usersList = await getAllUsers(req.user.company);
        usersList = usersList.find(x => x._id == req.user.sub);
        let project = getAllGoodsRequisitionAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    GRStatus: {$nin: OPTIONS.defaultStatus.getAllFilterStatusArray(["APPROVED", "REJECTED"])},
                    ...(!!usersList.departmentName && {department: usersList.departmentName})
                }
            },
            {
                $addFields: {
                    GRDateS: {$dateToString: {format: "%d-%m-%Y", date: "$GRDate"}}
                }
            }
        ];
        let rows = await GRRepository.getAllPaginate({pipeline, project, queryParams: req.query});
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
        createdObj.GRDetails = createdObj.GRDetails.map(ele => {
            ele.balancedQty = ele.GRQty;
            ele.issueQty = 0;
            return ele;
        });
        let inventoryRecords = await getAllInventoryCorrectionByItems(req.user.company, createdObj.GRDetails);
        let codes = createdObj.GRDetails.filter(x => {
            if (inventoryRecords.length) {
                return !inventoryRecords.map(y => y.item._id).some(ele => String(ele) == String(x.item));
            } else {
                return true;
            }
        });
        let itemCodes = codes.map(x => x.itemCode);
        const saveObj = new Model(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Goods Requisition"),
                itemCodes
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create GR", e);
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
            message: `Goods Requisition has been ${
                itemDetails.GRStatus == OPTIONS.defaultStatus.OPENED ? "updated" : itemDetails.GRStatus.toLowerCase()
            } successfully`
        });
    } catch (e) {
        console.error("update GR", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Goods Requisition")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Goods Requisition");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Goods Requisition", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id).populate(
            "GRDetails.item",
            "itemCode itemType conversionOfUnits itemSubCategory itemName itemDescription primaryUnit secondaryUnit secondaryToPrimaryConversion"
        );
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Goods Requisition");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Goods Requisition", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData HSN Record
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const itemCategoryList = await getAllItemCategory(req.user.company, {category: 1});
        const location = await getCompanyLocations(req.user.company);
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...GOODS_REQUISITION.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        return res.success({
            autoIncrementNo,
            itemCategoryOptions: ["All", ...itemCategoryList.map(x => x.category)],
            locationOptions: location?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            })
        });
    } catch (error) {
        console.error("getAllMasterData Goods Requisition", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllGR = asyncHandler(async company => {
    try {
        let rows = await Model.find({
            GRStatus: OPTIONS.defaultStatus.APPROVED,
            "GRDetails.balancedQty": {$gt: 0},
            company: company
        })
            .populate("GRDetails.item", "itemCode itemName itemDescription")
            .sort({createdAt: -1});
        return rows;
    } catch (e) {
        console.error("getAllGR", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllFilterData = asyncHandler(async (req, res) => {
    try {
        const {itemGroup = null, itemCategory = null} = req.query;
        let project = getAllFilterDataAttributes();
        let query = {
            company: ObjectId(req.user.company),
            ...(!!itemGroup && {
                itemType: itemGroup == "All" ? {$exists: true} : itemGroup
            }),
            ...(!!itemCategory && {
                itemSubCategory: itemCategory
            })
        };
        let pipeline = [
            {$match: query},
            {
                $project: {
                    itemName: 1,
                    itemCode: 1,
                    itemDescription: 1,
                    conversionOfUnits: 1,
                    primaryUnit: 1,
                    itemType: 1,
                    itemSubCategory: 1,
                    createdAt: 1,
                    _id: 1
                }
            },
            {
                $lookup: {
                    from: "InventoryCorrection",
                    localField: "_id",
                    foreignField: "item",
                    pipeline: [
                        {
                            $group: {
                                _id: {itemId: "$item", UOM: "$UOM"},
                                closedIRQty: {$sum: "$closedIRQty"}
                            }
                        },
                        {
                            $project: {
                                closedIRQty: 1,
                                UOM: "$_id.UOM"
                            }
                        }
                    ],
                    as: "inventory"
                }
            },
            {
                $unwind: "$inventory"
            },
            {
                $project: project
            }
        ];
        let rows = await ItemRepository.filteredItemList(pipeline);
        return res.success(rows);
    } catch (e) {
        console.error("getAllFilterData", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getGRById = asyncHandler(async GRId => {
    try {
        let row = await Model.findOne(
            {
                _id: ObjectId(GRId)
            },
            {
                _id: 0,
                "GRDetails.GRQty": 1,
                deliveryLocation: 1,
                GRDate: 1,
                "GRDetails.balancedQty": 1,
                "GRDetails.GRLineNumber": 1,
                "GRDetails.primaryUnit": 1
            }
        ).populate("GRDetails.item", "itemCode itemName");
        return row;
    } catch (e) {
        console.error("getGRById", e);
    }
});

exports.updateGRQtyOnGIUpdate = asyncHandler(async (updatedBy, GRId, grLineNumber, updateItemId, receivedQty) => {
    try {
        const goodsRequisition = await Model.findById(GRId);
        if (goodsRequisition) {
            const newGRDetails = goodsRequisition.GRDetails.map(ele => {
                if (ele.GRLineNumber === grLineNumber && ele.item.toString() === updateItemId.toString()) {
                    ele.balancedQty = ele.balancedQty + ele.previousGRQty - receivedQty;
                    ele.previousGRQty = receivedQty;
                }
                return ele;
            });
            goodsRequisition.updatedBy = updatedBy;
            goodsRequisition.GRDetails = newGRDetails;
            const updatedGoodsRequisition = await goodsRequisition.save();
            return updatedGoodsRequisition;
        }
    } catch (error) {
        console.error("updatedGoodsRequisition::::: Error in updating Goods Requisition ======= ", error);
    }
});
exports.updateGRQtyOnGICreate = asyncHandler(async (updatedBy, GRId, grLineNumber, updateItemId, receivedQty) => {
    try {
        const goodsRequisition = await Model.findById(GRId);
        if (goodsRequisition) {
            const newGRDetails = goodsRequisition.GRDetails.map(ele => {
                if (ele.GRLineNumber === grLineNumber && ele.item.toString() === updateItemId.toString()) {
                    if (ele.balancedQty === receivedQty) {
                        ele.GRLineStatus = OPTIONS.defaultStatus.OPENED;
                    }
                    ele.balancedQty = ele.balancedQty - receivedQty;
                    ele.previousGRQty = receivedQty;
                }
                return ele;
            });
            goodsRequisition.updatedBy = updatedBy;
            goodsRequisition.GRDetails = newGRDetails;
            const updatedGoodsRequisition = await goodsRequisition.save();
            return updatedGoodsRequisition;
        }
    } catch (error) {
        console.error("updatedGoodsRequisition::::: Error in updating Goods Requisition ======= ", error);
    }
});

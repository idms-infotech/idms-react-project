const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/planning/stockTransferToStoreModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {outputData, getAllAggregationFooter} = require("../../../../helpers/utility");
const {getMatchData, generateCreateData} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getAllWIPInventory, updateWIPInventory} = require("../WIPInventory/WIPInventory");
const {getAllItemCategory} = require("../../purchase/itemCategoryMaster/itemCategoryMaster");
const {updateInventoryOnStockTransferToStore} = require("../../stores/Inventory/Inventory");
const {getAllItems} = require("../../purchase/items/items");
const {getDateDiff, dateToAnyFormat, getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {
    getAllStockTransferToStoreReportsAttributes
} = require("../../../../models/planning/helpers/stockTransferToStoreHelper");
const {STOCK_TRANSFER_TO_STORE} = require("../../../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {getAllDepartments} = require("../../settings/department/department");
const ObjectId = mongoose.Types.ObjectId;
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
        let project = {
            // issueDate: {$dateToString: {format: "%d-%m-%Y", date: "$issueDate"}},
            // MRNNumber: "$stockIssueDetails.MRNNumber",
            // itemCode: "$stockIssueDetails.itemCode",
            // itemName: "$stockIssueDetails.itemName",
            // stage: "$stockIssueDetails.stage",
            // width: "$stockIssueDetails.width",
            // length: "$stockIssueDetails.length",
            // qty: "$stockIssueDetails.qty",
            // UOM: "$stockIssueDetails.UOM",
            // issueQty: "$stockIssueDetails.issueQty",
            // createdAt: 1,
            // status: 1,
        };
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([
            {$match: {company: ObjectId(req.user.company)}},

            {$unwind: "$stockIssueDetails"},

            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            ...outputData(rows)
        });
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
            for (const ele of itemDetails.stockTransferDetails) {
                updateWIPInventory(ele.WIPId, ele.transferQty, req.user.company);
                updateInventoryOnStockTransferToStore(ele.item, ele.transferQty, req.user.company);
            }
            res.success({
                message: "Stock Transfer to Store has been Done successfully"
            });
        }
    } catch (e) {
        console.error("create Stock Transfer to Store", e);
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
        if (itemDetails) {
            res.success({
                message: "Stock Transfer to Store has been updated successfully"
            });
        }
    } catch (e) {
        console.error("update Stock Transfer to Store", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Stock Transfer to Store")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Stock Transfer to Store");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Stock Transfer to Store", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Stock Transfer to Store");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Stock Transfer to Store", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const WIPList = await getAllWIPInventory(req.user.company);
        const itemCategoryList = await getAllItemCategory(req.user.company);
        const department = await getAllDepartments(req.user.company, {
            label: "$departmentName",
            value: "$departmentName",
            _id: 0
        });
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...STOCK_TRANSFER_TO_STORE.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        return res.success({
            autoIncrementNo,
            WIPList,
            itemCategoryList,
            department: department
        });
    } catch (error) {
        console.error("getAllMasterData Stock Transfer", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllReports = asyncHandler(async (req, res) => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    let itemsList = await getAllItems(req.user.company);
    try {
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1,
            item = null,
            fromDate = null,
            toDate = null
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let project = getAllStockTransferToStoreReportsAttributes();
        let match = await getMatchData(project, search);
        let query = {
            company: ObjectId(req.user.company),
            ...(!!toDate &&
                !!fromDate && {
                    stockTransferDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([
            {
                $match: query
            },
            {$unwind: "$stockTransferDetails"},
            {
                $match: {
                    ...(!!item && {
                        "stockTransferDetails.item": {$eq: ObjectId(item)}
                    })
                }
            },
            {
                $addFields: {
                    expiryDate: {
                        $dateAdd: {
                            startDate: "$stockTransferDetails.GINDate",
                            unit: "month",
                            amount: "$stockTransferDetails.shelfLife"
                        }
                    }
                }
            },
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        if (rows[0].data.length > 0) {
            for (const ele of rows[0].data) {
                if (!!ele.expiryDate) {
                    ele.expiryDate = dateToAnyFormat(ele.expiryDate, "YYYY-MM-DD");
                    let dateDiff = getDateDiff(ele.expiryDate, currentDate, "days");
                    if (+dateDiff < 0) {
                        ele.status = "red";
                    } else if (+dateDiff > 0 && +dateDiff < 30) {
                        ele.status = "orange";
                    } else {
                        ele.status = "green";
                    }
                } else {
                    ele.status = "green";
                }
            }
        }
        return res.success({
            ...outputData(rows),
            itemsList: itemsList.map(x => {
                return {
                    label: x.itemName,
                    value: x._id
                };
            })
        });
    } catch (e) {
        console.error("getAllStockTransferReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

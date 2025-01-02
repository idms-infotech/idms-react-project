const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/planning/stockIssueToProductionModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {outputData, getAllAggregationFooter} = require("../../../../helpers/utility");
const {getMatchData, generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getAllSFGStock, updateSFGQtyOnStockIssue} = require("../SFGStock/SFGStock");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {
    getAllStockIssueToProductionAttributes,
    getAllStockIssueToProductionExcelAttributes,
    getAllStockIssueToProductionReportsAttributes
} = require("../../../../models/planning/helpers/stockIssueToProductionHelper");
const {STOCK_ISSUE_TO_PRODUCTION} = require("../../../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {
    getAllStockIssueToProductionAggregate
} = require("../../../../models/planning/repository/stockIssueToProductionRepository");
const {getAllDepartments} = require("../../settings/department/department");
const ObjectId = mongoose.Types.ObjectId;
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllStockIssueToProductionAttributes();
        if (req.query.excel == "true") {
            project = getAllStockIssueToProductionExcelAttributes();
        }
        let pipeline = [
            {
                $match: {
                    status: OPTIONS.defaultStatus.AWAITING_APPROVAL,
                    company: ObjectId(req.user.company)
                }
            },
            {$unwind: "$stockIssueDetails"},
            {
                $match: {
                    $or: [{"stockIssueDetails.qty": {$gt: 0}}, {"stockIssueDetails.sheetQty": {$gt: 0}}]
                }
            }
        ];

        let rows = await getAllStockIssueToProductionAggregate({pipeline, project, queryParams: req.query});
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
            res.success({
                message: "Stock Issue to Production has been created successfully"
            });
        }
    } catch (e) {
        console.error("create Stock Issue to Production", e);
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
        if (itemDetails.status == OPTIONS.defaultStatus.APPROVED) {
            itemDetails.stockIssueDetails.map(ele => {
                let noOfSlits = +ele.qty;
                if (ele.stage == "SFG-Roll") {
                    ele.qty = +((+ele.PPICIRQty - +ele.issueQty) / +ele.sqmPerRoll);
                    ele.qty = +noOfSlits - +ele.qty;
                    ele.sheetQty = 0;
                } else {
                    ele.sheetQty = +((+ele.issueQty * 1000000) / (+ele.width * +ele.length));
                    ele.qty = 0;
                }
                ele.PPICIRQty = +ele.PPICIRQty - +ele.issueQty;
                return ele;
            });
        }
        itemDetails = await itemDetails.save();
        if (itemDetails) {
            if (itemDetails.status == OPTIONS.defaultStatus.APPROVED) {
                await updateSFGQtyOnStockIssue(itemDetails.stockIssueDetails, req.user.company);
            }

            res.success({
                message: "Stock Issue to Production has been updated successfully"
            });
        }
    } catch (e) {
        console.error("update Stock Issue to Production", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Stock Issue to Production")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Stock Issue to Production");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Stock Issue to Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Stock Issue to Production");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Stock Issue to Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const SFGList = await getAllSFGStock(req.user.company);
        const department = await getAllDepartments(req.user.company, {
            label: "$departmentName",
            value: "$departmentName",
            _id: 0
        });
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...STOCK_ISSUE_TO_PRODUCTION.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        return res.success({
            autoIncrementNo,
            SFGList,
            department: department,
            stage: [
                {
                    label: "SFG-Roll",
                    value: "SFG-Roll"
                },
                {
                    label: "SFG-Sheet",
                    value: "SFG-Sheet"
                }
            ]
        });
    } catch (error) {
        console.error("getAllMasterData Stock Issue", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const departments = await getAllDepartments(req.user.company, {
            label: "$departmentName",
            value: "$departmentName",
            _id: 0
        });
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1,
            department = null,
            fromDate = null,
            toDate = null
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let project = getAllStockIssueToProductionReportsAttributes();
        let match = await getMatchData(project, search);
        let query = {
            company: ObjectId(req.user.company),
            status: OPTIONS.defaultStatus.APPROVED,
            ...(!!department && {
                department: department
            }),
            ...(!!toDate &&
                !!fromDate && {
                    issueDate: {
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
            {$unwind: "$stockIssueDetails"},
            {
                $match: {
                    $or: [{"stockIssueDetails.qty": {$gt: 0}}, {"stockIssueDetails.sheetQty": {$gt: 0}}]
                }
            },
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            ...outputData(rows),
            department: departments
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

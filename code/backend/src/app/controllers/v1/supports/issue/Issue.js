const {default: mongoose} = require("mongoose");
const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/supports/issueModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {outputData, getAllAggregationFooter, removeSingleFileInError} = require("../../../../helpers/utility");
const {generateCreateData, getMatchData} = require("../../../../helpers/global.options");
const {getEndDateTime, getStartDateTime, dateToAnyFormat} = require("../../../../helpers/dateTime");
const {
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFirstDayOfFiscalYear,
    getLastDayOfFiscalYear,
    getFirstDateOfMonth,
    getLastDateOfMonth
} = require("../../../../utilities/utility");
const {getAllMenuItemsList} = require("../../settings/menuItem/menuItem");
const {getAllSubModuleList} = require("../../settings/subModuleManagement/subModuleManagement");
const {getCompanyId} = require("../../settings/company/company");
const {
    getAllIssueAttributes,
    getAllIssueReportsAttributes
} = require("../../../../models/supports/helpers/issueHelper");
const {getIssueMailConfig} = require("./IssueMail");
const ObjectId = mongoose.Types.ObjectId;
const {ISSUE} = require("../../../../mocks/schemasConstant/supportConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {ISSUE_TICKET_TYPE, PRIORITY, ISSUE_SEVERITY} = require("../../../../mocks/issueAppParameter");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "issueNumber",
            direction = -1
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let project = getAllIssueAttributes();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([
            {$match: {company: ObjectId(req.user.company)}},
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            ...outputData(rows)
        });
    } catch (e) {
        console.error("getAllIssue", e);
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
        if (req.file) {
            if (req.file.filename) {
                createdObj["issueAttachment"] = req.file.filename;
            }
        }
        const saveObj = new Model(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            res.success({
                message: `Issue has been ${itemDetails.issueStatus.toLowerCase()} successfully`
            });
            let mailCreateObj = {
                issueId: itemDetails._id,
                company: req.user.company,
                mailAction: "Open"
            };
            getIssueMailConfig(mailCreateObj);
        }
    } catch (e) {
        console.error("create Issue", e);
        if (req.file) {
            removeSingleFileInError(req.file);
        }
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
        if (req.file && req.file.filename) {
            // if (itemDetails.issueAttachment) {
            //     removeFile(`${req.file.destination}/${itemDetails.issueAttachment}`);
            // }
            itemDetails.issueAttachment = req.file.filename;
        }
        itemDetails = await itemDetails.save();
        if (itemDetails) {
            res.success({
                message: `Issue has been ${itemDetails.issueStatus.toLowerCase()} successfully`
            });
            let mailUpdateObj = {
                issueId: itemDetails._id,
                company: req.user.company,
                mailAction: itemDetails.issueStatus
            };
            getIssueMailConfig(mailUpdateObj);
        }
    } catch (e) {
        console.error("update Issue", e);
        if (req.file) {
            removeSingleFileInError(req.file);
        }
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
                message: MESSAGES.apiSuccessStrings.DELETED("ISSUE")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("ISSUE");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById ISSUE", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Issue");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Issue", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let response = await this.getAllMasterDataSupport(req.user.company);
        res.success(response);
    } catch (error) {
        console.error("getAllMasterDataForIssue", error);
        res.status(400);
        throw new Error("Invalid Model data");
    }
});
exports.getAllMasterDataSupport = async () => {
    try {
        let company = await getCompanyId();
        const autoIncrementNo = await getAndSetAutoIncrementNo(ISSUE.AUTO_INCREMENT_DATA(), company);
        let moduleList = await getAllMenuItemsList(company, "main", {title: 1, menuOrder: 1});
        let filterArray = ["Settings", "Powered by IDMS"];
        moduleList = moduleList.filter(x => !filterArray.includes(x.title));
        let result = {
            autoIncrementNo,
            moduleList,
            ticketType: ISSUE_TICKET_TYPE,
            priority: PRIORITY
        };
        return result;
    } catch (error) {
        console.error("getAllMasterDataSupport", error);
    }
};

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1,
            fromDate = null,
            toDate = null,
            status = null
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let project = getAllIssueReportsAttributes();
        let match = await getMatchData(project, search);
        let query = {
            company: ObjectId(req.user.company),
            ...(!!toDate &&
                !!fromDate && {
                    issueDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                }),
            ...(!!status && {
                issueStatus: status
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
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            ...outputData(rows)
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllIssue = asyncHandler(async company => {
    try {
        let rows = await Model.find(
            {
                company: company,
                issueStatus: true
            },
            {issueNumber: 1, issueTitle: 1}
        ).sort({createdAt: -1});
        return rows;
    } catch (e) {
        console.error("getAllIssue", e);
    }
});

exports.getAllTicketsCounts = async company => {
    try {
        const result = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company)
                    // createdAt: {
                    //     $gte: getFirstDateOfCurrentFiscalYear(),
                    //     $lte: getLastDateOfCurrentFiscalYear(),
                    // },
                }
            },
            {
                $group: {
                    _id: null,
                    WIPCount: {$sum: {$cond: [{$eq: ["$issueStatus", "In Progress"]}, 1, 0]}},
                    fixedCount: {$sum: {$cond: [{$eq: ["$issueStatus", "Fixed"]}, 1, 0]}},
                    closedTicketsCount: {$sum: {$cond: [{$eq: ["$issueStatus", "Closed"]}, 1, 0]}},
                    deployedOnProductionTicketsCount: {
                        $sum: {$cond: [{$eq: ["$issueStatus", "Deployed on Production"]}, 1, 0]}
                    },
                    verifiedTicketsCount: {$sum: {$cond: [{$eq: ["$issueStatus", "Verified"]}, 1, 0]}},
                    reopenTicketsCount: {$sum: {$cond: [{$eq: ["$issueStatus", "Reopened"]}, 1, 0]}}
                }
            },
            {
                $project: {
                    WIPCount: "$WIPCount",
                    fixedCount: "$fixedCount",
                    closedTicketsCount: "$closedTicketsCount",
                    deployedOnProductionTicketsCount: "$deployedOnProductionTicketsCount",
                    verifiedTicketsCount: "$verifiedTicketsCount",
                    reopenTicketsCount: "$reopenTicketsCount",
                    allIssueCount: {
                        $sum: [
                            "$openTicketsCount",
                            "WIPCount",
                            "$fixedCount",
                            "$closedTicketsCount",
                            "$deployedOnProductionTicketsCount",
                            "$verifiedTicketsCount",
                            "$reopenTicketsCount"
                        ]
                    }
                }
            }
        ]);
        if (result.length > 0) {
            return result[0];
        }
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};

exports.getTicketTypeGraphCount = async company => {
    try {
        const statusArray = ISSUE_TICKET_TYPE.map(x => x.label);
        let supportCountData = [0, 0, 0, 0, 0];
        const result = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company),
                    issueDate: {
                        $gte: getFirstDateOfCurrentFiscalYear(),
                        $lte: getLastDateOfCurrentFiscalYear()
                    }
                }
            },
            {
                $group: {
                    _id: "$ticketType",
                    count: {$sum: 1}
                }
            },
            {
                $project: {
                    ticketType: "$_id",
                    count: 1
                }
            }
        ]);
        if (result.length > 0) {
            supportCountData = [];
            for (let i = 0; i < statusArray.length; i++) {
                const element = statusArray[i];
                let count = result.find(x => x.ticketType == element)?.count ?? 0;
                if (count != "undefined") {
                    supportCountData.push(count);
                }
            }
        }
        return {
            status: statusArray,
            data: supportCountData
        };
    } catch (error) {
        console.error(error);
    }
};

exports.getSeverityCount = async company => {
    try {
        const statusArray = ISSUE_SEVERITY.map(x => x.label);
        let supportCountData = [0, 0, 0, 0, 0];
        const result = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company),
                    issueDate: {
                        $gte: getFirstDateOfCurrentFiscalYear(),
                        $lte: getLastDateOfCurrentFiscalYear()
                    }
                }
            },
            {
                $group: {
                    _id: "$severity",
                    count: {$sum: 1}
                }
            },
            {
                $project: {
                    severity: "$_id",
                    count: 1
                }
            }
        ]);
        if (result.length > 0) {
            supportCountData = [];
            for (let i = 0; i < statusArray.length; i++) {
                const element = statusArray[i];
                let count = result.find(x => x.severity == element)?.count ?? 0;
                if (count != "undefined") {
                    supportCountData.push(count);
                }
            }
        }
        return {
            status: statusArray,
            data: supportCountData
        };
    } catch (error) {
        console.error(error);
    }
};

exports.getAllSubModuleListByMenuId = asyncHandler(async (req, res) => {
    try {
        const subModuleList = await getAllSubModuleList(req.params.id);
        return res.success(subModuleList);
    } catch (e) {
        console.error("getAllSubModuleListByMenuId", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSubModuleListByMenuIdSupport = asyncHandler(async (req, res) => {
    try {
        const subModuleList = await getAllSubModuleList(req.params.id);
        return res.success(subModuleList);
    } catch (e) {
        console.error("getAllSubModuleListByMenuId", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllYTDTicketsCounts = async company => {
    try {
        const rows = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$issueDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDayOfFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDayOfFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    count: {$sum: 1}
                }
            },
            {
                $project: {
                    _id: 0,
                    count: 1
                }
            }
        ]);
        return rows.length > 0 ? rows[0].count : [];
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};

exports.getAllMTDTicketsCounts = async company => {
    try {
        const rows = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company),
                    issueDate: {$gte: getFirstDateOfMonth(), $lte: getLastDateOfMonth()}
                }
            },
            {
                $group: {
                    _id: null,
                    count: {$sum: 1}
                }
            },
            {
                $project: {
                    _id: 0,
                    count: 1
                }
            }
        ]);
        return rows.length > 0 ? rows[0].count : 0;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};

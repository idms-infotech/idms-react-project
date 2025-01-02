const Model = require("../../../../models/maintenance/workOrderGenerationModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {getAllMaintenanceChecklist} = require("../maintenanceTask/maintenanceTask");
const {default: mongoose} = require("mongoose");
const {
    getFirstDayOfFiscalYear,
    getLastDayOfFiscalYear,
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFiscalMonthsName
} = require("../../../../utilities/utility");
const {getEndDateTime, getStartDateTime, dateToAnyFormat} = require("../../../../helpers/dateTime");
const {
    getAllWorkOrderGenerationReportsAttributes,
    getAllWorkOrderGenerationAttributes
} = require("../../../../models/maintenance/helpers/workOrderGenerationHelper");
const {LAKH} = require("../../../../mocks/number.constant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {WORK_ORDER_GENERATION} = require("../../../../mocks/schemasConstant/maintenanceConstant");
const {filteredTaskSchedulingList} = require("../../../../models/maintenance/repository/taskSchedulingRepository");
const {
    filteredMaintenanceTechnicianList
} = require("../../../../models/maintenance/repository/maintenanceTechnicianRepository");
const WOGenerationRepository = require("../../../../models/maintenance/repository/workOrderGenerationRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {PRIORITY} = require("../../../../mocks/issueAppParameter");
const ObjectId = mongoose.Types.ObjectId;

exports.create = async (req, res) => {
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
                message: MESSAGES.apiSuccessStrings.ADDED("Work Order Generation")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Work Order Generation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAll = async (req, res) => {
    try {
        let project = getAllWorkOrderGenerationAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $addFields: {
                    startDateS: {$dateToString: {format: "%d-%m-%Y", date: "$startDate"}},
                    endDateS: {$dateToString: {format: "%d-%m-%Y", date: "$endDate"}}
                }
            },
            {
                $lookup: {
                    from: "TaskScheduling",
                    localField: "schedule",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, scheduleCode: 1}}],
                    as: "schedule"
                }
            },
            {$unwind: "$schedule"},
            {
                $lookup: {
                    from: "MaintenanceTechnician",
                    localField: "technician",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, technicianCode: 1}}],
                    as: "technician"
                }
            },
            {$unwind: "$technician"}
        ];
        let rows = await WOGenerationRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAll Work Order Generation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getById = async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Work Order Generation");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Work Order Generation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.deleteById = async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Work Order Generation")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Work Order Generation");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Work Order Generation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.update = async (req, res) => {
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
            message: MESSAGES.apiSuccessStrings.UPDATE("Work Order Generation has been")
        });
    } catch (e) {
        console.error("update Work Order Generation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAllWorkOrders = async company => {
    try {
        let rows = await Model.find({
            company: company
        }).sort({workOrderCode: -1});
        return rows;
    } catch (e) {
        console.error("getAllWorkOrders", e);
    }
};

exports.getAllMasterData = async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...WORK_ORDER_GENERATION.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        const scheduleCodeOptions = await filteredTaskSchedulingList([
            {$match: {company: ObjectId(req.user.company), status: OPTIONS.defaultStatus.SCHEDULED}},
            {$sort: {createdAt: -1}},
            {
                $project: {
                    _id: 1,
                    label: {$concat: ["$scheduleCode", " - ", "$equipmentName"]},
                    value: "$_id",
                    equipmentName: 1,
                    equipment: 1
                }
            }
        ]);
        const technicianCodeOptions = await filteredMaintenanceTechnicianList([
            {$match: {company: ObjectId(req.user.company), technicianStatus: OPTIONS.defaultStatus.ACTIVE}},
            {$sort: {technicianCode: -1}},
            {
                $project: {
                    _id: 1,
                    label: {$concat: ["$technicianCode", " - ", "$technicianName"]},
                    value: "$_id"
                }
            }
        ]);
        const workOrderGenerateStatusOptions = await getAllModuleMaster(req.user.company, "WORK_ORDER_GENERATE_STATUS");
        return res.success({
            priorityOptions: PRIORITY,
            workOrderGenerateStatusOptions,
            autoIncrementNo,
            scheduleCodeOptions,
            technicianCodeOptions
        });
    } catch (error) {
        console.error("getAllMasterData Work Order Generation", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.viewChecklistById = async (req, res) => {
    try {
        let rows = await getAllMaintenanceChecklist(req.params.id);
        return res.success({
            rows
        });
    } catch (e) {
        console.error("viewChecklist", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAllReports = async (req, res) => {
    try {
        const taskStatus = await getAllModuleMaster(req.user.company, "TASK_STATUS");
        const {priority = null, status = null, toDate = null, fromDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!priority && {
                priority: priority
            }),
            ...(!!status && {
                status: status
            }),
            ...(!!toDate &&
                !!fromDate && {
                    startDate: {$gte: getStartDateTime(fromDate)},
                    endDate: {$lte: getEndDateTime(toDate)}
                })
        };
        let project = getAllWorkOrderGenerationReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    createdAtS: {$dateToString: {format: "%d-%m-%Y", date: "$createdAt"}}
                }
            },
            {
                $lookup: {
                    from: "Asset",
                    localField: "equipment",
                    foreignField: "_id",
                    pipeline: [{$project: {assetCode: 1, assetName: 1}}],
                    as: "equipment"
                }
            },
            {$unwind: "$equipment"},
            {
                $lookup: {
                    from: "MaintenanceTechnician",
                    localField: "technician",
                    foreignField: "_id",
                    pipeline: [{$project: {technicianName: 1}}],
                    as: "technician"
                }
            },
            {$unwind: "$technician"}
        ];
        let rows = await WOGenerationRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });

        return res.success({
            priorityValues: PRIORITY,
            taskStatus,
            ...rows
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getYTDMaintenanceCost = async company => {
    const result = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$endDate"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                status: OPTIONS.defaultStatus.COMPLETED,
                matchDate: {
                    $gte: dateToAnyFormat(getFirstDayOfFiscalYear(), "YYYY-MM-DD"),
                    $lte: dateToAnyFormat(getLastDayOfFiscalYear(), "YYYY-MM-DD")
                }
            }
        },
        {
            $group: {
                _id: null,
                totalCost: {$sum: "$maintenanceCost"}
            }
        },
        {
            $project: {
                _id: 1,
                totalCost: {$round: [{$divide: ["$totalCost", LAKH]}, 2]}
            }
        }
    ]);
    return result[0]?.totalCost || 0;
};

exports.getAllWorkOrderCompletedRate = async company => {
    const result = await Model.aggregate([
        {
            $match: {
                company: ObjectId(company)
            }
        },
        {
            $group: {
                _id: null,
                completedCount: {$sum: {$cond: [{$eq: ["$status", "Completed"]}, 1, 0]}},
                OthersCount: {$sum: {$cond: [{$ne: ["$status", "Completed"]}, 1, 0]}}
            }
        },
        {
            $project: {
                _id: 0,
                percentage: {$round: [{$multiply: [{$divide: ["$completedCount", "$OthersCount"]}, 100]}, 2]}
            }
        }
    ]);
    return result[0]?.percentage || 0;
};

exports.getMonthlyMaintenanceCost = async company => {
    try {
        const monthsArray = await getFiscalMonthsName();
        const maintenanceCostData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$endDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.COMPLETED,
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$endDate", 0, 7]}},
                    count: {$sum: "$maintenanceCost"}
                }
            },
            {
                $sort: {"_id.year_month": 1}
            },
            {
                $project: {
                    _id: 0,
                    count: 1,
                    month_year: {
                        $concat: [
                            {
                                $arrayElemAt: [
                                    monthsArray,
                                    {
                                        $subtract: [{$toInt: {$substrCP: ["$_id.year_month", 5, 2]}}, 4]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    data: {$push: {k: "$month_year", v: "$count"}}
                }
            },
            {
                $project: {
                    data: {$arrayToObject: "$data"},
                    _id: 0
                }
            }
        ]);
        if (result.length > 0) {
            const propertyNames = Object.keys(result[0].data);
            const propertyValues = Object.values(result[0].data);
            let n = 0;
            propertyNames.forEach(elem => {
                let index = monthsArray.indexOf(elem);
                maintenanceCostData[index] = propertyValues[n];
                n++;
            });

            let monthlyMaintenanceCost = {months: monthsArray, orders: maintenanceCostData};
            return monthlyMaintenanceCost;
        } else {
            let monthlyMaintenanceCost = {months: monthsArray, orders: maintenanceCostData};
            return monthlyMaintenanceCost;
        }
    } catch (error) {
        console.error(error);
    }
};

exports.getMonthlyWOStatusCount = async company => {
    try {
        const statusArray = OPTIONS.defaultStatus.getAllWorkOrderGenerationStatusAsArray();
        const maintenanceCostData = [0, 0, 0];
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$endDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    openCount: {$sum: {$cond: [{$eq: ["$status", "Open"]}, 1, 0]}},
                    inProgressCount: {$sum: {$cond: [{$eq: ["$status", "In Progress"]}, 1, 0]}},
                    completedCount: {$sum: {$cond: [{$eq: ["$status", "Completed"]}, 1, 0]}}
                }
            },
            {
                $project: {
                    _id: 0,
                    openCount: 1,
                    inProgressCount: 1,
                    completedCount: 1
                }
            }
        ]);
        if (result.length > 0) {
            maintenanceCostData[0] = result[0].openCount;
            maintenanceCostData[1] = result[0].inProgressCount;
            maintenanceCostData[2] = result[0].completedCount;
        }
        return {
            status: statusArray,
            data: maintenanceCostData
        };
    } catch (error) {
        console.error(error);
    }
};

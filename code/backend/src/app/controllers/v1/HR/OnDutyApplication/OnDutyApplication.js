const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/HR/onDutyApplicationModel");
const Employee = require("../../../../models/HR/employeeModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {findAllEmployees} = require("../employee/Employee");
const {default: mongoose} = require("mongoose");
const {
    getEndDateOfMonth,
    dateToAnyFormat,
    getDateDiff,
    getEndDateTime,
    getStartDateTime
} = require("../../../../helpers/dateTime");
const {
    getAllOnDutyApplicationAttributes,
    getAllOnDutyApplicationReportsAttributes
} = require("../../../../models/HR/helpers/onDutyApplicationHelper");
// const {getODApplicationMailConfig} = require("./OnDutyApplicationMail");
const {ON_DUTY_APPLICATION} = require("../../../../mocks/schemasConstant/HRConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {filteredEmployeeList} = require("../../../../models/HR/repository/employeeRepository");
const {filteredPaidHolidayList} = require("../../../../models/HR/repository/paidHolidayRepository");
const ODApplicationRepository = require("../../../../models/HR/repository/onDutyApplicationRepository");
const ObjectId = mongoose.Types.ObjectId;
const MailTriggerRepository = require("../../../../models/settings/repository/mailTriggerRepository");
const {HR_ADMIN_MAIL_CONST} = require("../../../../mocks/mailTriggerConstants");

// @route   GET /settings/OnDutyApplication/getAll

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {employeeId = null} = req.query;
        let project = getAllOnDutyApplicationAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$in: ["Submitted", "Cancelled"]},
                    ...(!!employeeId && {
                        employeeId: ObjectId(employeeId)
                    })
                }
            },
            {
                $addFields: {
                    applicationDateS: {$dateToString: {format: "%d-%m-%Y", date: "$applicationDate"}},
                    resumptionDateS: {$dateToString: {format: "%d-%m-%Y", date: "$resumptionDate"}},
                    fromDateS: {$dateToString: {format: "%d-%m-%Y", date: "$fromDate"}},
                    toDateS: {$dateToString: {format: "%d-%m-%Y", date: "$toDate"}},
                    ODDays: {$toString: "$ODDays"}
                }
            },
            {
                $lookup: {
                    from: "Employee",
                    localField: "employeeId",
                    foreignField: "_id",
                    pipeline: [{$project: {empCode: 1, empFullName: 1}}],
                    as: "employeeId"
                }
            },
            {$unwind: "$employeeId"}
        ];
        let rows = await ODApplicationRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllOnDutyApplication", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @route   POST /settings/OnDutyApplication/create
exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        createdObj.monthDays = [];
        let diff = new Date(createdObj.toDate).getMonth() - new Date(createdObj.fromDate).getMonth();

        if (diff > 0) {
            let endDate = getEndDateOfMonth(createdObj.fromDate);
            createdObj.monthDays = [
                {
                    date: dateToAnyFormat(createdObj.fromDate, "YYYY-MM"),
                    ODDays: getDateDiff(endDate, createdObj.fromDate, "days")
                },
                {
                    date: dateToAnyFormat(createdObj.toDate, "YYYY-MM"),
                    ODDays: new Date(dateToAnyFormat(createdObj.toDate, "YYYY-MM-DD")).getDate()
                }
            ];
        } else {
            createdObj.monthDays = [
                {
                    date: dateToAnyFormat(createdObj.fromDate, "YYYY-MM"),
                    ODDays: createdObj.ODDays
                }
            ];
        }

        const saveObj = new Model(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("On Duty Application")
            });
            // let mailCreateObj = {
            //     ODId: itemDetails._id,
            //     action: "created",
            //     company: req.user.company,
            //     mailAction: "Submit"
            // };
            // getODApplicationMailConfig(mailCreateObj);
            let mailTriggerCreateObj = {
                subModuleId: itemDetails._id,
                action: "created",
                company: req.user.company,
                mailAction: "Submit",
                collectionName: ON_DUTY_APPLICATION.COLLECTION_NAME,
                message: "Attention: Outdoor Duty application",
                module: HR_ADMIN_MAIL_CONST.OD_APP.MODULE,
                subModule: HR_ADMIN_MAIL_CONST.OD_APP.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create OnDutyApplication", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @route   PUT /settings/OnDutyApplication/update/:id
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await generateCreateData(itemDetails, req.body);
        itemDetails.monthDays = [];
        let diff = new Date(itemDetails.toDate).getMonth() - new Date(itemDetails.fromDate).getMonth();

        if (diff > 0) {
            let endDate = getEndDateOfMonth(itemDetails.fromDate);
            itemDetails.monthDays = [
                {
                    date: dateToAnyFormat(itemDetails.fromDate, "YYYY-MM"),
                    ODDays: getDateDiff(endDate, itemDetails.fromDate, "days")
                },
                {
                    date: dateToAnyFormat(itemDetails.toDate, "YYYY-MM"),
                    ODDays: new Date(dateToAnyFormat(itemDetails.toDate, "YYYY-MM-DD")).getDate()
                }
            ];
        } else {
            itemDetails.monthDays = [
                {
                    date: dateToAnyFormat(itemDetails.fromDate, "YYYY-MM"),
                    ODDays: itemDetails.ODDays
                }
            ];
        }
        itemDetails = await itemDetails.save();
        res.success({
            message: `On Duty Application has been ${
                itemDetails.status == "Submitted" ? "updated" : itemDetails.status.toLowerCase()
            } successfully`
        });
        // let mailUpdateObj = {
        //     ODId: itemDetails._id,
        //     action: "modified",
        //     company: req.user.company,
        //     mailAction: itemDetails.status
        // };
        // getODApplicationMailConfig(mailUpdateObj);
        if (!["Submitted"].includes(itemDetails.status)) {
            let mailTriggerCreateObj = {
                subModuleId: itemDetails._id,
                action: itemDetails.status,
                company: req.user.company,
                mailAction: itemDetails.status,
                collectionName: ON_DUTY_APPLICATION.COLLECTION_NAME,
                message: "Attention: Outdoor Duty application",
                module: HR_ADMIN_MAIL_CONST.OD_APP.MODULE,
                subModule: HR_ADMIN_MAIL_CONST.OD_APP.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        }
    } catch (e) {
        console.error("update OnDutyApplication", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @route   PUT /settings/OnDutyApplication/delete/:id
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("OnDutyApplication")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("OnDutyApplication");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById OnDutyApplication", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @route   GET /settings/OnDutyApplication/getById/:id
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("On Duty Application");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById OnDutyApplication", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @route   GET /settings/OnDutyApplication/getAllMasterData
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            ON_DUTY_APPLICATION.AUTO_INCREMENT_DATA(),
            req.user.company
        );
        const employeesOptions = await filteredEmployeeList([
            {$match: {company: ObjectId(req.user.company), empStatus: "A"}},
            {$sort: {createdAt: 1}},
            {
                $project: {
                    label: {$concat: ["$empCode", "-", "$empFullName"]},
                    value: "$_id",
                    joiningLocation: "$empJoiningLocation",
                    empFullName: 1
                }
            }
        ]);
        const allHolidaysOptions = await filteredPaidHolidayList([
            {$match: {company: ObjectId(req.user.company)}},
            {$sort: {createdAt: -1}},
            {
                $project: {
                    _id: 1,
                    serialNumber: 1,
                    holidayName: 1,
                    holidayDate: 1,
                    holidayDay: 1,
                    holidayLocation: 1
                }
            }
        ]);
        return res.success({autoIncrementNo, employeesOptions, allHolidaysOptions});
    } catch (error) {
        console.error("getAllMasterData OnDutyApplication", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {employeeId = null, fromDate = null, toDate = null} = req.query;
        const employees = await findAllEmployees(req.user.company);
        let project = getAllOnDutyApplicationReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            status: {$in: ["Approved"]},
            ...(!!employeeId && {
                employeeId: ObjectId(employeeId)
            }),
            ...(!!fromDate &&
                !!toDate && {
                    $or: [
                        {
                            fromDate: {
                                $lte: getEndDateTime(toDate),
                                $gte: getStartDateTime(fromDate)
                            }
                        },
                        {
                            toDate: {
                                $lte: getEndDateTime(toDate),
                                $gte: getStartDateTime(fromDate)
                            }
                        }
                    ]
                })
        };
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    applicationDateS: {$dateToString: {format: "%d-%m-%Y", date: "$applicationDate"}},
                    resumptionDateS: {$dateToString: {format: "%d-%m-%Y", date: "$resumptionDate"}},
                    fromDateS: {$dateToString: {format: "%d-%m-%Y", date: "$fromDate"}},
                    toDateS: {$dateToString: {format: "%d-%m-%Y", date: "$toDate"}},
                    ODDays: {$toString: "$ODDays"}
                }
            },
            {
                $lookup: {
                    from: "Employee",
                    localField: "employeeId",
                    foreignField: "_id",
                    pipeline: [{$project: {empCode: 1, empFullName: 1}}],
                    as: "employeeId"
                }
            },
            {$unwind: "$employeeId"}
        ];
        let rows = await ODApplicationRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            employees,
            ...rows
        });
    } catch (error) {
        console.error("getAllReports OnDutyApplication", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getMonthODApplicationData = asyncHandler(async (startDate, endDate, company) => {
    const result = await Model.aggregate([
        {
            $match: {
                $and: [
                    {company: ObjectId(company)},
                    {status: OPTIONS.defaultStatus.APPROVED},
                    {
                        $or: [
                            {
                                fromDate: {
                                    $lte: getEndDateTime(endDate),
                                    $gte: getStartDateTime(startDate)
                                }
                            },
                            {
                                toDate: {
                                    $lte: getEndDateTime(endDate),
                                    $gte: getStartDateTime(startDate)
                                }
                            }
                        ]
                    }
                ]
            }
        },
        {
            $project: {
                employeeId: 1,
                monthDays: 1,
                _id: 0
            }
        },
        {
            $unwind: "$monthDays"
        },
        {
            $group: {
                _id: "$employeeId",
                count: {$sum: "$monthDays.ODDays"}
            }
        }
    ]);
    return result;
});
exports.onDutyApplicationOfEmployeesCount = async employeeId => {
    try {
        const status = [OPTIONS.defaultStatus.SUBMITTED];
        const findQuery = {
            empStatus: {$in: ["A", "Active"]},
            ...(![undefined, null, ""].includes(employeeId) && {
                empReportTo: mongoose.Types.ObjectId(employeeId)
            })
        };
        let onDutyApplications = await Employee.aggregate([
            {$match: findQuery},
            {
                $lookup: {
                    from: "OnDutyApplication",
                    localField: "_id",
                    foreignField: "employeeId",
                    as: "ODApplications"
                }
            },
            {
                $project: {
                    _id: 0,
                    empCode: 1,
                    empFullName: 1,
                    ODApplications: 1
                }
            },
            {
                $match: {
                    ODApplications: {$exists: true, $type: "array", $ne: []}
                }
            },
            {
                $unwind: "$ODApplications"
            },
            {
                $match: {
                    "ODApplications.status": {$in: status}
                }
            },
            {
                $sort: {"ODApplications.resumptionDate": -1}
            },
            {
                $addFields: {
                    _id: "$ODApplications._id"
                }
            },
            {$group: {_id: null, count: {$sum: 1}}},
            {$project: {_id: 0}}
        ]);
        return onDutyApplications[0]?.count || 0;
    } catch (error) {
        console.error("getAll", error);
        res.status(400);
        throw new Error("Invalid Model data");
    }
};
exports.approvedODApplicationOfEmployees = asyncHandler(async (req, res) => {
    try {
        const {employeeId = null, status = ["Submitted"]} = req.query;
        const findQuery = {
            empStatus: {$in: ["A", "Active"]},
            ...(![undefined, null, ""].includes(employeeId) && {
                empReportTo: mongoose.Types.ObjectId(employeeId)
            })
        };
        let onDutyApplications = await Employee.aggregate([
            {$match: findQuery},
            {
                $lookup: {
                    from: "OnDutyApplication",
                    localField: "_id",
                    foreignField: "employeeId",
                    as: "ODApplications"
                }
            },
            {
                $project: {
                    _id: 0,
                    empCode: 1,
                    empFullName: 1,
                    ODApplications: 1
                }
            },
            {
                $match: {
                    ODApplications: {$exists: true, $type: "array", $ne: []}
                }
            },
            {
                $unwind: "$ODApplications"
            },
            {
                $match: {
                    "ODApplications.status": {$in: status}
                }
            },
            {
                $sort: {"ODApplications.resumptionDate": -1}
            },
            {
                $addFields: {
                    _id: "$ODApplications._id",
                    status: "$ODApplications.status",
                    onDutyApplicationNumber: "$ODApplications.onDutyApplicationNumber",
                    applicationDate: "$ODApplications.applicationDate",
                    employeeId: "$ODApplications.employeeId",
                    fromDate: "$ODApplications.fromDate",
                    toDate: "$ODApplications.toDate",
                    ODDays: "$ODApplications.ODDays",
                    resumptionDate: "$ODApplications.resumptionDate",
                    reason: "$ODApplications.reason",
                    halfDay: "$ODApplications.halfDay",
                    fromSession: "$ODApplications.fromSession",
                    toSession: "$ODApplications.toSession",
                    ODType: "$ODApplications.ODType"
                }
            },
            {
                $project: {
                    ODApplications: 0
                }
            }
        ]);
        return res.success({
            rows: onDutyApplications
            // count: rows[0].metadata ? (rows[0].metadata.length ? rows[0].metadata[0].total : 0) : 0,
        });
    } catch (error) {
        console.error("getAll", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getTotalNoOfEmployeesOnODPerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$applicationDate"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                matchDate: currentDate
            }
        },
        {
            $group: {
                _id: null,
                count: {$sum: {$cond: [{$eq: ["$status", "Submitted"]}, 1, 0]}}
            }
        },
        {
            $project: {
                _id: 0,
                count: 1
            }
        }
    ]);
    return rows[0]?.count || 0;
};

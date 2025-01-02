const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getAllPaidLeavesAttributes} = require("../../../../models/HR/helpers/paidLeavesHelper");
const {default: mongoose} = require("mongoose");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {PAID_LEAVES} = require("../../../../mocks/schemasConstant/HRConstant");
const {filteredEmployeeList} = require("../../../../models/HR/repository/employeeRepository");
const PaidLeaveRepository = require("../../../../models/HR/repository/paidLeaveRepository");
const {filteredSubModuleManagementList} = require("../../../../models/settings/repository/subModuleRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllPaidLeavesAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $addFields: {
                    dateOfJoiningS: {$dateToString: {format: "%d-%m-%Y", date: "$dateOfJoining"}}
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
        let rows = await PaidLeaveRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllPaidLeaves", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.create = asyncHandler(async (req, res) => {
    try {
        let existing = await PaidLeaveRepository.findOneDoc(
            {
                employeeId: req.body.employeeId
            },
            {_id: 1}
        );
        if (existing) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("Paid Leaves");
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await PaidLeaveRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Paid Leaves")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create PaidLeaves", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await PaidLeaveRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await PaidLeaveRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Paid Leaves has been")
        });
    } catch (e) {
        console.error("update PaidLeaves", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await PaidLeaveRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Paid Leaves")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Paid Leaves");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById PaidLeaves", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await PaidLeaveRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Paid Leaves");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById PaidLeaves", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(PAID_LEAVES.AUTO_INCREMENT_DATA(), req.user.company);
        const featureConfig = await filteredSubModuleManagementList([
            {
                $match: {
                    _id: ObjectId(req.query.subModuleId)
                }
            },
            {
                $unwind: "$featureConfig"
            },
            {
                $match: {
                    "featureConfig.status": true
                }
            },
            {
                $project: {
                    featureCode: "$featureConfig.featureCode",
                    value: "$featureConfig.value"
                }
            }
        ]);
        const employeesOptions = await filteredEmployeeList([
            {$match: {empStatus: "A", company: ObjectId(req.user.company)}},
            {$sort: {createdAt: 1}},
            {
                $project: {
                    _id: 0,
                    label: {$concat: ["$empCode", "-", "$empFullName"]},
                    value: "$_id",
                    empJoiningDate: 1
                }
            }
        ]);
        return res.success({autoIncrementNo, employeesOptions, featureConfig});
    } catch (error) {
        console.error("getAllMasterData PaidLeaves", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.updatePaidLeaveOnLeaveApplication = async ({
    employeeId,
    leaveType,
    leaveDays,
    status,
    updatedBy,
    previousLeaves = 0
}) => {
    try {
        let itemDetails = await PaidLeaveRepository.findOneDoc({employeeId: employeeId});
        itemDetails.updatedBy = updatedBy;
        if (leaveType == "Paid Leaves") {
            if (status == OPTIONS.defaultStatus.SUBMITTED) {
                itemDetails.casualLeaveCL = +itemDetails.casualLeaveCL + +previousLeaves - +leaveDays;
            } else {
                itemDetails.casualLeaveCL = +itemDetails.casualLeaveCL + +leaveDays;
            }
        }
        if (leaveType == "Compensatory Off") {
            if (status == OPTIONS.defaultStatus.SUBMITTED) {
                itemDetails.privilegeLeavePL = +itemDetails.privilegeLeavePL + +previousLeaves - +leaveDays;
            } else {
                itemDetails.privilegeLeavePL = +itemDetails.privilegeLeavePL + +leaveDays;
            }
        }
        if (leaveType == "Advance Leaves") {
            if (status == OPTIONS.defaultStatus.SUBMITTED) {
                itemDetails.sickLeaveSL = +itemDetails.sickLeaveSL + +previousLeaves - +leaveDays;
            } else {
                itemDetails.sickLeaveSL = +itemDetails.sickLeaveSL + +leaveDays;
            }
        }
        itemDetails = await itemDetails.save();
    } catch (error) {
        console.error("updatePaidLeaveOnLeaveApplication", error);
    }
};
exports.updatePaidLeaveOnEmpAttendance = asyncHandler(async ({employeeId, days, updatedBy}) => {
    try {
        let itemDetails = await PaidLeaveRepository.findOneDoc({employeeId: employeeId});
        itemDetails.updatedBy = updatedBy;
        itemDetails.sickLeaveSL = +itemDetails.sickLeaveSL + +days;
        itemDetails = await itemDetails.save();
    } catch (error) {
        console.error("updatePaidLeaveOnEmpAttendance", error);
    }
});
exports.paidLeaveByEmpId = asyncHandler(async employeeId => {
    try {
        let existing = await PaidLeaveRepository.findOneDoc({employeeId: employeeId});
        return existing;
    } catch (e) {
        console.error("getById PaidLeaves", e);
    }
});
exports.getLeaveByEmployeeId = async employeeId => {
    try {
        const employee = await PaidLeaveRepository.findOneDoc({employeeId: employeeId});
        return {
            casualLeaveCL: +employee?.casualLeaveCL ?? 0,
            sickLeaveSL: +employee?.sickLeaveSL ?? 0,
            privilegeLeavePL: +employee?.privilegeLeavePL ?? 0
        };
    } catch (error) {
        console.error(error);
    }
};
exports.getBalanceLeaveByEmployeeId = async employeeId => {
    try {
        const employee = await PaidLeaveRepository.findOneDoc({employeeId: employeeId});
        return employee
            ? +employee?.casualLeaveCL ?? 0 + +employee?.sickLeaveSL ?? 0 + +employee?.privilegeLeavePL ?? 0
            : 0;
    } catch (error) {
        console.error(error);
    }
};

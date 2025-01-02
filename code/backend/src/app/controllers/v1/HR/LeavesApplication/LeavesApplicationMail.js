const Model = require("../../../../models/HR/leavesApplicationModel");
const {formatDate} = require("../../../../helpers/dateTime");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const {HR_ADMIN_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");

exports.getLeaveApplicationMailConfig = async ({leaveId, action, company, mailAction}) => {
    try {
        let replacementObj = await getLeaveMailData(leaveId);
        if (
            !["Submitted", "Approved", "Deleted"].includes(replacementObj.status) ||
            (action == "modified" && replacementObj.status == "Submitted")
        ) {
            return;
        }
        replacementObj.message = `The following leave application has been submitted for your approval by ${replacementObj.companyName}.`;
        if (["Recommend", "Approved", "Deleted"].includes(replacementObj.status)) {
            replacementObj.message = `This is to inform you that your leave has been ${
                replacementObj.status == "Deleted" ? "Rejected" : replacementObj.status
            } by ${replacementObj.companyName}.`;
        }
        let mailData = {
            templateUrl: "templates/leaveApplication.html",
            subject: "Attention: Leave application",
            attachments: null,
            replacement: replacementObj,
            fileDelete: false
        };
        let match = {
            company: company,
            module: "HR & Admin",
            subModule: "Leave Application",
            action: mailAction == "Deleted" ? "Cancelled" : mailAction
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getLeaveApplicationMailConfig", e);
    }
};

async function getLeaveMailData(leaveId) {
    try {
        let leaveData = await Model.findById(leaveId, {
            leavesApplicationNumber: 1,
            employeeId: 1,
            applicationDate: 1,
            leaveType: 1,
            fromDate: 1,
            fromSession: 1,
            toDate: 1,
            toSession: 1,
            leaveDays: 1,
            resumptionDate: 1,
            reasonForLeave: 1,
            status: 1,
            company: 1
        })
            .populate("employeeId", "empCode empFullName")
            .populate("company", "companyName");
        return {
            companyName: leaveData.company.companyName,
            leavesApplicationNumber: leaveData.leavesApplicationNumber,
            empCode: leaveData?.employeeId?.empCode,
            empFullName: leaveData?.employeeId?.empFullName,
            applicationDate: formatDate(leaveData.applicationDate),
            leaveType: leaveData.leaveType,
            fromDate: formatDate(leaveData.fromDate),
            fromSession: leaveData.fromSession,
            toDate: formatDate(leaveData.toDate),
            toSession: leaveData.toSession,
            leaveDays: leaveData.leaveDays,
            resumptionDate: formatDate(leaveData.resumptionDate),
            reasonForLeave: leaveData.reasonForLeave,
            status: leaveData.status
        };
    } catch (error) {
        console.error(error);
    }
}
exports.sendLeaveApplicationMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let leaveData = await Model.findById(subModuleId, {
            leavesApplicationNumber: 1,
            employeeId: 1,
            applicationDate: 1,
            leaveType: 1,
            fromDate: 1,
            fromSession: 1,
            toDate: 1,
            toSession: 1,
            leaveDays: 1,
            resumptionDate: 1,
            reasonForLeave: 1,
            status: 1,
            company: 1
        })
            .populate("employeeId", "empCode empFullName")
            .populate("company", "companyName");
        let replacement = {
            companyName: leaveData?.company?.companyName,
            leavesApplicationNumber: leaveData.leavesApplicationNumber,
            empCode: leaveData?.employeeId?.empCode,
            empFullName: leaveData?.employeeId?.empFullName,
            applicationDate: formatDate(leaveData.applicationDate),
            leaveType: leaveData.leaveType,
            fromDate: formatDate(leaveData.fromDate),
            fromSession: leaveData.fromSession,
            toDate: formatDate(leaveData.toDate),
            toSession: leaveData.toSession,
            leaveDays: leaveData.leaveDays,
            resumptionDate: formatDate(leaveData.resumptionDate),
            reasonForLeave: leaveData.reasonForLeave,
            status: leaveData.status,
            message: `The following leave application has been submitted for your approval by ${leaveData?.company?.companyName}.`
        };
        let mailData = {
            templateUrl: HR_ADMIN_MAIL_CONST.LEAVE_APP.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: false
        };
        if (["Submitted", "Approved", "Deleted", "Cancelled"].includes(replacement.status)) {
            replacement.message = `This is to inform you that your leave has been ${
                replacement.status == "Cancelled" ? "Rejected" : replacement.status
            } by ${replacement.companyName}.`;
        }
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

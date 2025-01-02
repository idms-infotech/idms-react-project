const Model = require("../../../../models/HR/onDutyApplicationModel");
const {formatDate} = require("../../../../helpers/dateTime");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const {HR_ADMIN_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");

exports.getODApplicationMailConfig = async ({ODId, action, company, mailAction}) => {
    try {
        let replacementObj = await getODMailData(ODId);
        if (
            !["Submitted", "Approved", "Cancelled"].includes(replacementObj.status) ||
            (action == "modified" && replacementObj.status == "Submitted")
        ) {
            return;
        }
        replacementObj.message = `The following Outdoor Duty Application has been submitted for your approval by ${replacementObj.companyName}.`;
        if (["Recommend", "Approved", "Cancelled"].includes(replacementObj.status)) {
            replacementObj.message = `This is to inform you that your leave has been ${
                replacementObj.status == "Cancelled" ? "Rejected" : replacementObj.status
            } by ${replacementObj.companyName}.`;
        }
        let mailData = {
            templateUrl: "templates/ODApplication.html",
            subject: "Attention: Outdoor Duty application",
            attachments: null,
            replacement: replacementObj,
            fileDelete: false
        };
        let match = {
            company: company,
            module: "HR & Admin",
            subModule: "Outdoor Duty Application",
            action: mailAction
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getLeaveApplicationMailConfig", e);
    }
};

async function getODMailData(ODId) {
    try {
        let ODData = await Model.findById(ODId, {
            company: 1,
            onDutyApplicationNumber: 1,
            employeeId: 1,
            applicationDate: 1,
            ODType: 1,
            fromDate: 1,
            fromSession: 1,
            toDate: 1,
            toSession: 1,
            ODDays: 1,
            resumptionDate: 1,
            reason: 1,
            status: 1
        })
            .populate("employeeId", "empCode empFullName")
            .populate("company", "companyName");
        return {
            companyName: ODData.company.companyName,
            onDutyApplicationNumber: ODData?.onDutyApplicationNumber,
            empCode: ODData?.employeeId?.empCode,
            empFullName: ODData?.employeeId?.empFullName,
            applicationDate: formatDate(ODData.applicationDate),
            ODType: ODData?.ODType,
            fromDate: formatDate(ODData.fromDate),
            fromSession: ODData?.fromSession,
            toDate: formatDate(ODData.toDate),
            toSession: ODData?.toSession,
            ODDays: ODData?.ODDays,
            resumptionDate: formatDate(ODData.resumptionDate),
            reason: ODData?.reason,
            status: ODData?.status
        };
    } catch (error) {
        console.error(error);
    }
}
exports.sendOnDutyMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let ODData = await Model.findById(subModuleId, {
            company: 1,
            onDutyApplicationNumber: 1,
            employeeId: 1,
            applicationDate: 1,
            ODType: 1,
            fromDate: 1,
            fromSession: 1,
            toDate: 1,
            toSession: 1,
            ODDays: 1,
            resumptionDate: 1,
            reason: 1,
            status: 1
        })
            .populate("employeeId", "empCode empFullName")
            .populate("company", "companyName");
        let replacement = {
            companyName: ODData?.company?.companyName,
            onDutyApplicationNumber: ODData?.onDutyApplicationNumber,
            empCode: ODData?.employeeId?.empCode,
            empFullName: ODData?.employeeId?.empFullName,
            applicationDate: formatDate(ODData.applicationDate),
            ODType: ODData?.ODType,
            fromDate: formatDate(ODData.fromDate),
            fromSession: ODData?.fromSession,
            toDate: formatDate(ODData.toDate),
            toSession: ODData?.toSession,
            ODDays: ODData?.ODDays,
            resumptionDate: formatDate(ODData.resumptionDate),
            reason: ODData?.reason,
            status: ODData?.status,
            message: `The following Outdoor Duty Application has been submitted for your approval by ${ODData?.company?.companyName}.`
        };
        let mailData = {
            templateUrl: HR_ADMIN_MAIL_CONST.OD_APP.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: false
        };
        if (["Recommend", "Approved", "Cancelled"].includes(replacement.status)) {
            replacement.message = `This is to inform you that your leave has been ${
                replacement.status == "Cancelled" ? "Rejected" : replacement.status
            } by ${replacement.companyName}.`;
        }
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

const Model = require("../../../../models/settings/userModel");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const MESSAGES = require("../../../../helpers/messages.options");
const {SETTINGS_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");
exports.getUserMailConfig = async function ({userId, action, company, mailAction}) {
    try {
        let mailData = {
            templateUrl: action == "created" ? "templates/User/userCreate.html" : "templates/User/userApproved.html",
            subject: action == "created" ? "User creation request Email" : "User Creation Request Approved",
            attachments: null,
            replacement: {}
        };
        if (action == "login") {
            mailData.templateUrl = "templates/userloggedIn.html";
            mailData.subject = MESSAGES.emailStrings.USER_SUBJECT_MSG;
            mailData.replacement = userId;
            mailData.replacement.bodyMessage = MESSAGES.emailStrings.USER_BODY_MSG;
        } else {
            replacementObj = await getUserMailData(userId);
            mailData.replacement = replacementObj;
        }
        let match = {
            company: company,
            module: "Settings",
            subModule: "User",
            action: mailAction
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getUserMailConfig", e);
    }
};
async function getUserMailData(userId) {
    try {
        let data = await Model.findById(userId, {
            name: 1,
            userEmail: 1,
            email: 1,
            role: 1
        }).populate("role", "roleName");
        return {
            fullName: data?.name,
            emailId: data?.userEmail,
            Username: data?.email,
            role: data?.role[0]?.roleName
        };
    } catch (error) {
        console.error(error);
    }
}
exports.sendUserMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let data = await Model.findById(subModuleId, {
            name: 1,
            userEmail: 1,
            email: 1,
            role: 1
        }).populate("role", "roleName");
        let replacement = {
            fullName: data?.name,
            emailId: data?.userEmail,
            Username: data?.email,
            role: data?.role[0]?.roleName
        };
        let mailData = {
            templateUrl: SETTINGS_MAIL_CONST.USER.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: false
        };
        if (action == "login") {
            mailData.templateUrl = SETTINGS_MAIL_CONST.USER.LOGIN_TEMPLATE;
            mailData.subject = MESSAGES.emailStrings.USER_SUBJECT_MSG;
            mailData.replacement = subModuleId;
            mailData.replacement.bodyMessage = MESSAGES.emailStrings.USER_BODY_MSG;
        }
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

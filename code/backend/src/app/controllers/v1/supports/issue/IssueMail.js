const Model = require("../../../../models/supports/issueModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {formatDate} = require("../../../../helpers/dateTime");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");

exports.getIssueMailConfig = async ({issueId, company, mailAction}) => {
    try {
        let replacementObj = await getIssueMailData(issueId);
        let mailData = {
            templateUrl: "templates/Issue/issueCreation.html",
            subject: null,
            attachments: null,
            replacement: replacementObj,
            fileDelete: false
        };
        if (replacementObj.issueStatus == "In Progress") {
            mailData.subject = `In Progress Issue Ticket - ${replacementObj.issueNumber}`;
            mailData.templateUrl = "templates/Issue/issueInProcess.html";
        }
        if (replacementObj.issueStatus == "Deployed on Production") {
            mailData.subject = `Deployed on Production Issue Ticket - ${replacementObj.issueNumber}`;
            mailData.templateUrl = "templates/Issue/issueDeployedOnProduction.html";
        }
        if (replacementObj.issueStatus == "Verified") {
            mailData.subject = `Verified Issue Ticket - ${replacementObj.issueNumber}`;
            mailData.templateUrl = "templates/Issue/issueVerified.html";
        }
        if (replacementObj.issueStatus == "Closed") {
            mailData.subject = `Closed Issue Ticket - ${replacementObj.issueNumber}`;
            mailData.templateUrl = "templates/Issue/issueClosed.html";
        }
        if (["Open", "Reopened"].includes(replacementObj.issueStatus)) {
            mailData.subject = `A New Ticket - ${replacementObj.issueNumber} has been raised by ${replacementObj.companyName}`;
            mailData.templateUrl = "templates/Issue/issueCreation.html";
            mailData.replacement.msgInform = MESSAGES.emailStrings.ISSUE_INFO_MSG(
                replacementObj.companyName,
                replacementObj.issueStatus
            );
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.ISSUE_CREATE_MSG;
        } else if (replacementObj.issueStatus == "Fixed") {
            mailData.subject = `Issue Resolution - ${replacementObj.issueNumber}`;
            mailData.templateUrl = "templates/Issue/issueResolved.html";
            mailData.replacement.msgInform = MESSAGES.emailStrings.ISSUE_SUCCESS_MSG(
                replacementObj.companyName,
                replacementObj.issueNumber
            );
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.ISSUE_UPDATE_MSG;
        }
        if (mailData.replacement.issueAttachment) {
            mailData.fileDelete = true;
            const filePath = path.join(
                __dirname,
                `../../../../../assets/issueAttachment/${mailData.replacement.issueAttachment}`
            );
            mailData.attachments = [
                {
                    filename: `${mailData.replacement.issueAttachment}`,
                    path: filePath
                }
            ];
        }
        let match = {
            company: company,
            module: "Support",
            subModule: "Raise Ticket",
            action: mailAction
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("Issue", e);
    }
};
async function getIssueMailData(issueId) {
    try {
        let issueData = await Model.findById(issueId, {
            issueNumber: 1,
            updatedBy: 1,
            issueTitle: 1,
            issueDescription: 1,
            issueAttachment: 1,
            createdAt: 1,
            updatedAt: 1,
            issueResolution: 1,
            issueStatus: 1,
            company: 1
        })
            .populate("updatedBy", "name")
            .populate("company", "companyName");
        return {
            issueNumber: issueData?.issueNumber ?? "-",
            updatedBy: issueData?.updatedBy?.name ?? "-",
            issueTitle: issueData.issueTitle ?? "-",
            issueDescription: issueData?.issueDescription ?? "-",
            issueAttachment: issueData?.issueAttachment ?? null,
            createdAt: formatDate(issueData.createdAt) ?? "-",
            updatedAt: formatDate(issueData.updatedAt) ?? "-",
            issueResolution: issueData?.issueResolution ?? "-",
            issueStatus: issueData?.issueStatus ?? "-",
            companyName: issueData?.company?.companyName ?? "-"
        };
    } catch (error) {
        console.error(error);
    }
}

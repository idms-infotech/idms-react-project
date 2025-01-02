const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const {getContactStr} = require("../../../../helpers/utility");
const {
    BUSINESS_LEAD_MAIL_CONST: {NPD_REVIEW},
    DEFAULT_MAIL_RECEIVER
} = require("../../../../mocks/mailTriggerConstants");
const Model = require("../../../../models/businessLeads/NPDReviewModel");

exports.getNPDReviewMailConfig = async function (controllerMailObj) {
    try {
        let {id, reviewField, company, mailAction} = controllerMailObj;
        let fieldName = reviewField
            .replace(/([A-Z])/g, " $1")
            .trim()
            .replace(/^\w/, c => c.toUpperCase());
        let replacementObj = await getNPDMailData(id, reviewField);
        replacementObj.fieldName = fieldName;
        replacementObj.NPDRows = await getNPDtableRows(replacementObj.NPDDetails);
        let mailData = {
            templateUrl: "templates/NPDReview/NPDReview.html",
            subject: `NPD No. ${replacementObj.NPDNo} ${fieldName} started for ${replacementObj.name}`,
            attachments: null,
            replacement: replacementObj
        };
        if (reviewField == "customerInputs") {
            mailData.templateUrl = "templates/NPDReview/NPDReviewCustomer.html";
            mailData.subject = `NPD No. ${replacementObj.NPDNo} Customer Inputs Review started for  ${replacementObj.name}`;
        }
        let match = {
            company: company,
            module: "Business Leads",
            subModule: "NPD Review",
            action: mailAction
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getNPDReviewMailConfig", e);
    }
};

async function getNPDMailData(NPDId, keyName) {
    try {
        let reviewData = await Model.findById(NPDId, {
            NPDNo: 1,
            company: 1,
            status: 1,
            customerInputs: 1,
            technicalReview: 1,
            economicReview: 1,
            legalReview: 1,
            operationalReview: 1,
            schedulingReview: 1,
            name: 1
        }).populate("company", "contactInfo companyName");
        let contactDetails = reviewData.company.contactInfo.find(x => x.department == "Sales");
        if (contactDetails != undefined) {
            reviewData.contactStr = `${contactDetails.contactPersonName} (${contactDetails.companyContactPersonNumber},${contactDetails.companyContactPersonEmail})`;
        }
        reviewArray = reviewData[keyName].slice(-1)[0];
        return {
            contactStr: reviewData.contactStr ?? "",
            NPDNo: reviewData?.NPDNo,
            name: reviewData?.name,
            status: reviewData.status,
            companyName: reviewData?.company?.companyName,
            NPDDetails: reviewArray
        };
    } catch (error) {
        console.error(error);
    }
}

async function getNPDtableRows(NPDetails) {
    let rows = ``;
    for (let i = 0; i < NPDetails.technicalReview.length; i++) {
        const element = NPDetails.technicalReview[i];
        rows += `<tr>
        <td>${element.orderNo}</td>
        <td style="text-align: left">${element.questionnaire}</td>
        <td>${element.isChecked ? "Yes" : "No"}</td>
        <td style="text-align: left">${element.remarks ? element.remarks : "-"}</td>
        </tr>\n`;
    }
    return rows;
}

exports.sendNPDReviewMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let reviewData = await Model.findById(subModuleId, {
            NPDNo: 1,
            company: 1,
            status: 1,
            customerInputs: 1,
            technicalReview: 1,
            economicReview: 1,
            legalReview: 1,
            operationalReview: 1,
            schedulingReview: 1,
            name: 1
        }).populate("company", "contactInfo companyName");
        reviewData.contactStr = getContactStr(reviewData.company.contactInfo, "Sales");
        reviewArray = reviewData[action].slice(-1)[0];
        let replacement = {
            contactStr: reviewData.contactStr ?? "",
            NPDNo: reviewData?.NPDNo,
            name: reviewData?.name,
            status: reviewData.status,
            companyName: reviewData?.company?.companyName,
            NPDDetails: reviewArray
        };
        const fieldName = action
            .replace(/([A-Z])/g, " $1")
            .trim()
            .replace(/^\w/, c => c.toUpperCase());
        let mailData = {
            templateUrl: NPD_REVIEW.REVIEW_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: false,
            fieldName: fieldName
        };
        mailData.replacement.NPDRows = await getNPDtableRows(replacement.NPDDetails);
        if (action == "customerInputs") {
            mailData.templateUrl = NPD_REVIEW.CUSTOMER_INPUT_TEMPLATE;
        }
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

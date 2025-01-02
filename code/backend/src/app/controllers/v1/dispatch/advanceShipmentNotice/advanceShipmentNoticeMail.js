const Model = require("../../../../models/dispatch/advanceShipmentNoticeModel");
const {generatePdfPuppeteer} = require("../../../../helpers/pupeeteerGeneratePdf");
const {CONSTANTS} = require("../../../../../config/config");
const {formatDate} = require("../../../../helpers/dateTime");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const {getContactStr} = require("../../../../helpers/utility");
const {DISPATCH_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");

exports.getASNMailConfig = async function (ASNId, company) {
    try {
        let replacementObj = await getASNMailData(ASNId);
        let mailData = {
            templateUrl: "templates/asn.html",
            subject: `ASN report has been Generated - ${replacementObj.ASNNumber}`,
            attachments: null,
            replacement: replacementObj,
            fileDelete: true
        };
        let match = {
            company: company,
            module: "Dispatch",
            subModule: "Advance Shipment Notice",
            action: "Notify Customer"
        };
        let url = `${CONSTANTS.reqURL}/#/print/asn?id=${ASNId}&action=pdf`;
        mailData.attachments = await generatePdfPuppeteer(ASNId, replacementObj.ASNNumber, url);
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getASNMailConfig", e);
    }
};

async function getASNMailData(ASNId) {
    try {
        let ASNData = await Model.findById(ASNId, {
            company: 1,
            salesInvoiceDate: 1,
            ASNNumber: 1,
            transporter: 1,
            docketLR: 1
        }).populate("company", "contactInfo companyName");
        let contactDetails = ASNData.company.contactInfo.find(x => x.department == "Sales");
        if (contactDetails != undefined) {
            ASNData.contactStr = `${contactDetails.companyContactPersonEmail}`;
        }
        return {
            contactStr: ASNData?.contactStr ?? "",
            companyName: ASNData?.company?.companyName,
            salesInvoiceDate: formatDate(ASNData.salesInvoiceDate),
            ASNNumber: String(ASNData?.ASNNumber),
            transporter: ASNData?.transporter,
            docketLR: ASNData?.docketLR
        };
    } catch (error) {
        console.error(error);
    }
}
exports.sendASNMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let ASNData = await Model.findById(subModuleId, {
            company: 1,
            salesInvoiceDate: 1,
            ASNNumber: 1,
            transporter: 1,
            docketLR: 1
        }).populate("company", "contactInfo companyName");
        ASNData.contactStr = getContactStr(ASNData.company.contactInfo, "Sales");
        let replacement = {
            contactStr: ASNData?.contactStr ?? "",
            companyName: ASNData?.company?.companyName,
            salesInvoiceDate: formatDate(ASNData.salesInvoiceDate),
            ASNNumber: String(ASNData?.ASNNumber),
            transporter: ASNData?.transporter,
            docketLR: ASNData?.docketLR
        };
        let mailData = {
            templateUrl: DISPATCH_MAIL_CONST.ASN.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: true
        };
        let url = `${CONSTANTS.reqURL}/#/print/asn?id=${subModuleId}&action=pdf`;
        mailData.attachments = await generatePdfPuppeteer(subModuleId, replacement.ASNNumber, url);
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

const Model = require("../../../../models/sales/directTaxInvoiceModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generatePdfPuppeteer} = require("../../../../helpers/pupeeteerGeneratePdf");
const {CONSTANTS} = require("../../../../../config/config");
const {formatDate} = require("../../../../helpers/dateTime");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const {getContactStr} = require("../../../../helpers/utility");
const {SALES_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");

exports.getDTIMailConfig = async function ({DTIId, action, company, mailAction, SIId = null}) {
    try {
        let replacementObj = await getDTIMailData(DTIId);
        let condition;
        if (action == "created") {
            condition = ["Awaiting Approval"].includes(replacementObj?.DTIStatus)
                ? "Created"
                : replacementObj?.DTIStatus;
        } else if (action == "modified") {
            condition = ["Awaiting Approval"].includes(replacementObj?.DTIStatus)
                ? "Modified"
                : replacementObj?.DTIStatus;
        }
        let mailData = {
            templateUrl: "templates/taxInvoiceGeneration.html",
            subject: `Direct Tax Invoice ${condition} - ${replacementObj?.DTINumber}`,
            attachments: null,
            replacement: replacementObj,
            fileDelete: false
        };
        mailData.replacement.msgEnsure = MESSAGES.emailStrings.DTI_CREATE_MSG(
            `has been ${condition}`,
            replacementObj?.companyName
        );
        if (condition == "Report Generated" && SIId) {
            mailData.fileDelete = true;
            let url = `${CONSTANTS.reqURL}/#/print/tax_invoice?id=${SIId}&action=pdf`;
            mailData.attachments = await generatePdfPuppeteer(SIId, replacementObj?.DTINumber, url);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.DTI_CREATE_MSG(
                "report has been generated",
                replacementObj?.companyName
            );
            mailData.subject = `Direct Tax Invoice Report has been Generated - ${replacementObj?.DTINumber}`;
        }
        let match = {
            company: company,
            module: "Sales",
            subModule: "Direct Tax Invoice",
            action: mailAction == "Awaiting Approval" ? "Update" : mailAction
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getDTIMailConfig", e);
    }
};

async function getDTIMailData(DTIId) {
    try {
        let DTData = await Model.findById(DTIId, {
            DTINumber: 1,
            customer: 1,
            salesInvoiceDate: 1,
            DTIValue: 1,
            DTIStatus: 1,
            company: 1,
            DTIDetails: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("customer", "customerCode customerName")
            .populate("DTIDetails.SKU", "SKUNo SKUName SKUDescription hsn");
        let contactDetails = DTData.company.contactInfo.find(x => x.department == "Sales");
        if (contactDetails != undefined) {
            DTData.contactStr = `${contactDetails.contactPersonName} (${contactDetails.companyContactPersonNumber},${contactDetails.companyContactPersonEmail})`;
        }
        return {
            contactStr: DTData.contactStr ?? "",
            salesInvoiceNumber: DTData?.DTINumber,
            DTINumber: DTData?.DTINumber,
            customerName: DTData?.customer?.customerName,
            salesInvoiceDate: formatDate(DTData.salesInvoiceDate),
            salesInvoiceTotalAmountWithTax: DTData.DTIValue,
            DTIStatus: DTData.DTIStatus,
            companyName: DTData?.company?.companyName
        };
    } catch (error) {
        console.error(error);
    }
}

exports.sendDirectTaxInvMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let DTData = await Model.findById(subModuleId, {
            DTINumber: 1,
            customer: 1,
            salesInvoiceDate: 1,
            DTIValue: 1,
            DTIStatus: 1,
            company: 1,
            DTIDetails: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("customer", "customerCode customerName")
            .populate("DTIDetails.SKU", "SKUNo SKUName SKUDescription hsn");
        DTData.contactStr = getContactStr(DTData.company.contactInfo, "Sales");
        let replacement = {
            contactStr: DTData.contactStr ?? "",
            salesInvoiceNumber: DTData?.DTINumber,
            DTINumber: DTData?.DTINumber,
            customerName: DTData?.customer?.customerName,
            salesInvoiceDate: formatDate(DTData.salesInvoiceDate),
            salesInvoiceTotalAmountWithTax: DTData.DTIValue,
            DTIStatus: DTData.DTIStatus,
            companyName: DTData?.company?.companyName
        };
        let mailData = {
            templateUrl: SALES_MAIL_CONST.DIRECT_TAX_INV.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: false
        };
        mailData.replacement.cnRows = getCNtableRows(replacement.CNDetails);
        if (action == "Report Generated" && SIId) {
            mailData.fileDelete = true;
            let url = `${CONSTANTS.reqURL}/#/print/tax_invoice?id=${SIId}&action=pdf`;
            mailData.attachments = await generatePdfPuppeteer(SIId, replacementObj?.DTINumber, url);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.DTI_CREATE_MSG(
                "report has been generated",
                replacementObj?.companyName
            );
            mailData.subject = `Direct Tax Invoice Report has been Generated - ${replacementObj?.DTINumber}`;
        }
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

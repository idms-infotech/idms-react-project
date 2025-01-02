const {generatePdfPuppeteer} = require("../../../../helpers/pupeeteerGeneratePdf");
const {formatDate} = require("../../../../helpers/dateTime");
const Model = require("../../../../models/dispatch/salesInvoiceModel");
const {CONSTANTS} = require("../../../../../config/config");
const MESSAGES = require("../../../../helpers/messages.options");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const {getContactStr} = require("../../../../helpers/utility");
const {DISPATCH_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");
exports.getSIMailConfig = async (SIId, company) => {
    try {
        let replacementObj = await getSIMailData(SIId);
        let mailData = {
            templateUrl: "templates/taxInvoiceGeneration.html",
            subject: `Tax Invoice Generation - ${replacementObj.salesInvoiceNumber}`,
            attachments: null,
            replacement: replacementObj,
            fileDelete: true
        };
        let match = {
            company: company,
            module: "Dispatch",
            subModule: "Tax Invoice",
            action: "Generate"
        };
        let url = `${CONSTANTS.reqURL}/#/print/tax_invoice?id=${SIId}&action=pdf`;
        mailData.attachments = await generatePdfPuppeteer(SIId, replacementObj.salesInvoiceNumber, url);
        mailData.replacement.msgEnsure = MESSAGES.emailStrings.TI_CREATE_MSG(replacementObj.companyName);
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getSIMailConfig", e);
    }
};
async function getSIMailData(SIId) {
    try {
        let SIData = await Model.findById(SIId, {
            company: 1,
            salesInvoiceNumber: 1,
            customer: 1,
            salesInvoiceDate: 1,
            invoiceDate: 1,
            createdAt: 1,
            salesInvoiceTotalAmount: 1,
            salesInvoiceTotalAmountWithTax: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("customer", "customerCode customerName");
        let contactDetails = SIData.company.contactInfo.find(x => x.department == "Dispatch");
        if (contactDetails != undefined) {
            SIData.contactStr = `${contactDetails.contactPersonName} (${contactDetails.companyContactPersonNumber},${contactDetails.companyContactPersonEmail})`;
        }
        return {
            contactStr: SIData.contactStr ?? "",
            salesInvoiceNumber: SIData?.salesInvoiceNumber,
            customerName: SIData?.customer?.customerName,
            salesInvoiceDate: formatDate(SIData.salesInvoiceDate),
            invoiceDate: formatDate(SIData.invoiceDate),
            createdAt: formatDate(SIData.createdAt),
            salesInvoiceTotalAmount: SIData.salesInvoiceTotalAmount,
            salesInvoiceTotalAmountWithTax: SIData.salesInvoiceTotalAmountWithTax,
            companyName: SIData.company?.companyName
        };
    } catch (error) {
        console.error(error);
    }
}

exports.sendSalesInvMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let SIData = await Model.findById(subModuleId, {
            company: 1,
            salesInvoiceNumber: 1,
            customer: 1,
            salesInvoiceDate: 1,
            invoiceDate: 1,
            createdAt: 1,
            salesInvoiceTotalAmount: 1,
            salesInvoiceTotalAmountWithTax: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("customer", "customerCode customerName");
        SIData.contactStr = getContactStr(SIData.company.contactInfo, "Dispatch");

        let replacement = {
            contactStr: SIData.contactStr ?? "",
            salesInvoiceNumber: SIData?.salesInvoiceNumber,
            customerName: SIData?.customer?.customerName,
            salesInvoiceDate: formatDate(SIData.salesInvoiceDate),
            invoiceDate: formatDate(SIData.invoiceDate),
            createdAt: formatDate(SIData.createdAt),
            salesInvoiceTotalAmount: SIData.salesInvoiceTotalAmount,
            salesInvoiceTotalAmountWithTax: SIData.salesInvoiceTotalAmountWithTax,
            companyName: SIData.company?.companyName
        };
        let mailData = {
            templateUrl: DISPATCH_MAIL_CONST.TAX_INV.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: true
        };
        let url = `${CONSTANTS.reqURL}/#/print/tax_invoice?id=${subModuleId}&action=pdf`;
        mailData.attachments = await generatePdfPuppeteer(subModuleId, replacement.salesInvoiceNumber, url);
        mailData.replacement.msgEnsure = MESSAGES.emailStrings.TI_CREATE_MSG(replacement.companyName);
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

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

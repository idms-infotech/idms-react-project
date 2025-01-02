const Model = require("../../../../models/sales/serviceInvoiceModel");
const {generatePdfPuppeteer} = require("../../../../helpers/pupeeteerGeneratePdf");
const {CONSTANTS} = require("../../../../../config/config");
const {formatDate} = require("../../../../helpers/dateTime");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const {getContactStr} = require("../../../../helpers/utility");
const {SALES_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");
const {OPTIONS} = require("../../../../helpers/global.options");

exports.getServiceInvoiceMailConfig = async function ({serviceInvoiceId, status, company}) {
    try {
        if (!["Approved", "Report Generated"].includes(status)) {
            return;
        }
        let replacementObj = await getServiceInvoiceMailData(serviceInvoiceId);
        let mailData = {
            templateUrl: "templates/serviceInvoice.html",
            subject: null,
            attachments: null,
            replacement: replacementObj,
            fileDelete: true
        };
        let url = `${CONSTANTS.reqURL}/#/print/service_invoice?id=${serviceInvoiceId}&action=pdf`;
        if (replacementObj.status == "Approved") {
            mailData.subject = `Service Invoice has been Approved - ${replacementObj.serviceInvoiceNumber}`;
            mailData.attachments = await generatePdfPuppeteer(
                serviceInvoiceId,
                replacementObj.serviceInvoiceNumber,
                url
            );
            mailData.replacement.status = "approved";
        }
        if (replacementObj.status == "Report Generated") {
            mailData.subject = `Service Invoice Report has been Generated - ${replacementObj.serviceInvoiceNumber}`;
            mailData.attachments = await generatePdfPuppeteer(
                serviceInvoiceId,
                replacementObj.serviceInvoiceNumber,
                url
            );
            mailData.replacement.status = "report has been generated";
        }
        let match = {
            company: company,
            module: "Sales",
            subModule: "Service Invoice",
            action: status
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getServiceInvoiceMailConfig", e);
    }
};

async function getServiceInvoiceMailData(serviceInvoiceId) {
    try {
        let data = await Model.findById(serviceInvoiceId, {
            serviceInvoiceNumber: 1,
            customer: 1,
            status: 1,
            totalAmountWithTax: 1,
            serviceInvoiceDate: 1,
            company: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("customer", "customerCode customerName");
        let contactDetails = data.company.contactInfo.find(x => x.department == "Sales");
        if (contactDetails != undefined) {
            data.contactStr = `${contactDetails.contactPersonName} (${contactDetails.companyContactPersonNumber},${contactDetails.companyContactPersonEmail})`;
        }
        return {
            contactStr: data.contactStr ?? "",
            serviceInvoiceNumber: data?.serviceInvoiceNumber,
            customerName: data?.customer?.customerName,
            status: data?.status,
            totalAmountWithTax: data?.totalAmountWithTax,
            serviceInvoiceDate: formatDate(data.serviceInvoiceDate),
            companyName: data?.company?.companyName
        };
    } catch (error) {
        console.error(error);
    }
}

exports.sendServiceInvMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let SIdata = await Model.findById(subModuleId, {
            serviceInvoiceNumber: 1,
            customer: 1,
            status: 1,
            totalAmountWithTax: 1,
            serviceInvoiceDate: 1,
            company: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("customer", "customerCode customerName");
        SIdata.contactStr = getContactStr(SIdata.company.contactInfo, "Sales");
        let replacement = {
            contactStr: SIdata.contactStr ?? "",
            serviceInvoiceNumber: SIdata?.serviceInvoiceNumber,
            customerName: SIdata?.customer?.customerName,
            status: SIdata?.status,
            totalAmountWithTax: SIdata?.totalAmountWithTax,
            serviceInvoiceDate: formatDate(SIdata.serviceInvoiceDate),
            companyName: SIdata?.company?.companyName
        };
        let mailData = {
            templateUrl: SALES_MAIL_CONST.SERVICE_INV.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: true
        };
        let url = `${CONSTANTS.reqURL}/#/print/service_invoice?id=${subModuleId}&action=pdf`;
        if (replacement.status == OPTIONS.defaultStatus.APPROVED) {
            mailData.subject = `Service Invoice has been Approved - ${replacement.serviceInvoiceNumber}`;
            mailData.attachments = await generatePdfPuppeteer(subModuleId, replacement.serviceInvoiceNumber, url);
            mailData.replacement.status = "approved";
        }
        if (replacement.status == OPTIONS.defaultStatus.REPORT_GENERATED) {
            mailData.subject = `Service Invoice Report has been Generated - ${replacement.serviceInvoiceNumber}`;
            mailData.attachments = await generatePdfPuppeteer(subModuleId, replacement.serviceInvoiceNumber, url);
            mailData.replacement.status = "report has been generated";
        }
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

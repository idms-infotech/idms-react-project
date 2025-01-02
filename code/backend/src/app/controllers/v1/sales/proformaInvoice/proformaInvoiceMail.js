const Model = require("../../../../models/sales/proformaInvoiceModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generatePdfPuppeteer} = require("../../../../helpers/pupeeteerGeneratePdf");
const {CONSTANTS} = require("../../../../../config/config");
const {formatDate} = require("../../../../helpers/dateTime");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const {SALES_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");
const {getContactStr} = require("../../../../helpers/utility");
const SORepository = require("../../../../models/sales/repository/salesOrderRepository");

exports.getPIMailConfig = async function ({PIId, action, company, mailAction, SOnumber}) {
    try {
        let replacementObj = await getPIMailData(PIId);
        let condition = ["Created"].includes(replacementObj.PIStatus) ? "Created" : replacementObj.PIStatus;
        if (!["Created", "Converted to SO"].includes(condition)) {
            return;
        }
        let mailData = {
            templateUrl: "templates/PI/proformaInvoice.html",
            subject: null,
            attachments: null,
            replacement: replacementObj,
            fileDelete: true
        };
        mailData.replacement.SONumber = SOnumber ? SOnumber : "-";
        mailData.replacement.piRows = getPItableRows(replacementObj.PIDetails);
        let url = `${CONSTANTS.reqURL}/#/print/pi_print?id=${PIId}&action=pdf`;

        if (action == "created") {
            mailData.attachments = await generatePdfPuppeteer(PIId, replacementObj.PINumber, url);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.PI_CREATE_MSG(
                `created by ${replacementObj.companyName}`
            );
            mailData.subject = `Proforma Invoice Created - ${replacementObj.PINumber}`;
        }
        if (condition == "Converted to SO") {
            mailData.attachments = await generatePdfPuppeteer(PIId, replacementObj.PINumber, url);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.PI_CREATE_MSG(
                `Converted to Sales Order modified by ${replacementObj.companyName}`
            );
            mailData.subject = `Proforma Invoice Converted to SO - ${replacementObj.PINumber}`;
        }
        let match = {
            company: company,
            module: "Sales",
            subModule: "Proforma Invoice",
            action: mailAction
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getPIMailConfig", e);
    }
};

async function getPIMailData(PIId) {
    try {
        let PIData = await Model.findById(PIId, {
            PINumber: 1,
            customer: 1,
            PIDate: 1,
            invoiceDate: 1,
            createdAt: 1,
            PITotalAmount: 1,
            PIStatus: 1,
            company: 1,
            PIDetails: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("customer", "customerCode customerName")
            .populate("PIDetails.SKU", "SKUNo SKUName SKUDescription");
        let contactDetails = PIData.company.contactInfo.find(x => x.department == "Sales");
        if (contactDetails != undefined) {
            PIData.contactStr = `${contactDetails.contactPersonName} (${contactDetails.companyContactPersonNumber},${contactDetails.companyContactPersonEmail})`;
        }
        return {
            contactStr: PIData.contactStr ?? "",
            PINumber: PIData?.PINumber,
            customerName: PIData?.customer?.customerName,
            PIDate: formatDate(PIData.PIDate),
            invoiceDate: formatDate(PIData.invoiceDate),
            createdAt: formatDate(PIData.createdAt),
            PITotalAmount: PIData.PITotalAmount,
            PIStatus: PIData.PIStatus,
            companyName: PIData.company?.companyName,
            PIDetails: PIData?.PIDetails.map(ele => {
                return {
                    PILineNumber: ele?.PILineNumber,
                    SKUCode: ele?.SKU?.SKUNo,
                    SKUName: ele.SKU?.SKUName,
                    SKUDescription: ele.SKU?.SKUDescription,
                    customerPartNo: ele.customerPartNo,
                    UOM: ele.UOM,
                    orderedQty: ele.orderedQty,
                    standardRate: ele.standardRate.toFixed(2),
                    discount: ele.discount.toFixed(2),
                    netRate: ele.netRate.toFixed(2),
                    lineValue: ele.lineValue.toFixed(2),
                    SOLineTargetDate: formatDate(ele.SOLineTargetDate)
                };
            })
        };
    } catch (error) {
        console.error(error);
    }
}
function getPItableRows(PIDetails) {
    let rows = ``;
    for (let i = 0; i < PIDetails.length; i++) {
        const element = PIDetails[i];
        rows += `<tr>
        <td>${element.SKUCode}</td>
        <td style="text-align:  left;">${element.SKUName}</td>
        <td style="text-align:  left;">${element.SKUDescription}</td>
        <td>${element.customerPartNo}</td>
        <td>${element.UOM}</td>
        <td>${element.orderedQty}</td>
        <td>${element.standardRate}</td>
        <td>${element.discount}</td>
        <td>${element.netRate}</td>
        <td>${element.lineValue}</td>
        <td>${element.SOLineTargetDate}</td>
    </tr>\n`;
    }
    return rows;
}

exports.sendProformaInvMail = async ({
    subModuleId = null,
    action = null,
    mailAction = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let PIData = await Model.findById(subModuleId, {
            PINumber: 1,
            customer: 1,
            PIDate: 1,
            invoiceDate: 1,
            createdAt: 1,
            PITotalAmount: 1,
            PIStatus: 1,
            company: 1,
            PIDetails: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("customer", "customerCode customerName")
            .populate("PIDetails.SKU", "SKUNo SKUName SKUDescription");
        PIData.contactStr = getContactStr(PIData.company.contactInfo, "Sales");
        let replacement = {
            contactStr: PIData.contactStr ?? "",
            PINumber: PIData?.PINumber,
            customerName: PIData?.customer?.customerName,
            PIDate: formatDate(PIData.PIDate),
            invoiceDate: formatDate(PIData.invoiceDate),
            createdAt: formatDate(PIData.createdAt),
            PITotalAmount: PIData.PITotalAmount,
            PIStatus: PIData.PIStatus,
            companyName: PIData.company?.companyName,
            PIDetails: PIData?.PIDetails.map(ele => {
                return {
                    PILineNumber: ele?.PILineNumber,
                    SKUCode: ele?.SKU?.SKUNo,
                    SKUName: ele.SKU?.SKUName,
                    SKUDescription: ele.SKU?.SKUDescription,
                    customerPartNo: ele.customerPartNo,
                    UOM: ele.UOM,
                    orderedQty: ele.orderedQty,
                    standardRate: ele.standardRate.toFixed(2),
                    discount: ele.discount.toFixed(2),
                    netRate: ele.netRate.toFixed(2),
                    lineValue: ele.lineValue.toFixed(2),
                    SOLineTargetDate: formatDate(ele.SOLineTargetDate)
                };
            })
        };
        let mailData = {
            templateUrl: SALES_MAIL_CONST.PROFORMA_INV.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: true
        };
        let url = `${CONSTANTS.reqURL}/#/print/pi_print?id=${subModuleId}&action=pdf`;
        if (action == "created") {
            mailData.attachments = await generatePdfPuppeteer(subModuleId, replacement.PINumber, url);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.PI_CREATE_MSG(
                `created by ${replacement.companyName}`
            );
            mailData.subject = `Proforma Invoice Created - ${replacement.PINumber}`;
        }
        if (mailAction == "Converted to SO") {
            const salesOrderObj = await SORepository.findOneDoc({PIId: subModuleId}, {SONumber: 1});
            mailData.replacement.SONumber = salesOrderObj.SOnumber ? salesOrderObj.SOnumber : "-";
            mailData.attachments = await generatePdfPuppeteer(subModuleId, replacement.PINumber, url);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.PI_CREATE_MSG(
                `Converted to Sales Order modified by ${replacement.companyName}`
            );
            mailData.subject = `Proforma Invoice Converted to SO - ${replacement.PINumber}`;
        }
        mailData.replacement.piRows = getPItableRows(replacement.PIDetails);
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

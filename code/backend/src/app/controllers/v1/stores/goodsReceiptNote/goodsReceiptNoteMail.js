const Model = require("../../../../models/stores/GRNModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generatePdfPuppeteer} = require("../../../../helpers/pupeeteerGeneratePdf");
const {CONSTANTS} = require("../../../../../config/config");
const {formatDate} = require("../../../../helpers/dateTime");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const {STORES_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getContactStr} = require("../../../../helpers/utility");

exports.getGRNMailConfig = async ({GRNId, action, company, mailAction}) => {
    try {
        let replacementObj = await getGRNMailData(GRNId);
        if (
            ["Awaiting Approval", "GRN Partial Created", "GRN Created"].includes(replacementObj.GRNStatus) &&
            action == "modified"
        ) {
            return;
        }
        let condition;
        if (action == "created") {
            condition = ["Awaiting Approval", "GRN Partial Created", "GRN Created"].includes(replacementObj.GRNStatus)
                ? "Created"
                : replacementObj.GRNStatus;
        } else if (action == "modified") {
            condition = ["Awaiting Approval", "GRN Partial Created", "GRN Created"].includes(replacementObj.GRNStatus)
                ? "Modified"
                : replacementObj.GRNStatus;
        }
        let mailData = {
            templateUrl: "templates/PO/grnCreate.html",
            subject: `Goods Receipt Note ${condition} - ${replacementObj.GRNNumber}`,
            attachments: null,
            replacement: replacementObj,
            fileDelete: false
        };
        mailData.replacement.grnRows = getGRNtableRows(replacementObj.GRNDetails);
        mailData.replacement.msgInfo = MESSAGES.emailStrings.GRN_CREATE_MSG(condition, replacementObj?.companyName);
        mailData.replacement.msgEnsure = MESSAGES.emailStrings.GRN_INFO_MSG(replacementObj.contactStr);
        if (condition == "Report Generated") {
            mailData.fileDelete = true;
            let url = `${CONSTANTS.reqURL}/#/print/grn?id=${GRNId}&action=pdf`;
            mailData.attachments = await generatePdfPuppeteer(GRNId, replacementObj.GRNNumber, url);
            mailData.replacement.msgInfo = MESSAGES.emailStrings.GRN_CREATE_MSG(
                "report has been generated",
                replacementObj?.companyName
            );
            mailData.subject = `Goods Receipt Note Report has been Generated - ${replacementObj.GRNNumber}`;
        }
        let match = {
            company: company,
            module: "Stores",
            subModule: "Goods Receipt Note",
            action: mailAction
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getGRNMailConfig", e);
    }
};

async function getGRNMailData(GRNId) {
    try {
        let GRNData = await Model.findById(GRNId, {
            GRNNumber: 1,
            PONumber: 1,
            supplierInvoiceRef: 1,
            supplierInvoiceRefDate: 1,
            supplier: 1,
            createdAt: 1,
            updatedAt: 1,
            GRNStatus: 1,
            company: 1,
            GRNDate: 1,
            GRNDetails: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("PONumber", "PONumber")
            .populate("supplier", "supplierCode supplierName")
            .populate("GRNDetails.item", "itemCode itemName itemDescription hsn");
        let contactDetails = GRNData.company.contactInfo.find(x => x.department == "Stores");
        if (contactDetails != undefined) {
            GRNData.contactStr = `${contactDetails.contactPersonName} (${contactDetails.companyContactPersonNumber},${contactDetails.companyContactPersonEmail})`;
        }
        return {
            contactStr: GRNData.contactStr ?? "",
            GRNNumber: GRNData?.GRNNumber,
            PONumber: GRNData?.PONumber?.PONumber,
            supplierInvoiceRef: GRNData?.supplierInvoiceRef,
            supplierInvoiceRefDate: GRNData?.supplierInvoiceRefDate,
            supplierName: GRNData?.supplier?.supplierName,
            createdAt: formatDate(GRNData.createdAt),
            updatedAt: formatDate(GRNData.updatedAt),
            GRNStatus: GRNData.GRNStatus,
            companyName: GRNData?.company?.companyName,
            GRNDate: formatDate(GRNData.GRNDate),
            GRNDetails: GRNData?.GRNDetails.map(ele => {
                return {
                    GRNLineNumber: ele?.GRNLineNumber,
                    itemName: ele.item?.itemName,
                    itemCode: ele?.item?.itemCode,
                    itemDescription: ele.item?.itemDescription,
                    batchDate: formatDate(ele.batchDate),
                    UOM: ele.UOM,
                    balancedQty: ele?.balancedQty,
                    invoicedQty: ele.invoicedQty,
                    GRNQty: ele?.GRNQty
                };
            })
        };
    } catch (error) {
        console.error(error);
    }
}

function getGRNtableRows(GRNDetails) {
    let rows = ``;
    for (let i = 0; i < GRNDetails.length; i++) {
        const element = GRNDetails[i];
        rows += `<tr>
        <td>${element.GRNLineNumber}</td>
        <td>${element.itemCode}</td>
        <td>${element.itemName}</td>
        <td>${element.itemDescription}</td>
        <td>${element.batchDate}</td>
        <td>${element.UOM}</td>
        <td>${element.balancedQty}</td>
        <td>${element.invoicedQty}</td>
        <td>${element.GRNQty}</td>
    </tr>\n`;
    }
    return rows;
}
exports.sendGRNMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let GRNData = await Model.findById(subModuleId, {
            GRNNumber: 1,
            PONumber: 1,
            supplierInvoiceRef: 1,
            supplierInvoiceRefDate: 1,
            supplier: 1,
            createdAt: 1,
            updatedAt: 1,
            GRNStatus: 1,
            company: 1,
            GRNDate: 1,
            GRNDetails: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("PONumber", "PONumber")
            .populate("supplier", "supplierCode supplierName")
            .populate("GRNDetails.item", "itemCode itemName itemDescription hsn");
        GRNData.contactStr = getContactStr(GRNData.company.contactInfo, "Stores");
        let replacement = {
            contactStr: GRNData.contactStr ?? "",
            GRNNumber: GRNData?.GRNNumber,
            PONumber: GRNData?.PONumber?.PONumber,
            supplierInvoiceRef: GRNData?.supplierInvoiceRef,
            supplierInvoiceRefDate: GRNData?.supplierInvoiceRefDate,
            supplierName: GRNData?.supplier?.supplierName,
            createdAt: formatDate(GRNData.createdAt),
            updatedAt: formatDate(GRNData.updatedAt),
            GRNStatus: GRNData.GRNStatus,
            companyName: GRNData?.company?.companyName,
            GRNDate: formatDate(GRNData.GRNDate),
            GRNDetails: GRNData?.GRNDetails.map(ele => {
                return {
                    GRNLineNumber: ele?.GRNLineNumber,
                    itemName: ele.item?.itemName,
                    itemCode: ele?.item?.itemCode,
                    itemDescription: ele.item?.itemDescription,
                    batchDate: formatDate(ele.batchDate),
                    UOM: ele.UOM,
                    balancedQty: ele?.balancedQty,
                    invoicedQty: ele.invoicedQty,
                    GRNQty: ele?.GRNQty
                };
            }),
            msgInfo: MESSAGES.emailStrings.GRN_CREATE_MSG(action, GRNData?.company?.companyName),
            msgEnsure: MESSAGES.emailStrings.GRN_INFO_MSG(GRNData.contactStr)
        };
        let mailData = {
            templateUrl: STORES_MAIL_CONST.GRN.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: false
        };
        mailData.replacement.grnRows = getGRNtableRows(replacement.GRNDetails);
        if (replacement.GRNStatus == OPTIONS.defaultStatus.REPORT_GENERATED) {
            mailData.fileDelete = true;
            let url = `${CONSTANTS.reqURL}/#/print/grn?id=${subModuleId}&action=pdf`;
            mailData.attachments = await generatePdfPuppeteer(subModuleId, replacement.GRNNumber, url);
            mailData.replacement.msgInfo = MESSAGES.emailStrings.GRN_CREATE_MSG(
                "report has been generated",
                replacement?.companyName
            );
            mailData.subject = `Goods Receipt Note Report has been Generated - ${replacement.GRNNumber}`;
        }
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

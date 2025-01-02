const Model = require("../../../../models/quality/mrnModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generatePdfPuppeteer} = require("../../../../helpers/pupeeteerGeneratePdf");
const {CONSTANTS} = require("../../../../../config/config");
const {formatDate} = require("../../../../helpers/dateTime");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const {getContactStr} = require("../../../../helpers/utility");
const {QUALITY_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");
const {OPTIONS} = require("../../../../helpers/global.options");

exports.getMRNMailConfig = async ({MRNId, action, company, mailAction}) => {
    try {
        let replacementObj = await getMRNMailData(MRNId);
        let condition;
        if (action == "created") {
            condition = ["Partially Released", "Released", "Created"].includes(replacementObj.MRNStatus)
                ? "Created"
                : replacementObj.MRNStatus;
        } else if (action == "modified") {
            condition = ["Partially Released", "Released", "Created"].includes(replacementObj.MRNStatus)
                ? "Modified"
                : replacementObj.MRNStatus;
        }
        let mailData = {
            templateUrl: "templates/PO/mrnCreate.html",
            subject: `Material Release Note ${condition} - ${replacementObj.MRNNumber}`,
            attachments: null,
            replacement: replacementObj,
            fileDelete: false
        };
        mailData.replacement.mrnRows = getMRNtableRows(replacementObj.MRNDetails);
        mailData.replacement.msgInfo = MESSAGES.emailStrings.MRN_INFO_MSG(replacementObj.contactStr);
        mailData.replacement.msgEnsure = MESSAGES.emailStrings.MRN_CREATE_MSG(condition, replacementObj.companyName);
        if (condition == "Report Generated") {
            mailData.fileDelete = true;
            let url = `${CONSTANTS.reqURL}/#/print/mrn?id=${MRNId}&action=pdf`;
            mailData.attachments = await generatePdfPuppeteer(MRNId, replacementObj.MRNNumber, url);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.MRN_CREATE_MSG(
                "report has been generated",
                replacementObj.companyName
            );
            mailData.subject = `Material Release Note ${"Report has been Generated"} - ${replacementObj.MRNNumber}`;
        }
        let match = {
            company: company,
            module: "Quality",
            subModule: "MRN",
            action: mailAction
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getMRNMailConfig", e);
    }
};

async function getMRNMailData(MRNId) {
    try {
        let MRNData = await Model.findById(MRNId, {
            company: 1,
            GRNNumber: 1,
            supplier: 1,
            MRNDetails: 1,
            MRNNumber: 1,
            supplierInvoice: 1,
            createdAt: 1,
            supplierInvoiceRefDate: 1,
            updatedAt: 1,
            MRNStatus: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("GRNNumber", "GRNNumber supplierInvoiceRefDate")
            .populate("supplier", "supplierCode supplierName")
            .populate("MRNDetails.item", "itemCode itemName itemDescription hsn");
        let contactDetails = MRNData.company.contactInfo.find(x => x.department == "Purchase");
        if (contactDetails != undefined) {
            MRNData.contactStr = `${contactDetails.contactPersonName} (${contactDetails.companyContactPersonNumber},${contactDetails.companyContactPersonEmail})`;
        }
        return {
            contactStr: MRNData.contactStr ?? "",
            MRNNumber: MRNData?.MRNNumber,
            GRNNumber: MRNData?.GRNNumber.GRNNumber,
            supplierInvoice: MRNData?.supplierInvoice,
            supplierName: MRNData?.supplier?.supplierName,
            createdAt: formatDate(MRNData.createdAt),
            supplierInvoiceRefDate: formatDate(MRNData.supplierInvoiceRefDate),
            updatedAt: formatDate(MRNData.updatedAt),
            MRNStatus: MRNData.MRNStatus,
            companyName: MRNData.company.companyName,
            MRNDetails: MRNData?.MRNDetails.map(ele => {
                return {
                    MRNLineNumber: ele?.MRNLineNumber,
                    itemCode: ele?.item?.itemCode,
                    itemName: ele.item?.itemName,
                    itemDescription: ele.item?.itemDescription,
                    UOM: ele.UOM,
                    batchDate: formatDate(MRNData.batchDate),
                    GRNQty: ele?.GRNQty,
                    releasedQty: ele.releasedQty,
                    rejectedQty: ele.rejectedQty
                };
            })
        };
    } catch (error) {
        console.error(error);
    }
}

function getMRNtableRows(MRNDetails) {
    let rows = ``;
    for (let i = 0; i < MRNDetails.length; i++) {
        const element = MRNDetails[i];
        rows += `<tr>
        <td>${element.MRNLineNumber}</td>
        <td>${element.itemCode}</td>
        <td>${element.itemName}</td>
        <td>${element.itemDescription}</td>
        <td>${element.batchDate}</td>
        <td>${element.UOM}</td>
        <td>${element.GRNQty}</td>
        <td>${element.releasedQty}</td>
        <td>${element.rejectedQty}</td>
    </tr>\n`;
    }
    return rows;
}
exports.sendMRNMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let MRNData = await Model.findById(subModuleId, {
            company: 1,
            GRNNumber: 1,
            supplier: 1,
            MRNDetails: 1,
            MRNNumber: 1,
            supplierInvoice: 1,
            createdAt: 1,
            supplierInvoiceRefDate: 1,
            updatedAt: 1,
            MRNStatus: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("GRNNumber", "GRNNumber supplierInvoiceRefDate")
            .populate("supplier", "supplierCode supplierName")
            .populate("MRNDetails.item", "itemCode itemName itemDescription hsn");
        MRNData.contactStr = getContactStr(MRNData.company.contactInfo, "Quality");
        let replacement = {
            contactStr: MRNData.contactStr ?? "",
            MRNNumber: MRNData?.MRNNumber,
            GRNNumber: MRNData?.GRNNumber.GRNNumber,
            supplierInvoice: MRNData?.supplierInvoice,
            supplierName: MRNData?.supplier?.supplierName,
            createdAt: formatDate(MRNData.createdAt),
            supplierInvoiceRefDate: formatDate(MRNData.supplierInvoiceRefDate),
            updatedAt: formatDate(MRNData.updatedAt),
            MRNStatus: MRNData.MRNStatus,
            companyName: MRNData.company.companyName,
            MRNDetails: MRNData?.MRNDetails.map(ele => {
                return {
                    MRNLineNumber: ele?.MRNLineNumber,
                    itemCode: ele?.item?.itemCode,
                    itemName: ele.item?.itemName,
                    itemDescription: ele.item?.itemDescription,
                    UOM: ele.UOM,
                    batchDate: formatDate(MRNData.batchDate),
                    GRNQty: ele?.GRNQty,
                    releasedQty: ele.releasedQty,
                    rejectedQty: ele.rejectedQty
                };
            }),
            msgInfo: MESSAGES.emailStrings.MRN_INFO_MSG(MRNData.contactStr),
            msgEnsure: MESSAGES.emailStrings.MRN_CREATE_MSG(action, MRNData.company.companyName)
        };
        let mailData = {
            templateUrl: QUALITY_MAIL_CONST.MRN.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: false
        };
        mailData.replacement.mrnRows = getMRNtableRows(replacement.MRNDetails);
        if (replacement.MRNStatus == OPTIONS.defaultStatus.REPORT_GENERATED) {
            mailData.fileDelete = true;
            let url = `${CONSTANTS.reqURL}/#/print/mrn?id=${subModuleId}&action=pdf`;
            mailData.attachments = await generatePdfPuppeteer(subModuleId, replacement.MRNNumber, url);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.MRN_CREATE_MSG(
                "report has been generated",
                replacement.companyName
            );
            mailData.subject = `Material Release Note Report has been Generated - ${replacement.MRNNumber}`;
        }
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

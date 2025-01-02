const Model = require("../../../../models/stores/goodInwardEntryModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {CONSTANTS} = require("../../../../../config/config");
const {formatDate} = require("../../../../helpers/dateTime");
const {generatePdfPuppeteer} = require("../../../../helpers/pupeeteerGeneratePdf");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const {getContactStr} = require("../../../../helpers/utility");
const {STORES_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");

exports.getGINMailConfig = async ({ginId, company, mailAction}) => {
    try {
        let replacementObj = await getGINMailData(ginId);
        let mailData = {
            templateUrl: "templates/PO/ginCreate.html",
            subject: `Goods Inward Entry Created - ${replacementObj?.MRNNumber}`,
            attachments: null,
            replacement: replacementObj,
            fileDelete: true
        };
        mailData.replacement.ginRows = getGINtableRows(replacementObj.GINDetails);
        let url = `${CONSTANTS.reqURL}/#/print/gin?id=${ginId}&action=pdf`;
        mailData.attachments = await generatePdfPuppeteer(ginId, replacementObj.MRNNumber, url);
        mailData.replacement.msgEnsure = MESSAGES.emailStrings.GIN_CREATE_MSG(replacementObj.contactStr);
        let match = {
            company: company,
            module: "Stores",
            subModule: "Goods Inward Note",
            action: mailAction
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getGINMailConfig", e);
    }
};

async function getGINMailData(ginId) {
    try {
        let GINData = await Model.findById(ginId, {
            GINNumber: 1,
            supplier: 1,
            MRNNumber: 1,
            GINDate: 1,
            supplierInvoice: 1,
            GINStatus: 1,
            company: 1,
            GINDetails: 1
        })
            .populate("supplier", "supplierName supplierCode")
            .populate("MRNNumber", "MRNNumber")
            .populate("company", "contactInfo companyName")
            .populate("GINDetails.item", "itemCode itemName itemDescription hsn");
        let contactDetails = GINData.company.contactInfo.find(x => x.department == "Stores");
        if (contactDetails != undefined) {
            GINData.contactStr = `${contactDetails.contactPersonName} (${contactDetails.companyContactPersonNumber},${contactDetails.companyContactPersonEmail})`;
        }
        return {
            contactStr: GINData.contactStr ?? "",
            supplierName: GINData?.supplier?.supplierName,
            MRNNumber: GINData?.MRNNumber.MRNNumber,
            GINDate: formatDate(GINData.GINDate),
            supplierInvoice: GINData?.supplierInvoice,
            GINStatus: GINData?.GINStatus,
            companyName: GINData?.company?.companyName,
            GINDetails: GINData?.GINDetails.map(ele => {
                return {
                    GINNumber: GINData?.GINNumber,
                    GINDate: formatDate(GINData.GINDate),
                    MRN: GINData?.MRNNumber.MRNNumber,
                    itemCode: ele?.item?.itemCode,
                    itemName: ele?.item?.itemName,
                    itemDescription: ele?.item?.itemDescription,
                    UOM: ele.UOM,
                    releasedQty: ele.GINQty,
                    purchaseRatINR: ele.purchaseRate,
                    lineValueINR: ele.lineValueINR
                };
            })
        };
    } catch (error) {
        console.error(error);
    }
}
function getGINtableRows(GINDetails) {
    let rows = ``;
    for (let i = 0; i < GINDetails.length; i++) {
        const element = GINDetails[i];
        rows += `<tr>
        <td>${element.GINNumber}</td>
        <td>${element.GINDate}</td>
        <td>${element.MRN}</td>
        <td>${element.itemCode}</td>
        <td>${element.itemName}</td>
        <td>${element.itemDescription}</td>
        <td>${element.UOM}</td>
        <td>${element.releasedQty}</td>
        <td>${element.purchaseRatINR}</td>
        <td>${element.lineValueINR}</td>
    </tr>\n`;
    }
    return rows;
}
exports.sendGINMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let GINData = await Model.findById(subModuleId, {
            GINNumber: 1,
            supplier: 1,
            MRNNumber: 1,
            GINDate: 1,
            supplierInvoice: 1,
            GINStatus: 1,
            company: 1,
            GINDetails: 1
        })
            .populate("supplier", "supplierName supplierCode")
            .populate("MRNNumber", "MRNNumber")
            .populate("company", "contactInfo companyName")
            .populate("GINDetails.item", "itemCode itemName itemDescription hsn");
        GINData.contactStr = getContactStr(GINData.company.contactInfo, "Stores");
        let replacement = {
            contactStr: GINData.contactStr ?? "",
            supplierName: GINData?.supplier?.supplierName,
            MRNNumber: GINData?.MRNNumber.MRNNumber,
            GINDate: formatDate(GINData.GINDate),
            supplierInvoice: GINData?.supplierInvoice,
            GINStatus: GINData?.GINStatus,
            companyName: GINData?.company?.companyName,
            GINDetails: GINData?.GINDetails.map(ele => {
                return {
                    GINNumber: GINData?.GINNumber,
                    GINDate: formatDate(GINData.GINDate),
                    MRN: GINData?.MRNNumber.MRNNumber,
                    itemCode: ele?.item?.itemCode,
                    itemName: ele?.item?.itemName,
                    itemDescription: ele?.item?.itemDescription,
                    UOM: ele.UOM,
                    releasedQty: ele.GINQty,
                    purchaseRatINR: ele.purchaseRate,
                    lineValueINR: ele.lineValueINR
                };
            })
        };
        let mailData = {
            templateUrl: STORES_MAIL_CONST.GIN.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: true
        };
        mailData.replacement.ginRows = getGINtableRows(replacement.GINDetails);
        let url = `${CONSTANTS.reqURL}/#/print/gin?id=${subModuleId}&action=pdf`;
        mailData.subject = `Goods Inward Entry Created - ${replacement?.MRNNumber}`;
        mailData.attachments = await generatePdfPuppeteer(subModuleId, replacement.MRNNumber, url);
        mailData.replacement.msgEnsure = MESSAGES.emailStrings.GIN_CREATE_MSG(replacement.contactStr);
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

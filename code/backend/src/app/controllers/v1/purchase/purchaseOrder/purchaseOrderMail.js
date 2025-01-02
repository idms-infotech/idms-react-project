const {CONSTANTS} = require("../../../../../config/config");
const {formatDate} = require("../../../../helpers/dateTime");
const {OPTIONS} = require("../../../../helpers/global.options");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const MESSAGES = require("../../../../helpers/messages.options");
const {generatePdfPuppeteer} = require("../../../../helpers/pupeeteerGeneratePdf");
const {getContactStr} = require("../../../../helpers/utility");
const {PURCHASE_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");
const Model = require("../../../../models/purchase/purchaseOrderModel");

exports.getPOMailConfig = async ({POId, action, company, mailAction}) => {
    try {
        let replacementObj = await getPOMailData(POId);
        let mailData = {
            templateUrl: PURCHASE_MAIL_CONST.GENERATE_PO.CREATE_TEMPLATE,
            subject: null,
            attachments: null,
            replacement: replacementObj,
            fileDelete: false
        };
        mailData.replacement.poRows = getPOtableRows(replacementObj.PODetails);
        if (action == "modified" && replacementObj.POStatus == "Awaiting Approval") {
            mailAction = "Update";
            mailData.subject = `Purchase Order Modified - ${replacementObj.PONumber}`;
            mailData.replacement.msgInform = MESSAGES.emailStrings.PO_INFO_MSG("modified", replacementObj.companyName);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.PO_UPDATE_MSG(replacementObj.contactStr);
        } else if (action == "created" && replacementObj.POStatus == "Awaiting Approval") {
            mailData.subject = `Purchase Order Created - ${replacementObj.PONumber}`;
            mailData.replacement.msgInform = MESSAGES.emailStrings.PO_INFO_MSG("created", replacementObj.companyName);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.PO_CREATE_MSG(replacementObj.contactStr);
        } else if (replacementObj.POStatus == "Approved") {
            mailData.templateUrl = PURCHASE_MAIL_CONST.GENERATE_PO.APPROVE_TEMPLATE;
            mailData.subject = `Purchase Order Approved - ${replacementObj.PONumber}`;
            mailData.replacement.msgInform = MESSAGES.emailStrings.PO_INFO_MSG("approved");
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.PO_APPROVE_MSG(replacementObj.contactStr);
        } else if (replacementObj.POStatus == "Rejected") {
            mailData.templateUrl = PURCHASE_MAIL_CONST.GENERATE_PO.REJECT_TEMPLATE;
            mailData.subject = `Purchase Order Rejected - ${replacementObj.PONumber}`;
            mailData.replacement.msgInform = MESSAGES.emailStrings.PO_INFO_MSG("rejected");
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.PO_REJECT_MSG(
                replacementObj.remarks,
                replacementObj.contactStr
            );
        } else if (replacementObj.POStatus == "Report Generated") {
            mailData.fileDelete = true;
            let url = `${CONSTANTS.reqURL}/#/print/po_print?id=${POId}&action=pdf`;
            mailData.attachments = await generatePdfPuppeteer(POId, replacementObj.PONumber, url);
            mailData.subject = `Purchase Order Report has been generated - ${replacementObj.PONumber}`;
            mailData.replacement.msgInform = MESSAGES.emailStrings.PO_REPORT_MSG(
                "report has been generated",
                replacementObj.companyName
            );
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.PO_REPORT_GENERATED_MSG(replacementObj.contactStr);
        }
        let match = {
            company: company,
            module: PURCHASE_MAIL_CONST.GENERATE_PO.MODULE,
            subModule: PURCHASE_MAIL_CONST.GENERATE_PO.SUB_MODULE,
            action: mailAction
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getPOMailConfig", e);
    }
};
async function getPOMailData(POId) {
    try {
        let POData = await Model.findById(POId, {
            company: 1,
            PODetails: 1,
            PONumber: 1,
            supplier: 1,
            PODate: 1,
            deliveryDate: 1,
            createdAt: 1,
            updatedAt: 1,
            netPOValue: 1,
            POStatus: 1,
            remarks: 1,
            currency: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("supplier", "supplierCode supplierName")
            .populate("PODetails.item", "itemCode itemName itemDescription hsn");
        let contactDetails = POData.company.contactInfo.find(x => x.department == "Purchase");
        if (contactDetails != undefined) {
            POData.contactStr = `${contactDetails.contactPersonName} (${contactDetails.companyContactPersonNumber},${contactDetails.companyContactPersonEmail})`;
        }
        return {
            contactStr: POData.contactStr ?? "",
            PONumber: POData?.PONumber,
            supplierName: POData?.supplier?.supplierName,
            PODate: formatDate(POData.PODate),
            deliveryDate: formatDate(POData.deliveryDate),
            createdAt: formatDate(POData.createdAt),
            updatedAt: formatDate(POData.updatedAt),
            totalAmount: POData?.netPOValue,
            companyName: POData?.company?.companyName,
            POStatus: POData.POStatus,
            remarks: POData.remarks,
            currency: POData.currency,
            PODetails: POData?.PODetails.map(ele => {
                return {
                    itemCode: ele?.item?.itemCode,
                    supplierCode: POData?.supplier?.supplierCode,
                    itemName: ele.item?.itemName,
                    itemDescription: ele.item?.itemDescription,
                    deliveryDate: formatDate(ele.deliveryDate),
                    hsn: ele?.item?.hsn,
                    UOM: ele.UOM ? ele.UOM : ele.primaryUnit,
                    POQty: ele.POQty,
                    purchaseRate: ele.purchaseRate,
                    lineValue: ele.lineValue.toFixed(2)
                };
            })
        };
    } catch (error) {
        console.error(error);
    }
}
exports.sendPOMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let POData = await Model.findById(subModuleId, {
            company: 1,
            PODetails: 1,
            PONumber: 1,
            supplier: 1,
            PODate: 1,
            deliveryDate: 1,
            createdAt: 1,
            updatedAt: 1,
            netPOValue: 1,
            POStatus: 1,
            remarks: 1,
            currency: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("supplier", "supplierCode supplierName")
            .populate("PODetails.item", "itemCode itemName itemDescription hsn");
        POData.contactStr = getContactStr(POData.company.contactInfo, "Purchase");
        let replacement = {
            contactStr: POData.contactStr ?? "",
            PONumber: POData?.PONumber,
            supplierName: POData?.supplier?.supplierName,
            PODate: formatDate(POData.PODate),
            deliveryDate: formatDate(POData.deliveryDate),
            createdAt: formatDate(POData.createdAt),
            updatedAt: formatDate(POData.updatedAt),
            totalAmount: POData?.netPOValue,
            companyName: POData?.company?.companyName,
            POStatus: POData.POStatus,
            remarks: POData.remarks,
            currency: POData.currency,
            PODetails: POData?.PODetails.map(ele => {
                return {
                    itemCode: ele?.item?.itemCode,
                    supplierCode: POData?.supplier?.supplierCode,
                    itemName: ele.item?.itemName,
                    itemDescription: ele.item?.itemDescription,
                    deliveryDate: formatDate(ele.deliveryDate),
                    hsn: ele?.item?.hsn,
                    UOM: ele.UOM ? ele.UOM : ele.primaryUnit,
                    POQty: ele.POQty,
                    purchaseRate: ele.purchaseRate,
                    lineValue: ele.lineValue.toFixed(2)
                };
            }),
            msgInform: MESSAGES.emailStrings.PO_INFO_MSG(action, POData?.company?.companyName),
            msgEnsure: MESSAGES.emailStrings.PO_CREATE_MSG(action, POData.contactStr, POData.remarks)
        };

        let mailData = {
            templateUrl: PURCHASE_MAIL_CONST.GENERATE_PO.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: false
        };
        if (action == "modified") {
            mailAction = "Update";
            mailData.subject = `Purchase Order Modified - ${POData.PONumber}`;
            mailData.replacement.msgInform = MESSAGES.emailStrings.PO_INFO_MSG("modified", POData.companyName);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.PO_UPDATE_MSG(POData.contactStr);
        } else if (action == "created" && POData.POStatus == OPTIONS.defaultStatus.AWAITING_APPROVAL) {
            mailData.subject = `Purchase Order Created - ${POData.PONumber}`;
            mailData.replacement.msgInform = MESSAGES.emailStrings.PO_INFO_MSG("created", POData.companyName);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.PO_CREATE_MSG(POData.contactStr);
        } else if (POData.POStatus == OPTIONS.defaultStatus.APPROVED) {
            mailData.templateUrl = PURCHASE_MAIL_CONST.GENERATE_PO.APPROVE_TEMPLATE;
            mailData.subject = `Purchase Order Approved - ${POData.PONumber}`;
            mailData.replacement.msgInform = MESSAGES.emailStrings.PO_INFO_MSG("approved");
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.PO_APPROVE_MSG(POData.contactStr);
        } else if (POData.POStatus == OPTIONS.defaultStatus.REJECTED) {
            mailData.templateUrl = PURCHASE_MAIL_CONST.GENERATE_PO.REJECT_TEMPLATE;
            mailData.subject = `Purchase Order Rejected - ${POData.PONumber}`;
            mailData.replacement.msgInform = MESSAGES.emailStrings.PO_INFO_MSG("rejected");
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.PO_REJECT_MSG(POData.remarks, POData.contactStr);
        } else if (POData.POStatus == OPTIONS.defaultStatus.REPORT_GENERATED) {
            mailData.fileDelete = true;
            let url = `${CONSTANTS.reqURL}/#/print/po_print?id=${subModuleId}&action=pdf`;
            mailData.attachments = await generatePdfPuppeteer(subModuleId, POData?.PONumber, url);
            mailData.subject = `Purchase Order Report has been generated - ${POData?.PONumber}`;
            mailData.replacement.msgInform = MESSAGES.emailStrings.PO_REPORT_MSG(
                "report has been generated",
                POData?.companyName
            );
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.PO_REPORT_GENERATED_MSG(POData?.contactStr);
        }
        mailData.replacement.poRows = getPOtableRows(replacement.PODetails);
        return mailData;
    } catch (error) {
        console.error(error);
    }
};
function getPOtableRows(PODetails) {
    let rows = ``;
    for (let i = 0; i < PODetails.length; i++) {
        const element = PODetails[i];
        rows += `<tr>
        <td>${i + 1}</td>
        <td style="text-align: left;">
            <p>Item Code: ${element.itemCode} | Supplier's Code: ${element.supplierCode}</p>
            <p>Item Name:${element.itemName}</p>
            <p>Item Info:${element.itemDescription}</p>
        </td>
        <td>${element.deliveryDate}</td>
        <td>${element.hsn}</td>
        <td>${element.UOM}</td>
        <td>${element.POQty}</td>
        <td>${element.purchaseRate}</td>
        <td>${element.discount}</td>
        <td>${element.netRate}</td>
        <td>${element.lineValue}</td>
    </tr>\n`;
    }
    return rows;
}

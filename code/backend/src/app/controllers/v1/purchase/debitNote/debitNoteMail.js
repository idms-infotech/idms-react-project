const Model = require("../../../../models/purchase/debitNoteModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generatePdfPuppeteer} = require("../../../../helpers/pupeeteerGeneratePdf");
const {CONSTANTS} = require("../../../../../config/config");
const {formatDate} = require("../../../../helpers/dateTime");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const {getContactStr} = require("../../../../helpers/utility");
const {PURCHASE_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");
const {OPTIONS} = require("../../../../helpers/global.options");
exports.getDNMailConfig = async function ({id, action, company, mailAction}) {
    try {
        let replacementObj = await getDNMailData(id);
        let condition;
        if (action == "created") {
            condition = ["Awaiting Approval"].includes(replacementObj.DNStatus) ? "Created" : replacementObj.DNStatus;
        } else if (action == "modified") {
            condition = ["Awaiting Approval"].includes(replacementObj.DNStatus) ? "Modified" : replacementObj.DNStatus;
        }
        let mailData = {
            templateUrl: "templates/debitNote.html",
            subject: `Debit Note ${condition} - ${replacementObj.DNNumber}`,
            attachments: null,
            replacement: replacementObj,
            fileDelete: false
        };
        mailData.replacement.dnRows = await getDNtableRows(replacementObj.DNDetails);
        mailData.replacement.msgInfo = MESSAGES.emailStrings.DN_INFO_MSG(replacementObj.contactStr);
        mailData.replacement.msgEnsure = MESSAGES.emailStrings.DN_CREATE_MSG(
            `has been ${condition}`,
            replacementObj.companyName
        );
        if (condition == "Report Generated") {
            mailData.fileDelete = true;
            let url = `${CONSTANTS.reqURL}/#/print/debit_note?id=${id}&action=pdf`;
            mailData.attachments = await generatePdfPuppeteer(id, replacementObj.DNNumber, url);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.DN_CREATE_MSG(
                "report has been generated",
                replacementObj.companyName
            );
            mailData.subject = `Debit Note ${"report has been generated"} - ${replacementObj.DNNumber}`;
        }
        let match = {
            company: company,
            module: "Purchase",
            subModule: "Debit Note",
            action: mailAction == "Awaiting Approval" ? "Update" : mailAction
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getDNMailConfig", e);
    }
};
async function getDNMailData(DNId) {
    try {
        let DNData = await Model.findById(DNId, {
            DNNumber: 1,
            company: 1,
            supplier: 1,
            DNDetails: 1,
            DNDate: 1,
            createdAt: 1,
            netDNValue: 1,
            DNStatus: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("supplier", "supplierCode supplierName")
            .populate("DNDetails.item", "itemCode itemName itemDescription hsn");
        let contactDetails = DNData.company.contactInfo.find(x => x.department == "Purchase");
        if (contactDetails != undefined) {
            DNData.contactStr = `${contactDetails.contactPersonName} (${contactDetails.companyContactPersonNumber},${contactDetails.companyContactPersonEmail})`;
        }
        return {
            contactStr: DNData.contactStr ?? "",
            DNNumber: DNData?.DNNumber,
            supplierName: DNData?.supplier?.supplierName,
            DNDate: formatDate(DNData.DNDate),
            createdAt: formatDate(DNData.createdAt),
            netDNValue: DNData.netDNValue,
            companyName: DNData?.company?.companyName,
            DNStatus: DNData.DNStatus,
            DNDetails: DNData?.DNDetails.map(ele => {
                return {
                    DNLineNumber: ele?.DNLineNumber,
                    itemCode: ele?.item?.itemCode,
                    itemName: ele.item?.itemName,
                    itemDescription: ele.item?.itemDescription,
                    hsn: ele.item?.hsn,
                    UOM: ele.UOM,
                    purchaseRate: ele.purchaseRate,
                    MRNRejectedQty: ele?.MRNRejectedQty,
                    returnQty: ele.returnQty,
                    lineValue: ele.lineValue
                };
            })
        };
    } catch (error) {
        console.error(error);
    }
}
function getDNtableRows(DNDetails) {
    let rows = ``;
    for (let i = 0; i < DNDetails.length; i++) {
        const element = DNDetails[i];
        rows += `<tr>
        <td>${element.DNLineNumber}</td>
        <td>${element.itemCode}</td>
        <td style="text-align:  left;">${element.itemName}</td>
        <td style="text-align:  left;">${element.itemDescription}</td>
        <td>${element.hsn}</td>
        <td>${element.UOM}</td>
        <td>${element.returnQty}</td>
        <td>${element.purchaseRate}</td>
        <td>${element.lineValue}</td>
    </tr>\n`;
    }
    return rows;
}

exports.sendDebitNoteMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let DNData = await Model.findById(subModuleId, {
            DNNumber: 1,
            company: 1,
            supplier: 1,
            DNDetails: 1,
            DNDate: 1,
            createdAt: 1,
            netDNValue: 1,
            DNStatus: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("supplier", "supplierCode supplierName")
            .populate("DNDetails.item", "itemCode itemName itemDescription hsn");
        DNData.contactStr = getContactStr(DNData.company.contactInfo, "Purchase");
        let replacement = {
            contactStr: DNData.contactStr ?? "",
            DNNumber: DNData?.DNNumber,
            supplierName: DNData?.supplier?.supplierName,
            DNDate: formatDate(DNData.DNDate),
            createdAt: formatDate(DNData.createdAt),
            netDNValue: DNData.netDNValue,
            companyName: DNData?.company?.companyName,
            DNStatus: DNData.DNStatus,
            DNDetails: DNData?.DNDetails.map(ele => {
                return {
                    DNLineNumber: ele?.DNLineNumber,
                    itemCode: ele?.item?.itemCode,
                    itemName: ele.item?.itemName,
                    itemDescription: ele.item?.itemDescription,
                    hsn: ele.item?.hsn,
                    UOM: ele.UOM,
                    purchaseRate: ele.purchaseRate,
                    MRNRejectedQty: ele?.MRNRejectedQty,
                    returnQty: ele.returnQty,
                    lineValue: ele.lineValue
                };
            }),
            msgInfo: MESSAGES.emailStrings.DN_INFO_MSG(DNData.contactStr),
            msgEnsure: MESSAGES.emailStrings.DN_CREATE_MSG(`has been ${action}`, DNData?.company?.companyName)
        };
        let mailData = {
            templateUrl: PURCHASE_MAIL_CONST.DEBIT_NOTE.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: false
        };
        mailData.replacement.dnRows = await getDNtableRows(replacement.DNDetails);

        if (replacement.DNStatus == OPTIONS.defaultStatus.REPORT_GENERATED) {
            mailData.fileDelete = true;
            let url = `${CONSTANTS.reqURL}/#/print/debit_note?id=${subModuleId}&action=pdf`;
            mailData.attachments = await generatePdfPuppeteer(subModuleId, replacement.DNNumber, url);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.DN_CREATE_MSG(
                "report has been generated",
                replacement.companyName
            );
            mailData.subject = `Debit Note report has been generated - ${replacement.DNNumber}`;
        }
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

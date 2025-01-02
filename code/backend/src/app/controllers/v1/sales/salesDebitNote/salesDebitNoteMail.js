const Model = require("../../../../models/sales/salesDebitNoteModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generatePdfPuppeteer} = require("../../../../helpers/pupeeteerGeneratePdf");
const {CONSTANTS} = require("../../../../../config/config");
const {formatDate} = require("../../../../helpers/dateTime");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const {getContactStr} = require("../../../../helpers/utility");
const {SALES_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");
const {OPTIONS} = require("../../../../helpers/global.options");

exports.getSalesDNMailConfig = async function ({DNId, action, company, mailAction}) {
    try {
        let replacementObj = await getSalesDNMailData(DNId);
        let condition;
        if (action == "created") {
            condition = ["Awaiting Approval"].includes(replacementObj.DNStatus) ? "Created" : replacementObj.DNStatus;
        } else if (action == "modified") {
            condition = ["Awaiting Approval"].includes(replacementObj.DNStatus) ? "Modified" : replacementObj.DNStatus;
        }
        let mailData = {
            templateUrl: "templates/salesDebitNote.html",
            subject: `Debit Note ${condition} - ${replacementObj.DNNumber}`,
            attachments: null,
            replacement: replacementObj,
            fileDelete: false
        };
        mailData.replacement.dnRows = getDNtableRows(replacementObj.DNDetails);
        mailData.replacement.msgInfo = MESSAGES.emailStrings.DN_INFO_MSG(replacementObj.contactStr);
        mailData.replacement.msgEnsure = MESSAGES.emailStrings.DN_CREATE_MSG(
            `has been ${condition}`,
            replacementObj.companyName
        );
        if (condition == "Report Generated") {
            mailData.fileDelete = true;
            let url = `${CONSTANTS.reqURL}/#/print/sale_debit_note?id=${DNId}&action=pdf`;
            mailData.attachments = await generatePdfPuppeteer(DNId, replacementObj.DNNumber, url);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.DN_CREATE_MSG(
                "report has been generated",
                replacementObj.companyName
            );
            mailData.subject = `Debit Note  ${"report has been generated"} - ${replacementObj.DNNumber}`;
        }
        let match = {
            company: company,
            module: "Sales",
            subModule: "Debit Note",
            action: mailAction == "Awaiting Approval" ? "Update" : mailAction
        };

        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getSalesDNMailConfig", e);
    }
};
async function getSalesDNMailData(DNId) {
    try {
        let data = await Model.findById(DNId, {
            DNNumber: 1,
            customer: 1,
            DNDate: 1,
            createdAt: 1,
            netDNValue: 1,
            company: 1,
            DNStatus: 1,
            DNDetails: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("customer", "customerCode customerName")
            .populate("DNDetails.SKU", "SKUNo SKUName SKUDescription hsn");
        let contactDetails = data.company.contactInfo.find(x => x.department == "Sales");
        if (contactDetails != undefined) {
            data.contactStr = `${contactDetails.contactPersonName} (${contactDetails.companyContactPersonNumber},${contactDetails.companyContactPersonEmail})`;
        }
        return {
            contactStr: data.contactStr ?? "",
            DNNumber: data?.DNNumber,
            customerName: data?.customer?.customerName,
            DNDate: formatDate(data.DNDate),
            createdAt: formatDate(data.createdAt),
            netDNValue: data.netDNValue,
            companyName: data?.company?.companyName,
            DNStatus: data.DNStatus,
            DNDetails: data?.DNDetails.map(ele => {
                return {
                    DNLineNumber: ele?.DNLineNumber,
                    SKUNo: ele?.SKU?.SKUNo,
                    SKUName: ele.SKU?.SKUName,
                    SKUDescription: ele.SKU?.SKUDescription,
                    hsn: ele?.hsn,
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
        <td>${element.SKUNo}</td>
        <td style="text-align:  left;">${element.SKUName}</td>
        <td style="text-align:  left;">${element.SKUDescription}</td>
        <td>${element.hsn}</td>
        <td>${element.UOM}</td>
        <td>${element.returnQty}</td>
        <td>${element.purchaseRate}</td>
        <td>${element.lineValue}</td>
    </tr>\n`;
    }
    return rows;
}

exports.sendSalesDNMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let data = await Model.findById(subModuleId, {
            DNNumber: 1,
            customer: 1,
            DNDate: 1,
            createdAt: 1,
            netDNValue: 1,
            company: 1,
            DNStatus: 1,
            DNDetails: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("customer", "customerCode customerName")
            .populate("DNDetails.SKU", "SKUNo SKUName SKUDescription hsn");
        data.contactStr = getContactStr(data.company.contactInfo, "Sales");
        let replacement = {
            contactStr: data.contactStr ?? "",
            DNNumber: data?.DNNumber,
            customerName: data?.customer?.customerName,
            DNDate: formatDate(data.DNDate),
            createdAt: formatDate(data.createdAt),
            netDNValue: data.netDNValue,
            companyName: data?.company?.companyName,
            DNStatus: data.DNStatus,
            DNDetails: data?.DNDetails.map(ele => {
                return {
                    DNLineNumber: ele?.DNLineNumber,
                    SKUNo: ele?.SKU?.SKUNo,
                    SKUName: ele.SKU?.SKUName,
                    SKUDescription: ele.SKU?.SKUDescription,
                    hsn: ele?.hsn,
                    UOM: ele.UOM,
                    purchaseRate: ele.purchaseRate,
                    MRNRejectedQty: ele?.MRNRejectedQty,
                    returnQty: ele.returnQty,
                    lineValue: ele.lineValue
                };
            }),
            msgInfo: MESSAGES.emailStrings.DN_INFO_MSG(data?.contactStr),
            msgEnsure: MESSAGES.emailStrings.DN_CREATE_MSG(`has been ${action}`, data?.company?.companyName)
        };
        let mailData = {
            templateUrl: SALES_MAIL_CONST.DEBIT_NOTE.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: false
        };
        mailData.replacement.dnRows = getDNtableRows(replacement.DNDetails);
        if (replacement.DNStatus == OPTIONS.defaultStatus.REPORT_GENERATED) {
            mailData.fileDelete = true;
            let url = `${CONSTANTS.reqURL}/#/print/sale_debit_note?id=${subModuleId}&action=pdf`;
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

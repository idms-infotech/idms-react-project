const Model = require("../../../../models/sales/creditNoteModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generatePdfPuppeteer} = require("../../../../helpers/pupeeteerGeneratePdf");
const {CONSTANTS} = require("../../../../../config/config");
const {formatDate} = require("../../../../helpers/dateTime");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const {getContactStr} = require("../../../../helpers/utility");
const {SALES_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");
const {OPTIONS} = require("../../../../helpers/global.options");

exports.getCNMailConfig = async function ({CNId, action, company, mailAction}) {
    try {
        let replacementObj = await getCNMailData(CNId);
        let condition;
        if (action == "created") {
            condition = ["Awaiting Approval"].includes(replacementObj.CNStatus) ? "Created" : replacementObj.CNStatus;
        } else if (action == "modified") {
            condition = ["Awaiting Approval"].includes(replacementObj.CNStatus) ? "Modified" : replacementObj.CNStatus;
        }
        let mailData = {
            templateUrl: "templates/creditNote.html",
            subject: `Credit Note ${condition} - ${replacementObj.CNNumber}`,
            attachments: null,
            replacement: replacementObj,
            fileDelete: false
        };
        mailData.replacement.cnRows = getCNtableRows(replacementObj.CNDetails);
        mailData.replacement.msgEnsure = MESSAGES.emailStrings.CN_CREATE_MSG(
            `has been ${condition}`,
            replacementObj.companyName
        );
        if (condition == "Report Generated") {
            mailData.fileDelete = true;
            let url = `${CONSTANTS.reqURL}/#/print/credit_note?id=${CNId}&action=pdf`;
            mailData.attachments = await generatePdfPuppeteer(CNId, replacementObj.CNNumber, url);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.CN_CREATE_MSG(
                "report has been generated",
                replacementObj.companyName
            );
            mailData.subject = `Credit Note Report has been Generated - ${replacementObj.CNNumber}`;
        }
        let match = {
            company: company,
            module: "Sales",
            subModule: "Credit Note",
            action: mailAction == "Awaiting Approval" ? "Update" : mailAction
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getCNMailConfig", e);
    }
};

async function getCNMailData(CNId) {
    try {
        let CNData = await Model.findById(CNId, {
            CNNumber: 1,
            customer: 1,
            CNDate: 1,
            invoiceDate: 1,
            createdAt: 1,
            netCNValue: 1,
            CNStatus: 1,
            company: 1,
            CNDetails: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("customer", "customerCode customerName")
            .populate("CNDetails.SKU", "SKUNo SKUName SKUDescription hsn");
        let contactDetails = CNData.company.contactInfo.find(x => x.department == "Sales");
        if (contactDetails != undefined) {
            CNData.contactStr = `${contactDetails.contactPersonName} (${contactDetails.companyContactPersonNumber},${contactDetails.companyContactPersonEmail})`;
        }
        return {
            contactStr: CNData.contactStr ?? "",
            CNNumber: CNData?.CNNumber,
            customerName: CNData?.customer?.customerName,
            CNDate: formatDate(CNData.CNDate),
            invoiceDate: formatDate(CNData.invoiceDate),
            createdAt: formatDate(CNData.createdAt),
            netCNValue: CNData.netCNValue,
            CNStatus: CNData.CNStatus,
            companyName: CNData?.company?.companyName,
            CNDetails: CNData?.CNDetails.map(ele => {
                return {
                    CNLineNumber: ele?.CNLineNumber,
                    SKUCode: ele?.SKU?.SKUNo,
                    SKUName: ele.SKU?.SKUName,
                    SKUDescription: ele.SKU?.SKUDescription,
                    hsn: ele.SKU?.hsn,
                    UOM: ele.UOM,
                    standardRate: ele.standardRate,
                    returnQty: ele.returnQty,
                    lineValue: ele.lineValue
                };
            })
        };
    } catch (error) {
        console.error(error);
    }
}

function getCNtableRows(CNDetails) {
    let rows = ``;
    for (let i = 0; i < CNDetails.length; i++) {
        const element = CNDetails[i];
        rows += `<tr>
        <td>${i + 1}</td>
        <td>${element.SKUCode}</td>
        <td style="text-align:  left;">${element.SKUName}</td>
        <td style="text-align:  left;">${element.SKUDescription}</td>
        <td>${element.hsn}</td>
        <td>${element.UOM}</td>
        <td>${element.returnQty}</td>
        <td>${element.standardRate}</td>
        <td>${element.lineValue}</td>
    </tr>\n`;
    }
    return rows;
}

exports.sendCreditNoteMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let CNData = await Model.findById(subModuleId, {
            CNNumber: 1,
            customer: 1,
            CNDate: 1,
            invoiceDate: 1,
            createdAt: 1,
            netCNValue: 1,
            CNStatus: 1,
            company: 1,
            CNDetails: 1
        })
            .populate("company", "contactInfo companyName")
            .populate("customer", "customerCode customerName")
            .populate("CNDetails.SKU", "SKUNo SKUName SKUDescription hsn");
        CNData.contactStr = getContactStr(CNData.company.contactInfo, "Sales");
        let replacement = {
            contactStr: CNData.contactStr ?? "",
            CNNumber: CNData?.CNNumber,
            customerName: CNData?.customer?.customerName,
            CNDate: formatDate(CNData.CNDate),
            invoiceDate: formatDate(CNData.invoiceDate),
            createdAt: formatDate(CNData.createdAt),
            netCNValue: CNData.netCNValue,
            CNStatus: CNData.CNStatus,
            companyName: CNData?.company?.companyName,
            CNDetails: CNData?.CNDetails.map(ele => {
                return {
                    CNLineNumber: ele?.CNLineNumber,
                    SKUCode: ele?.SKU?.SKUNo,
                    SKUName: ele.SKU?.SKUName,
                    SKUDescription: ele.SKU?.SKUDescription,
                    hsn: ele.SKU?.hsn,
                    UOM: ele.UOM,
                    standardRate: ele.standardRate,
                    returnQty: ele.returnQty,
                    lineValue: ele.lineValue
                };
            }),
            msgEnsure: MESSAGES.emailStrings.CN_CREATE_MSG(`has been ${action}`, CNData?.company?.companyName)
        };
        let mailData = {
            templateUrl: SALES_MAIL_CONST.CREDIT_NOTE.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: false
        };
        mailData.replacement.cnRows = getCNtableRows(replacement.CNDetails);
        if (replacement.CNStatus == OPTIONS.defaultStatus.REPORT_GENERATED) {
            mailData.fileDelete = true;
            let url = `${CONSTANTS.reqURL}/#/print/credit_note?id=${subModuleId}&action=pdf`;
            mailData.attachments = await generatePdfPuppeteer(subModuleId, replacement.CNNumber, url);
            mailData.replacement.msgEnsure = MESSAGES.emailStrings.CN_CREATE_MSG(
                "report has been generated",
                replacement.companyName
            );
            mailData.subject = `Credit Note Report has been Generated - ${replacement.CNNumber}`;
        }
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

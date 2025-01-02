const {generatePdfPuppeteer} = require("../../../../helpers/pupeeteerGeneratePdf");
const {CONSTANTS} = require("../../../../../config/config");
const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const SORepository = require("../../../../models/sales/repository/salesOrderRepository");
const {SALES_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");
const {getContactStr} = require("../../../../helpers/utility");
const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
exports.getSOMailConfig = async itemDetails => {
    try {
        let contactDetails = itemDetails.company.contactInfo.find(x => x.department == "Sales");
        let mailData = {
            templateUrl: "templates/SOConfirmation.html",
            subject: `Sales Order Confirmation – ${itemDetails.SONumber}`,
            attachments: null,
            replacement: {},
            fileDelete: true
        };
        if (contactDetails != undefined) {
            mailData.replacement.contactStr = `${itemDetails.company.companyName} [${contactDetails.contactPersonName} (${contactDetails.companyContactPersonNumber},${contactDetails.companyContactPersonEmail})]`;
        }
        let url = `${CONSTANTS.reqURL}/#/print/so_confirmation?id=${itemDetails._id}&action=pdf`;
        mailData.attachments = await generatePdfPuppeteer(itemDetails._id, itemDetails.SONumber, url);
        let match = {
            company: itemDetails.company._id,
            module: "Sales",
            subModule: "Sales Order",
            action: "Report Generated"
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getSOMailConfig", e);
    }
};

exports.sendSalesMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let SOData = await SORepository.filteredSalesOrderList([
            {
                $match: {
                    _id: ObjectId(subModuleId)
                }
            },
            {
                $lookup: {
                    from: "Company",
                    localField: "company",
                    foreignField: "_id",
                    pipeline: [{$project: {contactInfo: 1, companyName: 1}}],
                    as: "company"
                }
            },
            {$unwind: "$company"},
            {
                $project: {
                    SONumber: 1,
                    company: 1
                }
            }
        ]);
        let replacement = {
            contactStr: ""
        };
        replacement.contactStr = getContactStr(SOData[0]?.company?.contactInfo, "Sales");
        let mailData = {
            templateUrl: SALES_MAIL_CONST.SALES_ORDER.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: true
        };
        let url = `${CONSTANTS.reqURL}/#/print/so_confirmation?id=${SOData[0]?._id}&action=pdf`;
        mailData.attachments = await generatePdfPuppeteer(SOData[0]?._id, SOData[0]?.SONumber, url);
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

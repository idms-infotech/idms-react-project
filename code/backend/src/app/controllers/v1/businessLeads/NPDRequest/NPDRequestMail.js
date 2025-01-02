const {mailConfigHelper} = require("../../../../helpers/mailConfigHelper");
const {getContactStr} = require("../../../../helpers/utility");
const {BUSINESS_LEAD_MAIL_CONST, DEFAULT_MAIL_RECEIVER} = require("../../../../mocks/mailTriggerConstants");
const Model = require("../../../../models/businessLeads/NPDModel");

exports.getNPDMailConfig = async ({id, action, company, mailAction}) => {
    try {
        let replacementObj = await getNPDMailData(id);
        replacementObj.action = action;
        let mailData = {
            templateUrl: BUSINESS_LEAD_MAIL_CONST.NPD_REQUEST.CREATE_TEMPLATE,
            subject: `NPD No. ${replacementObj.NPDNo} ${action} for ${replacementObj.name}`,
            replacement: replacementObj,
            attachments: null
        };
        let match = {
            company: company,
            module: "Business Leads",
            subModule: "NPD Request",
            action: mailAction
        };
        await mailConfigHelper(mailData, match);
    } catch (e) {
        console.error("getNPDMailConfig", e);
    }
};

const getNPDMailData = async NPDId => {
    try {
        let NPDData = await Model.findById(NPDId, {
            NPDNo: 1,
            reference: 1,
            referenceModel: 1,
            status: 1,
            company: 1
        })
            .populate("reference", "customerName prospectName")
            .populate("company", "contactInfo companyName")
            .lean();
        if (!!NPDData.referenceModel && NPDData.referenceModel == "Customer") {
            NPDData.reference.name = NPDData.reference?.customerName;
        } else {
            NPDData.reference.name = NPDData.reference?.prospectName;
        }
        let contactDetails = NPDData.company.contactInfo.find(x => x.department == "Sales"); // To be asked which Dept
        if (contactDetails != undefined) {
            NPDData.contactStr = `${contactDetails.contactPersonName} (${contactDetails.companyContactPersonNumber},${contactDetails.companyContactPersonEmail})`;
        }
        return {
            contactStr: NPDData.contactStr ?? "",
            NPDNo: NPDData?.NPDNo,
            name: NPDData?.reference?.name,
            status: NPDData.status,
            companyName: NPDData?.company?.companyName
        };
    } catch (error) {
        console.error(error);
    }
};

exports.sendNPDRequestMail = async ({
    subModuleId = null,
    action = null,
    message = null,
    emailTo = null,
    emailCC = null,
    emailBCC = null
}) => {
    try {
        let NPDData = await Model.findById(subModuleId, {
            NPDNo: 1,
            reference: 1,
            referenceModel: 1,
            status: 1,
            company: 1
        })
            .populate("reference", "customerName prospectName")
            .populate("company", "contactInfo companyName")
            .lean();
        if (!!NPDData.referenceModel && NPDData.referenceModel == "Customer") {
            NPDData.reference.name = NPDData.reference?.customerName;
        } else {
            NPDData.reference.name = NPDData.reference?.prospectName;
        }
        NPDData.contactStr = getContactStr(NPDData.company.contactInfo, "Sales");
        let replacement = {
            contactStr: NPDData.contactStr ?? "",
            NPDNo: NPDData?.NPDNo,
            name: NPDData?.reference?.name,
            status: NPDData.status,
            companyName: NPDData?.company?.companyName,
            action: action
        };
        let mailData = {
            templateUrl: BUSINESS_LEAD_MAIL_CONST.NPD_REQUEST.CREATE_TEMPLATE,
            subject: message,
            replacement: replacement,
            toEmailValue: emailTo ? emailTo : [DEFAULT_MAIL_RECEIVER],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            attachments: null,
            fileDelete: false
        };
        return mailData;
    } catch (error) {
        console.error(error);
    }
};

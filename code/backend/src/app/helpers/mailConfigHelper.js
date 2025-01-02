const {CONSTANTS} = require("../../config/config");
const {getAllMailConfig} = require("../controllers/v1/settings/mail-config/mail-config");
const MailTriggerRepository = require("../models/settings/repository/mailTriggerRepository");
const MailConfig = require("../utilities/mailConfigHandler");

const mailer = new MailConfig(CONSTANTS.nodeMailerTransporterOptions);

exports.mailConfigHelper = async (mailObj, match) => {
    try {
        let {emailTo, emailCC, emailBCC} = await getAllMailConfig(match);
        await MailTriggerRepository.findAndUpdateDoc(
            {
                module: match.module,
                subModule: match.subModule
            },
            {
                emailTo,
                emailCC,
                emailBCC
            }
        );
        let mailData = {
            toEmailValue: emailTo ? emailTo : ["dev@idmsinfotech.com"],
            cc: emailCC ? emailCC : [],
            bcc: emailBCC ? emailBCC : [],
            ...mailObj
        };
        mailer.sendMail(mailData);
    } catch (e) {
        console.error("mailConfigHelper", e);
    }
};

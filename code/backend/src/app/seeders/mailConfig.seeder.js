const mailConfigJson = require("../mocks/mailConfig.json");
const MailConfigRepository = require("../models/settings/repository/mailConfigRepository");

exports.mailConfigInsert = async function (companyId) {
    try {
        for await (const ele of mailConfigJson) {
            const existing = await MailConfigRepository.findOneMailConfig({
                module: ele.module,
                subModule: ele.subModule,
                action: ele.action
            });
            ele.company = companyId;
            if (!existing) {
                await MailConfigRepository.createMailConfig(ele);
            } else {
                delete ele.emailTo;
                delete ele.emailCC;
                delete ele.emailBCC;
                await MailConfigRepository.updateMailConfig(existing, ele);
            }
        }
        console.info("Mail Configuration updated successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

const mongoose = require("mongoose");
const {MAIL_TRIGGER: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {getAllMailConfig} = require("../../controllers/v1/settings/mail-config/mail-config");
const mailTriggerSchema = new mongoose.Schema(
    {
        subModuleId: {
            type: String,
            required: false
        },
        action: {
            type: String,
            required: false
        },
        company: {
            type: String,
            required: false
        },
        mailAction: {
            type: String,
            required: false
        },
        collectionName: {
            type: String,
            required: false
        },
        message: {
            type: String,
            required: false
        },
        module: {
            type: String,
            required: false
        },
        subModule: {
            type: String,
            required: false
        },
        emailTo: {
            type: String,
            required: false
        },
        emailCC: {
            type: String,
            required: false
        },
        emailBCC: {
            type: String,
            required: false
        },
        isSent: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
mailTriggerSchema.pre("save", async function (next) {
    const match = {
        company: this.company,
        module: this.module,
        subModule: this.subModule,
        action: this.mailAction
    };
    let mailConfig = await getAllMailConfig(match);
    this.emailTo = mailConfig?.emailTo;
    this.emailCC = mailConfig?.emailCC;
    this.emailBCC = mailConfig?.emailBCC;
    next();
});
mailTriggerSchema.plugin(paginatePlugin);
mailTriggerSchema.index({createdAt: 1}, {expireAfterSeconds: 604800});
const MailTrigger = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, mailTriggerSchema);

module.exports = MailTrigger;

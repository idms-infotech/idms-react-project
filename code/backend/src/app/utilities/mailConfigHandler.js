const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs/promises");
const fss = require("fs");
const {CONSTANTS} = require("../../config/config");

class MailConfig {
    constructor(smtpConfig) {
        this.transporter = nodemailer.createTransport(smtpConfig);
    }
    async readHTMLFile(path) {
        try {
            const html = await fs.readFile(path, {encoding: "utf-8"});
            return html;
        } catch (err) {
            throw err;
        }
    }
    async triggerMail(mailOptions, fileDelete) {
        this.transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.error(err);
            } else {
                console.info("A assign to email has been sent.", info);
            }
            if (fileDelete && fss.existsSync(mailOptions.attachments[0].path)) {
                fss.unlinkSync(mailOptions.attachments[0].path);
            }
        });
    }
    async sendMail(data) {
        try {
            const html = await this.readHTMLFile(data.templateUrl);
            const template = handlebars.compile(html);
            let modifiedHTML = template(data.replacement)
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&#x3D;/g, "=");
            const mailOptions = {
                from: `"IDMS Support Team"<${CONSTANTS.fromEmailAddress}>`,
                html: modifiedHTML,
                subject: data.subject,
                to: data.toEmailValue,
                cc: data.cc,
                bcc: data.bcc,
                attachments: data.attachments
            };
            await this.triggerMail(mailOptions, data.fileDelete);
        } catch (error) {
            console.error("Error occurred while sending mail:", error);
            throw error;
        }
    }
}

module.exports = MailConfig;

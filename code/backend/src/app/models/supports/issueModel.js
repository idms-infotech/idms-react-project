const mongoose = require("mongoose");
const {CONSTANTS} = require("../../../config/config");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {ISSUE: SCHEMA_CONST} = require("../../mocks/schemasConstant/supportConstant");
const issueSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Company"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "User"
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "User"
        },
        issueNumber: {
            type: String,
            required: false
        },
        ticketType: {
            type: String,
            required: false
        },
        priority: {
            type: String,
            required: false
        },
        severity: {
            type: String,
            required: false
        },
        issueStatus: {
            type: String,
            required: true,
            default: "Open"
        },
        issueTitle: {
            type: String,
            required: false
        },
        subModuleName: {
            type: String,
            required: false
        },
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "menuItems"
        },
        issueDescription: {
            type: String,
            required: false
        },
        issueDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        closedOn: {
            type: Date,
            required: false
        },
        issueAttachment: {
            type: String,
            required: false
        },
        issueResolution: {
            type: String,
            required: false
        },
        raisedBy: {
            type: String,
            required: false
        },
        oldHistory: []
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME,
        toObject: {virtuals: true},
        toJSON: {virtuals: true}
    }
);

issueSchema.set("toJson", {virtuals: true});
issueSchema.virtual("url").get(function () {
    if (this.issueAttachment && this.issueAttachment != "undefined") {
        return CONSTANTS.domainUrl + "issueAttachment/" + this.issueAttachment;
    }
});

issueSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    let historyData = JSON.parse(JSON.stringify(this));
    delete historyData.oldHistory;
    delete historyData.id;
    delete historyData._id;
    delete historyData.company;
    delete historyData.createdBy;
    delete historyData.updatedBy;
    historyData.action = "Ticket Updated";
    if (this.isNew) {
        this.issueNumber = await getAndSetAutoIncrementNo(SCHEMA_CONST.AUTO_INCREMENT_DATA(), this.company, true);
        historyData.action = "Ticket Created";
    }
    this.oldHistory.push(historyData);
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
const Issue = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, issueSchema);

module.exports = Issue;

const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy,
        action: isNew ? SCHEMA_CONST.ADDED_ACTION : SCHEMA_CONST.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};

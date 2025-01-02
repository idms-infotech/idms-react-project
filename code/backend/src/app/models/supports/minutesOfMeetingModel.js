const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {MOM: SCHEMA_CONST} = require("../../mocks/schemasConstant/supportConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const minutesOfMeetingSchema = new mongoose.Schema(
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
        MOMCode: {
            type: String,
            required: false
        },
        MOMDate: {
            type: Date,
            required: false
        },
        MOMTitle: {
            type: String,
            required: false
        },
        meetingType: {
            type: String,
            required: false
        },
        venue: {
            type: String,
            required: false
        },
        organizer: {
            type: String,
            required: false
        },
        attendedBy: {
            type: String,
            required: false
        },
        meetingInfo: [
            {
                actionPoint: {
                    type: String,
                    required: false
                },
                owner: {
                    type: String,
                    required: false
                },
                targetDate: {
                    type: Date,
                    required: false
                },
                reviewDate: {
                    type: Date,
                    required: false
                },
                status: {
                    type: String,
                    required: false
                    // enum: OPTIONS.defaultStatus.getAllMOMStatusAsArray(),
                },
                remarks: {
                    type: String,
                    required: false
                }
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

minutesOfMeetingSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.MOMCode = await getAndSetAutoIncrementNo(SCHEMA_CONST.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

const MinutesOfMeeting = mongoose.model("MinutesOfMeeting", minutesOfMeetingSchema);

module.exports = MinutesOfMeeting;

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

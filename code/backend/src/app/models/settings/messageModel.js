const mongoose = require("mongoose");
const {MESSAGE: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const messageSchema = new mongoose.Schema(
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
        messageCode: {
            type: String,
            required: true
        },
        eventType: {
            type: String,
            required: true
        },
        eventTypeId: {
            type: String,
            required: false
        },
        eventTypeCode: {
            type: String,
            required: false
        },
        communicationType: {
            type: String,
            required: false,
            enum: ["MAIL"]
        },
        successFlag: {
            type: Boolean,
            required: true
        },
        failedCount: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: true,
            default: 0
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
messageSchema.pre("save", async function (next) {
    if (this.isNew) {
        this.messageCode = await getAndSetAutoIncrementNo(SCHEMA_CONST.AUTO_INCREMENT_DATA(), this.company, true);
    }
    next();
});

const Message = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, messageSchema);
module.exports = Message;

const mongoose = require("mongoose");
const {AUDIT: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const auditSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Company"
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "User"
        },
        date: {
            type: Date,
            required: false,
            default: Date.now()
        },
        action: {
            type: String,
            required: false
        },
        fieldsModified: {
            type: String,
            required: false
        },
        data: {
            type: String,
            required: false
        },
        oldData: {
            type: String,
            required: false
        },
        sensitiveInfo: {
            field: {
                type: String,
                required: false
            },
            oldValue: {
                type: String,
                required: false
            }
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
auditSchema.plugin(paginatePlugin);
auditSchema.pre("save", async function (next) {
    next();
});
auditSchema.index({createdAt: 1}, {expireAfterSeconds: 604800});
const Audit = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, auditSchema);

module.exports = Audit;

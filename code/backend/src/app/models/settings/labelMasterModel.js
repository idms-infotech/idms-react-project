const mongoose = require("mongoose");
const {LABEL_MASTER: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const labelMasterSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Company"
        },
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "MenuItem"
        },
        labelName: {
            type: String,
            required: false
        },
        displayLabelName: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
labelMasterSchema.plugin(paginatePlugin);
const LabelMaster = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, labelMasterSchema);
module.exports = LabelMaster;

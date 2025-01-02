const mongoose = require("mongoose");
const {ATTRIBUTES_CONFIGURATION: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const attributesConfigurationSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Company"
        },
        type: {
            type: String,
            required: false
        },
        items: [
            {
                order: {
                    type: Number,
                    required: false
                },
                tabName: {
                    type: String,
                    required: false
                },
                tabDisplayName: {
                    type: String,
                    required: false
                },
                status: {
                    type: Boolean,
                    required: false,
                    default: true
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
attributesConfigurationSchema.plugin(paginatePlugin);
const AttributesConfiguration = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, attributesConfigurationSchema);
module.exports = AttributesConfiguration;

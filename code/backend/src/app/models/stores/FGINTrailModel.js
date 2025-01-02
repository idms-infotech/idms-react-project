const mongoose = require("mongoose");
const {FGIN_TRAIL: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/storesConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const FGINTrailSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Company"
        },
        SKUId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "SKUMaster"
        },
        SKUNo: {
            type: String,
            required: false
        },
        SKUName: {
            type: String,
            required: false
        },
        SKUDescription: {
            type: String,
            required: false
        },
        UOM: {
            type: String,
            required: false
        },
        openingQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        inwardQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        invQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        invReturnedQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        recoQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        closingQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

FGINTrailSchema.plugin(paginatePlugin);
const FGINTrail = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, FGINTrailSchema);

module.exports = FGINTrail;

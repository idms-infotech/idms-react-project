const mongoose = require("mongoose");
const {LOCATION: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");

const locationSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
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
        locCode: {
            type: String,
            required: false,
            default: "L001"
        },
        locName: {
            type: String,
            required: false
        },
        locGST: {
            type: String,
            required: false
        },
        addressLine1: {
            type: String,
            required: false,
            trim: true
        },
        addressLine2: {
            type: String,
            required: false,
            trim: true
        },
        addressLine3: {
            type: String,
            required: false,
            trim: true,
            default: "-"
        },
        state: {
            type: String,
            required: false,
            trim: true
        },
        city: {
            type: String,
            required: false,
            trim: true
        },
        district: {
            type: String,
            required: false,
            trim: true
        },
        pinCode: {
            type: String,
            required: false,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Location = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, locationSchema);

module.exports = Location;

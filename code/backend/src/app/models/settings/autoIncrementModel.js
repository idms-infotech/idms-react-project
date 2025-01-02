const mongoose = require("mongoose");
const {auditModule} = require("../../controllers/v1/settings/audit/audit");
const {AUTO_INCREMENT: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");

const AutoIncrementSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Company"
    },
    moduleName: {
        type: String,
        required: false
    },
    module: {
        type: String,
        required: true,
        index: {unique: true}
    },
    modulePrefix: {
        type: String,
        required: false
    },
    digit: {
        type: Number,
        required: false,
        default: 4
    },
    autoIncrementValue: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        default: 1
    },
    locationCounters: [
        {
            location: {
                type: String,
                required: false
            },
            counter: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                default: 1
            },
            digit: {
                type: Number,
                required: false,
                default: 4
            },
            modulePrefix: {
                type: String,
                required: false
            }
        }
    ]
});
AutoIncrementSchema.statics.getNextId = async function (moduleName, module, company, location = null, callback) {
    let autoIncrement = await this.findOne({
        module: module,
        company: company
    });
    if (!autoIncrement)
        autoIncrement = await new this({
            module: module,
            moduleName: moduleName,
            company: company,
            locationCounters: []
        }).save();
    //incr.idx++;
    //incr.save();
    if (location) {
        const locationCounter = autoIncrement.locationCounters.find(ele => ele.location == location);
        if (!locationCounter) {
            autoIncrement.locationCounters.push({location, counter: 1});
            autoIncrement.save();
        }
    }

    return location
        ? autoIncrement.locationCounters.find(ele => ele.location == location)?.counter
        : autoIncrement.autoIncrementValue;
};

AutoIncrementSchema.statics.setNextId = async function (moduleName, module, company, location = null, callback) {
    let autoIncrement = await this.findOne({
        module: module,
        company: company
    });
    if (!autoIncrement) {
        autoIncrement = await new this({
            module: module,
            moduleName: moduleName,
            company: company,
            locationCounters: []
        }).save();
    }
    if (location) {
        for (const ele of autoIncrement.locationCounters) {
            if (ele.location == location) {
                ele.counter++;
            }
        }
    } else {
        autoIncrement.autoIncrementValue++;
    }
    await autoIncrement.save();
    return location
        ? autoIncrement.locationCounters.find(ele => ele.location == location)?.counter
        : autoIncrement.autoIncrementValue;
};

AutoIncrementSchema.statics.resetNextId = async function (value, moduleName, company, callback) {
    let autoIncrement = await this.findOne({
        module: moduleName,
        company: company
    });

    if (!autoIncrement)
        autoIncrement = await new this({
            module: moduleName,
            company: company
        }).save();
    autoIncrement.autoIncrementValue = value;
    autoIncrement.save();
    return autoIncrement.autoIncrementValue;
};
AutoIncrementSchema.plugin(paginatePlugin);
AutoIncrementSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
const AutoIncrement = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, AutoIncrementSchema);
module.exports = AutoIncrement;
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
    await auditModule(auditTrail);
};

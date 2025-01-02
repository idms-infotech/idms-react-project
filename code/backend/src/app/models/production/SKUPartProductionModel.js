const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {SKU_PART_PRODUCTION: SCHEMA_CONST} = require("../../mocks/schemasConstant/productionConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const SKUPartProductionSchema = new mongoose.Schema(
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
        SKUPartCode: {
            type: String,
            required: false
        },
        processName: {
            type: String,
            required: false
        },
        processCode: {
            type: String,
            required: false
        },
        process: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProcessNameMaster"
        },
        machineName: {
            type: String,
            required: false
        },
        machineCode: {
            type: String,
            required: false
        },
        machine: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Asset"
        },
        productionDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        productionShift: {
            type: String,
            required: false
        },
        operatingStaff: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: ["Awaiting Approval", "Approved", "Cancelled"],
            default: "Awaiting Approval"
        },
        SKUPartProductionDetails: [
            {
                SKU: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "SKUMaster"
                },
                SKUCode: {
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
                orderRef: {
                    type: String,
                    required: false
                },
                jobCard: {
                    type: String,
                    required: false
                },
                batchNumber: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                batchQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                outputQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                rejectedQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                }
            }
        ],
        remarks: {
            type: String,
            required: false
        },
        cancelRemarks: {
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

SKUPartProductionSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.SKUPartCode = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
SKUPartProductionSchema.index({status: -1});
SKUPartProductionSchema.index({productionDate: -1});
SKUPartProductionSchema.plugin(paginatePlugin);
const SKUPartProduction = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, SKUPartProductionSchema);

module.exports = SKUPartProduction;
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

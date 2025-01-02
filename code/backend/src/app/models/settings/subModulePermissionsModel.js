const mongoose = require("mongoose");
const {SUB_MODULE_PERMISSIONS: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");
const subModulePermissionsSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Company"
        },
        roleName: {
            type: String,
            required: false
        },
        role: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Role"
        },
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "menuItems"
        },
        module: {
            type: String,
            required: false
        },
        masters: [
            {
                subModuleId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "SubModuleManagement"
                },
                subModuleName: {
                    type: String,
                    required: false
                },
                createAction: {
                    type: Boolean,
                    required: false,
                    default: true
                },
                viewAction: {
                    type: Boolean,
                    required: false,
                    default: true
                },
                editAction: {
                    type: Boolean,
                    required: false,
                    default: true
                },
                downloadAction: {
                    type: Boolean,
                    required: false,
                    default: true
                },
                approveAction: {
                    type: Boolean,
                    required: false,
                    default: true
                }
            }
        ],
        transactions: [
            {
                subModuleId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "SubModuleManagement"
                },
                subModuleName: {
                    type: String,
                    required: false
                },
                createAction: {
                    type: Boolean,
                    required: false,
                    default: true
                },
                viewAction: {
                    type: Boolean,
                    required: false,
                    default: true
                },
                editAction: {
                    type: Boolean,
                    required: false,
                    default: true
                },
                deleteAction: {
                    type: Boolean,
                    required: false,
                    default: true
                },
                approveAction: {
                    type: Boolean,
                    required: false,
                    default: true
                },
                downloadAction: {
                    type: Boolean,
                    required: false,
                    default: true
                },
                generateReportAction: {
                    type: Boolean,
                    required: false,
                    default: true
                },
                rejectAction: {
                    type: Boolean,
                    required: false,
                    default: true
                },
                cancelledAction: {
                    type: Boolean,
                    required: false,
                    default: true
                }
            }
        ],
        reports: [
            {
                subModuleId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "SubModuleManagement"
                },
                subModuleName: {
                    type: String,
                    required: false
                },
                viewAction: {
                    type: Boolean,
                    required: false,
                    default: true
                },
                downloadAction: {
                    type: Boolean,
                    required: false,
                    default: true
                },
                printAction: {
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
const SubModulePermissions = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, subModulePermissionsSchema);

module.exports = SubModulePermissions;

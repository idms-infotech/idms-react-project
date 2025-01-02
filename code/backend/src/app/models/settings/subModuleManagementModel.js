const mongoose = require("mongoose");
const {SUB_MODULE_MANAGEMENT: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const itemSchema = new mongoose.Schema({
    menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "menuItems"
    },
    module: {
        type: String,
        required: false
    },
    type: {
        type: String,
        required: false
    },
    order: {
        type: Number,
        required: false
    },
    isDisplay: {
        type: Boolean,
        required: false,
        default: true
    },
    title: {
        type: String,
        required: false
    },
    displayName: {
        type: String,
        required: false
    },
    disabled: {
        type: Boolean,
        required: false,
        default: false
    },
    url: {
        type: String,
        required: false
    },
    roles: [
        {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Role"
        }
    ],
    items: [this]
});
const subModuleManagementSchema = new mongoose.Schema(
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
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "menuItems"
        },
        module: {
            type: String,
            required: false
        },
        roles: [
            {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "Role"
            }
        ],
        type: {
            type: String,
            required: false
        },
        order: {
            type: Number,
            required: false
        },
        isDisplay: {
            type: Boolean,
            required: false,
            default: true
        },
        title: {
            type: String,
            required: false
        },
        displayName: {
            type: String,
            required: false
        },
        disabled: {
            type: Boolean,
            required: false,
            default: false
        },
        url: {
            type: String,
            required: false
        },
        items: [
            {
                menuItemId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "menuItems"
                },
                module: {
                    type: String,
                    required: false
                },
                type: {
                    type: String,
                    required: false
                },
                order: {
                    type: Number,
                    required: false
                },
                isDisplay: {
                    type: Boolean,
                    required: false,
                    default: true
                },
                title: {
                    type: String,
                    required: false
                },
                displayName: {
                    type: String,
                    required: false
                },
                disabled: {
                    type: Boolean,
                    required: false,
                    default: false
                },
                url: {
                    type: String,
                    required: false
                },
                items: [itemSchema],
                roles: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        required: false,
                        ref: "Role"
                    }
                ]
            }
        ],
        featureConfig: [
            {
                featureCode: {
                    type: String,
                    required: false
                },
                featureDesc: {
                    type: String,
                    required: false
                },
                status: {
                    type: Boolean,
                    required: false,
                    default: false
                },
                type: {
                    type: String,
                    required: false,
                    enum: ["checkbox", "text", "select"]
                },
                options: [
                    {
                        label: {
                            type: String,
                            required: false
                        },
                        value: {
                            type: String,
                            required: false
                        }
                    }
                ],
                value: {
                    type: String,
                    required: false,
                    trim: true
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
subModuleManagementSchema.plugin(paginatePlugin);
const SubModuleManagement = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, subModuleManagementSchema);
module.exports = SubModuleManagement;

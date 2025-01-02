const mongoose = require("mongoose");
const jwtHandler = require("../../utilities/jwtHandler");
const bcryptHandler = require("../../utilities/bcryptHandler");
const {USER: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const userSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Company"
        },
        userCode: {
            type: String,
            required: false
        },
        name: {
            type: String,
            required: true
        },
        role: [
            {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "Role"
            }
        ],
        email: {
            type: String,
            required: true
        },
        userEmail: {
            type: String,
            required: false
        },
        password: {
            type: String,
            required: true
        },
        isActive: {
            type: Boolean,
            required: false,
            default: true
        },
        userId: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            }
        },
        userIP: {
            type: String,
            required: false
        },
        userDevice: {
            type: String,
            required: false
        },
        lastLoggedIn: {
            type: Date,
            required: false,
            default: new Date()
        },
        isLoggedIn: {
            type: String,
            required: false,
            enum: ["Yes", "No"],
            default: "No"
        },
        RESET_PIN: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        userType: {
            type: String,
            required: false,
            default: "Internal"
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            required: false
        },
        departmentName: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            default: "Created"
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
userSchema.plugin(paginatePlugin);
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcryptHandler.verifyPassword(enteredPassword, this.password);
};
userSchema.methods.genToken = function () {
    return jwtHandler.generateToken({sub: this._id, company: this.company?._id});
};
userSchema.pre("save", async function (next) {
    if (this.isNew) {
        this.userCode = await getAndSetAutoIncrementNo(SCHEMA_CONST.AUTO_INCREMENT_DATA(), this.company, true);
    }
    if (this.isModified("password")) {
        this.password = bcryptHandler.hashPassword(this.password);
    }
    next();
});

const User = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, userSchema);

module.exports = User;

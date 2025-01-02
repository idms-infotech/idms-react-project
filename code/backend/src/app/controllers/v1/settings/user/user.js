const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/settings/userModel");
const Employee = require("../../../../models/HR/employeeModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {outputData} = require("../../../../helpers/utility");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {getMatchData} = require("../../../../helpers/global.options");
const {checkSuperAdmin} = require("../../../../middleware/utils");
const {CONSTANTS} = require("../../../../../config/config");
const {formatDate, dateToAnyFormat} = require("../../../../helpers/dateTime");
const {getAllUserAttributes, getAllUserReportsAttributes} = require("../../../../models/settings/helpers/userHelper");
const {default: mongoose} = require("mongoose");
const {getUserMailConfig} = require("./userMail");
const {LAKH} = require("../../../../mocks/number.constant");
const bcryptHandler = require("../../../../utilities/bcryptHandler");
const {USER} = require("../../../../mocks/schemasConstant/settingsConstant");
const {getAndSetAutoIncrementNo} = require("../autoIncrement/autoIncrement");
const {filteredDepartmentList} = require("../../../../models/settings/repository/departmentRepository");
const ObjectId = mongoose.Types.ObjectId;
const MailTriggerRepository = require("../../../../models/settings/repository/mailTriggerRepository");
const {SETTINGS_MAIL_CONST} = require("../../../../mocks/mailTriggerConstants");
const UserRepository = require("../../../../models/settings/repository/userRepository");
const {SUPER_ADMIN_ID} = require("../../../../mocks/constantData");
const {filteredRoleList} = require("../../../../models/settings/repository/roleRepository");
// @route   POST /api/user/getAll
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let superAdminId = SUPER_ADMIN_ID;
        let project = getAllUserAttributes();
        let superAdminAccess = await checkSuperAdmin(req.user.sub);
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ...(!superAdminAccess && {role: {$elemMatch: {$ne: ObjectId(superAdminId)}}})
                }
            },
            {
                $lookup: {
                    from: "Role",
                    localField: "role",
                    foreignField: "_id",
                    pipeline: [{$project: {roleCode: 1, roleName: 1}}],
                    as: "role"
                }
            }
        ];
        let rows = await UserRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
// @route   POST /api/user/register
exports.create = asyncHandler(async (req, res) => {
    try {
        let existingUser = await UserRepository.findOneDoc({
            email: req.body.email.toLowerCase()
        });
        if (existingUser) {
            let errors = MESSAGES.apiErrorStrings.USER_EXISTS("Email");
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        createdObj.password = await bcryptHandler.hashPassword(req.body.password);
        const createUser = await UserRepository.createDoc(createdObj);
        if (createUser) {
            res.success({
                message: MESSAGES.apiSuccessStrings.SIGNUP_SUCCESS
            });
            // let mailCreateObj = {
            //     userId: createUser.id,
            //     action: "created",
            //     company: req.user.company,
            //     mailAction: "Create"
            // };
            // getUserMailConfig(mailCreateObj);
            let mailTriggerCreateObj = {
                subModuleId: createUser._id,
                action: "created",
                company: req.user.company,
                mailAction: "Create",
                collectionName: USER.COLLECTION_NAME,
                message: "User creation request Email",
                module: SETTINGS_MAIL_CONST.USER.MODULE,
                subModule: SETTINGS_MAIL_CONST.USER.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
// @route   POST /api/user/
exports.login = asyncHandler(async (req, res) => {
    try {
        let existingUser = await Model.findOne({
            email: req.body.email,
            isActive: true
        })
            .populate(
                "company",
                "_id companyName isCompanyActive companyNickName companyAddress accountsDetails.currencySymbol"
            )
            .populate("role", "roleName displayRoleName");

        if (existingUser && (await existingUser.matchPassword(req.body.password))) {
            const employee = await Employee.findOne({
                userId: existingUser?._id
            });
            let deviceName = req.device.type.toUpperCase();
            const userIPUpdate = await updateUserOnLogin(
                existingUser._id,
                deviceName,
                req.body.ip,
                existingUser?.company?.companyName
            );
            const userLoggedInEmailFlag = await findAppParameterValue(
                "USER_LOGGED_IN_EMAIL_FLAG",
                existingUser.company._id
            );
            if (userLoggedInEmailFlag === "Y") {
                let mailLoginObj = {
                    userId: userIPUpdate,
                    action: "login",
                    company: existingUser.company._id,
                    mailAction: "Login"
                };
                getUserMailConfig(mailLoginObj);
            }
            existingUser.userIP = req?.body?.ip;
            existingUser.userDevice = req?.device?.type.toUpperCase();
            existingUser.lastLoggedIn = Date.now();
            existingUser.isLoggedIn = "Yes";
            await existingUser.save();
            return res.success({
                _id: existingUser._id,
                token: existingUser.genToken(),
                email: existingUser.email,
                name: existingUser.name,
                departmentName: existingUser.departmentName,
                roles: existingUser.role.map(x => x._id),
                roleName: existingUser.role.map(x => x.roleName),
                employee: employee?._id,
                empJoiningLocation: employee?.empJoiningLocation,
                image: existingUser?.image,
                // menuItems: menuItems,
                //isAdmin: existingUser?.isAdmin,
                //isSuperAdmin: existingUser?.isSuperAdmin,
                companyId: existingUser?.company?._id,
                companyName: existingUser?.company?.companyName,
                companyNickName: existingUser?.company?.companyNickName,
                companyAddress: existingUser?.company?.companyAddress,
                currencySymbol: existingUser?.company?.accountsDetails?.currencySymbol ?? "INR"
            });
        } else {
            let errors = MESSAGES.apiErrorStrings.INVALID_CREDENTIALS;
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
// @route   POST /api/user/
exports.getProfile = asyncHandler(async (req, res) => {
    try {
        let user = await Model.findOne({
            _id: req.params.id
        })
            .select("-password")
            .populate("role", "role")
            .exec();
        if (user) {
            user["token"] = user.genToken();
            let existingUser = user.toJSON();
            return res.success(existingUser);
        } else {
            const error = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(error);
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
// @route   POST /api/user/
exports.update = async (req, res) => {
    try {
        if (req.body.password) {
            req.body.password = await bcryptHandler.hashPassword(req.body.password);
        } else {
            delete req.body.password;
        }
        let itemDetails = await UserRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        let mailCondition = true;
        if ((itemDetails.isActive && req.body.isActive) || !req.body.isActive) {
            mailCondition = false;
        }
        let user = await UserRepository.findByIdAndUpdateDoc(req.params.id, req.body, {
            upsert: true,
            new: true,
            rawResult: true
        });
        res.success({
            message: `User profile has been ${user.status ? user.status.toLowerCase() : "updated"} successfully`
        });
        // let mailUpdateObj = {
        //     userId: user._id,
        //     action: user.status,
        //     company: req.user.company,
        //     mailAction: "Approved"
        // };
        if (mailCondition) {
            // getUserMailConfig(mailUpdateObj);
            let mailTriggerCreateObj = {
                subModuleId: itemDetails._id,
                action: user.status,
                company: req.user.company,
                mailAction: "Approved",
                collectionName: USER.COLLECTION_NAME,
                message: "User Creation Request Approved",
                module: SETTINGS_MAIL_CONST.USER.MODULE,
                subModule: SETTINGS_MAIL_CONST.USER.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
};
// @route   POST /api/user/
exports.forgetPassword = asyncHandler(async (req, res) => {
    try {
        if (!req.body.email) {
            let error = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(error);
        }

        let query = {
            email: req.body.email
        };
        let existingUser = await UserRepository.findOneDoc(query);
        if (!existingUser) {
            const error = MESSAGES.apiErrorStrings.USER_DOES_NOT_EXIST;
            return res.preconditionFailed(error);
        } else {
            existingUser.RESET_PIN = Math.floor(Math.random() * 899999 + LAKH);
            let user = await existingUser.save();
            let data = {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                url: `${CONSTANTS.reqURL}#/auth/change-pwd?sub=${user._id}&pin=${user.RESET_PIN}`
            };
            let message = MESSAGES.apiSuccessStrings.EMAIL_FORGOT;
            mail.sendForgetMail(req, data);
            // await EmailRepository.sendForgotPassword(existingUser);
            return res.success({message: message});
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
// @route   POST /api/user/
exports.resetPassword = async (req, res) => {
    try {
        let query = {
            _id: req.body.id
        };
        let user = await Model.findOne(query);
        if (!user) {
            let error = MESSAGES.apiErrorStrings.USER_DOES_NOT_EXIST;
            return res.preconditionFailed(error);
        } else {
            let isMatch = await bcryptHandler.verifyPassword(req.body.OLD_PASSWORD, user.password);
            if (isMatch) {
                user.password = await bcryptHandler.hashPassword(req.body.NEW_PASSWORD);
                user.LAST_UPDATED_DATE = Date.now();
                let users = await user.save();
                /** send email to user*/
                // await EmailRepository.sendResetPassword(user);
                /** send sms to user*/
                // await SMSRepository.sendOTPMessage(user);

                const message = MESSAGES.apiSuccessStrings.password("reset");
                return res.success({message: message});
            } else {
                let errors = MESSAGES.apiErrorStrings.INVALID_CREDENTIALS;
                return res.preconditionFailed(errors);
            }
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);

        console.error(e);
    }
};
// @route   POST /api/user/
exports.setPassword = async (req, res) => {
    try {
        let query = {
            _id: req.body._id
        };
        let user = await Model.findOne(query);
        if (!user) {
            let error = MESSAGES.apiErrorStrings.USER_DOES_NOT_EXIST;
            return res.preconditionFailed(error);
        } else {
            if (user.RESET_PIN === req.body.RESET_PIN) {
                user.password = await bcryptHandler.hashPassword(req.body.NEW_PASSWORD);
                user.LAST_UPDATED_DATE = Date.now();
                user.IS_VERIFY = true;
                user.RESET_PIN = null;
                let users = await user.save();
                const message = MESSAGES.apiSuccessStrings.password("set");
                return res.success({message: message});
            } else {
                let errors = MESSAGES.apiErrorStrings.INVALID_TOKEN;
                return res.preconditionFailed(errors);
            }
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);

        console.error(e);
    }
};
// @route   POST /api/user/
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await UserRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("The User")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("The User");
            res.preconditionFailed(errors);
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
// @route   POST /api/user/
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findOne({
            _id: req.params.id
        })
            .select("-password")
            .populate("role", "roleName")
            .exec();
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("User");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let isSuperAdmin = await checkSuperAdmin(req.user.sub);
        const departmentOptions = await filteredDepartmentList([
            {$match: {company: ObjectId(req.user.company)}},
            {
                $project: {
                    _id: 1,
                    departmentName: 1
                }
            }
        ]);
        const autoIncrementNo = await getAndSetAutoIncrementNo(USER.AUTO_INCREMENT_DATA(), req.user.company);
        const rolesOptions = await filteredRoleList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ...(!isSuperAdmin && {_id: {$nin: [ObjectId(SUPER_ADMIN_ID)]}})
                }
            },
            {
                $project: {
                    _id: 0,
                    label: "$displayRoleName",
                    value: "$_id"
                }
            }
        ]);
        return res.success({
            departmentOptions,
            autoIncrementNo,
            rolesOptions
        });
    } catch (error) {
        console.error("getAllMasterDataForUser", error);
        res.status(400);
        throw new Error("Invalid Model data");
    }
});
exports.getAllUsers = async company => {
    let rows = await Model.find({
        company: company,
        isActive: true
    }).sort({createdAt: -1});
    return rows;
};
const updateUserOnLogin = async (userId, deviceName, ip, companyName) => {
    try {
        let update = {
            userIP: ip,
            userDevice: deviceName,
            lastLoggedIn: new Date()
        };
        let user = await Model.findByIdAndUpdate(userId, update);
        if (user) {
            return {
                companyName: companyName,
                userCode: user.userCode,
                email: user.email,
                name: user.name,
                lastLoggedIn: formatDate(user.lastLoggedIn),
                lastLoggedInTime: dateToAnyFormat(user.lastLoggedIn, "hh:mm A"),
                env: CONSTANTS.nodeEnv,
                userIP: user.userIP
            };
        }
    } catch (error) {
        console.error("Error in updating User IP address ", error);
    }
};
exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "lastLoggedIn",
            direction = -1
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let project = getAllUserReportsAttributes();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let isSuperAdmin = await checkSuperAdmin(req.user.sub);
        let rows = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ...(!isSuperAdmin && {role: {$nin: [ObjectId(SUPER_ADMIN_ID)]}})
                }
            },
            {
                $lookup: {
                    from: "Role",
                    localField: "role",
                    foreignField: "_id",
                    pipeline: [{$project: {displayRoleName: 1, _id: 0}}],
                    as: "role"
                }
            },
            {$unwind: "$role"},
            {$sort: {[column]: +direction}},
            {$project: project},
            {$match: match},
            {
                $facet: {
                    metadata: [{$count: "total"}],
                    data: pagination
                }
            }
        ]);
        return res.success({
            ...outputData(rows)
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllUserCounts = async (company, isSuperAdmin) => {
    try {
        let result = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company),
                    isActive: true,
                    ...(!isSuperAdmin && {role: {$nin: [ObjectId(SUPER_ADMIN_ID)]}})
                }
            },

            {
                $group: {
                    _id: null,
                    count: {$sum: 1},
                    loggedInCount: {$sum: {$cond: [{$eq: ["$isLoggedIn", "Yes"]}, 1, 0]}}
                }
            },
            {
                $project: {
                    count: 1,
                    loggedInCount: "$loggedInCount"
                }
            }
        ]);
        result = {
            count: result[0]?.count || 0,
            loggedInCount: result[0]?.loggedInCount || 0
        };
        return result;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};
exports.getAllAdminUserCount = async company => {
    try {
        const result = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company),
                    isActive: true
                }
            },
            {
                $unwind: "$role"
            },
            {
                $lookup: {
                    from: "Role",
                    localField: "role",
                    foreignField: "_id",
                    pipeline: [{$project: {roleName: 1}}],
                    as: "role"
                }
            },
            {
                $unwind: "$role"
            },
            {
                $group: {
                    _id: null,
                    adminCount: {$sum: {$cond: [{$eq: ["$role.roleName", "Admin"]}, 1, 0]}}
                }
            },
            {
                $project: {
                    totalCounts: "$adminCount"
                }
            }
        ]);
        return result[0]?.totalCounts || 0;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};

exports.getAllRoleByUserId = async (company, userId) => {
    try {
        let rows = await Model.findOne(
            {
                _id: userId,
                company: company,
                isActive: true
            },
            {
                role: 1
            }
        ).lean();
        return rows;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};

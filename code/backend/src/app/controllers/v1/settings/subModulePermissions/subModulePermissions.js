const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/settings/subModulePermissionsModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const MenuItem = require("../menuItem/menuItem");
const SubModuleMgmt = require("../subModuleManagement/subModuleManagement");
const ObjectId = mongoose.Types.ObjectId;
const menuItemJson = require("../../../../mocks/menuItem.json");
const roleJson = require("../../../../mocks/roles.json");
const {SUPER_ADMIN_ID} = require("../../../../mocks/constantData");
const {filteredRoleList} = require("../../../../models/settings/repository/roleRepository");
const User = require("../user/user");

exports.create = asyncHandler(async (req, res) => {
    try {
        // let existing = await Model.findOne({
        //     roleName: req.body.roleName,
        // });
        // if (existing) {
        //     let errors = MESSAGES.apiErrorStrings.Data_EXISTS("Role");
        //     return res.preconditionFailed(errors);
        // }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const saveObj = new Model(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Sub Module Permissions")
            });
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
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;

        itemDetails = await generateCreateData(itemDetails, req.body);

        itemDetails = await itemDetails.save();
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.UPDATE("Sub Module Permissions has been")
            });
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getAllSubModulePermissions = async userRoles => {
    let superAdminExists = userRoles?.role?.some(x => String(x) == SUPER_ADMIN_ID);
    let rows = await Model.aggregate([
        {
            $match: {
                role: {$in: userRoles?.role?.map(x => ObjectId(x))}
            }
        },
        {
            $project: {
                roleName: 1,
                menuItemId: 1,
                module: 1,
                masters: 1,
                transactions: 1,
                reports: 1
            }
        },
        {
            $group: {
                _id: "$menuItemId",
                permissionData: {
                    $push: {
                        menuItemId: "$menuItemId",
                        module: "$module",
                        masters: "$masters",
                        transactions: "$transactions",
                        reports: "$reports"
                    }
                }
            }
        }
    ]);
    for (let i = 0; i < rows.length; i++) {
        const element = rows[i];
        for (const ele of element.permissionData) {
            for (let j = 0; j < ele.masters.length; j++) {
                if (superAdminExists) {
                    element.permissionData[0].masters[j].createAction = true;
                    element.permissionData[0].masters[j].viewAction = true;
                    element.permissionData[0].masters[j].editAction = true;
                    element.permissionData[0].masters[j].downloadAction = true;
                } else {
                    if (ele.masters[j].createAction == true) {
                        element.permissionData[0].masters[j].createAction = true;
                    }
                    if (ele.masters[j].viewAction == true) {
                        element.permissionData[0].masters[j].viewAction = true;
                    }
                    if (ele.masters[j].editAction == true) {
                        element.permissionData[0].masters[j].editAction = true;
                    }
                    if (ele.masters[j].downloadAction == true) {
                        element.permissionData[0].masters[j].downloadAction = true;
                    }
                }
            }
            for (let j = 0; j < ele.reports.length; j++) {
                if (superAdminExists) {
                    element.permissionData[0].reports[j].viewAction = true;
                    element.permissionData[0].reports[j].downloadAction = true;
                    element.permissionData[0].reports[j].printAction = true;
                } else {
                    if (ele.reports[j].viewAction == true) {
                        element.permissionData[0].reports[j].viewAction = true;
                    }
                    if (ele.reports[j].downloadAction == true) {
                        element.permissionData[0].reports[j].downloadAction = true;
                    }
                    if (ele.reports[j].printAction == true) {
                        element.permissionData[0].reports[j].printAction = true;
                    }
                }
            }
            for (let j = 0; j < ele.transactions.length; j++) {
                if (superAdminExists) {
                    element.permissionData[0].transactions[j].createAction = true;
                    element.permissionData[0].transactions[j].viewAction = true;
                    element.permissionData[0].transactions[j].editAction = true;
                    element.permissionData[0].transactions[j].deleteAction = true;
                    element.permissionData[0].transactions[j].approveAction = true;
                    element.permissionData[0].transactions[j].downloadAction = true;
                    element.permissionData[0].transactions[j].generateReportAction = true;
                    element.permissionData[0].transactions[j].rejectAction = true;
                    element.permissionData[0].transactions[j].cancelledAction = true;
                } else {
                    if (ele.transactions[j].createAction == true) {
                        element.permissionData[0].transactions[j].createAction = true;
                    }
                    if (ele.transactions[j].viewAction == true) {
                        element.permissionData[0].transactions[j].viewAction = true;
                    }
                    if (ele.transactions[j].editAction == true) {
                        element.permissionData[0].transactions[j].editAction = true;
                    }
                    if (ele.transactions[j].deleteAction == true) {
                        element.permissionData[0].transactions[j].deleteAction = true;
                    }
                    if (ele.transactions[j].approveAction == true) {
                        element.permissionData[0].transactions[j].approveAction = true;
                    }
                    if (ele.transactions[j].downloadAction == true) {
                        element.permissionData[0].transactions[j].downloadAction = true;
                    }
                    if (ele.transactions[j].generateReportAction == true) {
                        element.permissionData[0].transactions[j].generateReportAction = true;
                    }
                    if (ele.transactions[j].rejectAction == true) {
                        element.permissionData[0].transactions[j].rejectAction = true;
                    }
                    if (ele.transactions[j].cancelledAction == true) {
                        element.permissionData[0].transactions[j].cancelledAction = true;
                    }
                }
            }
        }
    }
    rows = rows.map(x => x.permissionData[0]);
    return rows;
};
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let user = await User.getAllRoleByUserId(req.user.company, req.user.sub);
        let superAdminExist = user.role.some(x => String(x) == SUPER_ADMIN_ID);
        const roleList = await filteredRoleList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ...(!superAdminExist && {_id: {$nin: [ObjectId(SUPER_ADMIN_ID)]}})
                }
            },
            {
                $project: {
                    roleCode: 1,
                    roleName: 1,
                    displayRoleName: 1,
                    redirectTo: 1,
                    permissions: 1
                }
            }
        ]);
        const menuItemList = await MenuItem.getAllMenuItemsList(req.user.company, "main", {title: 1, menuOrder: 1});
        res.success({roleList, menuItemList});
    } catch (error) {
        console.error(error);
        res.status(400);
        throw new Error("Invalid Model data");
    }
});

exports.getAllFilterData = asyncHandler(async (req, res) => {
    try {
        let subModuleList = await Model.findOne({menuItemId: req.query.menuItemId, role: req.query.role});
        let createdObj = {
            roleName: req.query.roleName,
            role: req.query.role,
            menuItemId: req.query.menuItemId,
            module: req.query.module,
            masters: [],
            transactions: [],
            reports: []
        };
        if (!subModuleList) {
            let {rows, roleExists} = await SubModuleMgmt.getAllSubModuleForPermissions(req.query);
            subModuleList = rows;
            for (const ele of subModuleList) {
                if (ele._id == "MASTER") {
                    // for (let i = 0; i < ele.data.length; i++) {
                    //     const element = ele.data[i];
                    //     // console.log("element", element);
                    //     if (element.items && element.items != "undefined" && element.items.length > 0) {
                    //         for (let j = 0; j < element.items.length; j++) {
                    //             const childElement = element.items[j];
                    //             console.log("childElement", childElement);
                    //             ele.data.push({
                    //                 subModuleId: element.subModuleId,
                    //                 subModuleName: childElement.title,
                    //                 createAction: roleExists,
                    //                 viewAction: roleExists,
                    //                 editAction: roleExists,
                    //                 downloadAction: roleExists,
                    //             });
                    //         }
                    //     }
                    // }
                    createdObj.masters = ele.data;
                }
                if (ele._id == "TRANSACTION") {
                    // for (let i = 0; i < ele.data.length; i++) {
                    //     const element = ele.data[i];
                    //     if (element.items && element.items != "undefined" && element.items.length > 0) {
                    //         for (let j = 0; j < element.items.length; j++) {
                    //             const childElement = element.items[j];
                    //             ele.data.push({
                    //                 subModuleId: element.subModuleId,
                    //                 subModuleName: childElement.title,
                    //                 createAction: roleExists,
                    //                 viewAction: roleExists,
                    //                 editAction: roleExists,
                    //                 deleteAction: roleExists,
                    //                 approveAction: roleExists,
                    //                 downloadAction: roleExists,
                    //                 generateReportAction: roleExists,
                    //                 rejectAction: roleExists,
                    //                 cancelledAction: roleExists,
                    //             });
                    //         }
                    //     }
                    // }
                    createdObj.transactions = ele.data;
                }
                if (ele._id == "REPORT") {
                    // for (let i = 0; i < ele.data.length; i++) {
                    //     const element = ele.data[i];
                    //     if (element.items && element.items != "undefined" && element.items.length > 0) {
                    //         for (let j = 0; j < element.items.length; j++) {
                    //             const childElement = element.items[j];
                    //             ele.data.push({
                    //                 subModuleId: element.subModuleId,
                    //                 subModuleName: childElement.title,
                    //                 viewAction: roleExists,
                    //                 downloadAction: roleExists,
                    //                 printAction: roleExists,
                    //             });
                    //         }
                    //     }
                    // }
                    createdObj.reports = ele.data;
                }
            }
            saveObj = new Model(createdObj);
            subModuleList = await saveObj.save();
        } else {
            // check new entry exists
        }
        return res.success(subModuleList);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});

exports.permissionForSuperAdmin = async companyId => {
    try {
        let role = roleJson.find(x => x._id == String(SUPER_ADMIN_ID));

        for (const ele of menuItemJson) {
            if (ele._id == "64a6c1e33339d4dc9d8141b0") {
                continue;
            }
            let subModulePermission = await Model.findOne({
                menuItemId: ele._id,
                role: ObjectId(role._id)
            });
            let createdObj = {
                roleName: role.roleName,
                role: role._id,
                menuItemId: ele._id,
                module: ele.title,
                masters: [],
                transactions: [],
                reports: []
            };
            let data = await SubModuleMgmt.getAllSubModuleForPermissions({
                menuItemId: ele._id,
                role: ObjectId(role._id)
            });
            subModuleList = data?.rows;
            for (const sub of subModuleList) {
                if (sub._id == "MASTER") {
                    createdObj.masters = sub.data;
                }
                if (sub._id == "TRANSACTION") {
                    createdObj.transactions = sub.data;
                }
                if (sub._id == "REPORT") {
                    createdObj.reports = sub.data;
                }
            }
            if (!subModulePermission) {
                // let data = await SubModuleMgmt.getAllSubModuleForPermissions({
                //     menuItemId: ele._id,
                //     role: ObjectId(role._id),
                // });
                // subModuleList = data?.rows;
                // for (const ele of subModuleList) {
                //     if (ele._id == "MASTER") {
                //         createdObj.masters = ele.data;
                //     }
                //     if (ele._id == "TRANSACTION") {
                //         createdObj.transactions = ele.data;
                //     }
                //     if (ele._id == "REPORT") {
                //         createdObj.reports = ele.data;
                //     }
                // }
                saveObj = new Model(createdObj);
                subModuleList = await saveObj.save();
            } else {
                await Model.findOneAndUpdate(
                    {
                        menuItemId: ele._id,
                        role: ObjectId(role._id)
                    },
                    {
                        $set: {
                            masters: createdObj.masters,
                            transactions: createdObj.transactions,
                            reports: createdObj.reports,
                            module: createdObj.module
                        }
                    }
                );
            }
        }
    } catch (e) {
        console.error(e);
    }
};

exports.updatePermissionsOnSubModuleManagementCreate = asyncHandler(async subModuleJSON => {
    let obj = {};
    if (subModuleJSON.type == "MASTER") {
        obj = {
            masters: {
                subModuleId: subModuleJSON._id,
                subModuleName: subModuleJSON.title,
                createAction: false,
                viewAction: false,
                editAction: false,
                downloadAction: false
            }
        };
    } else if (subModuleJSON.type == "TRANSACTION") {
        obj = {
            transactions: {
                subModuleId: subModuleJSON._id,
                subModuleName: subModuleJSON.title,
                createAction: false,
                viewAction: false,
                editAction: false,
                deleteAction: false,
                approveAction: false,
                downloadAction: false,
                generateReportAction: false,
                rejectAction: false,
                cancelledAction: false
            }
        };
    } else if (subModuleJSON.type == "REPORT") {
        obj = {
            reports: {
                subModuleId: subModuleJSON._id,
                subModuleName: subModuleJSON.title,
                viewAction: false,
                downloadAction: false,
                printAction: false
            }
        };
    }
    await Model.updateMany({menuItemId: subModuleJSON.menuItemId}, {$push: obj});
});

const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {default: mongoose} = require("mongoose");
const MenuItem = require("../menuItem/menuItem");
const {getAllSubModuleManagementAttributes} = require("../../../../models/settings/helpers/subModuleManagementHelper");
const ObjectId = mongoose.Types.ObjectId;
const subModuleJson = require("../../../../utilities/module");
const CARD_LAYOUT_JSON = require("../../../../mocks/cardLayout.json");
const SubModuleRepository = require("../../../../models/settings/repository/subModuleRepository");
const {getAllAggregationFooter, outputData} = require("../../../../helpers/utility");
const {getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {SUPER_ADMIN_ID, MODULE_PARENT_ID} = require("../../../../mocks/constantData");
const {filteredRoleList} = require("../../../../models/settings/repository/roleRepository");
const User = require("../user/user");
const CARDS_TO_FILTERED = require("../../../../mocks/subModule/dynamicSubCards.json");
const cardsToFilterMap = new Map(CARDS_TO_FILTERED.map(x => [x._id, true]));

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let user = await User.getAllRoleByUserId(req.user.company, req.user.sub);
        const {search = null, menuID = null, tabType = null, display = true, subItemsFilter = "yes"} = req.query;
        let itemsCondition = 1;
        let superAdminExist = user.role.some(x => String(x) == SUPER_ADMIN_ID);
        const roles = await filteredRoleList([
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
        if (subItemsFilter == "yes" && !superAdminExist) {
            itemsCondition = {
                $cond: [
                    superAdminExist,
                    {
                        $map: {
                            input: "$items",
                            as: "item",
                            in: {
                                $mergeObjects: [
                                    "$$item",
                                    {
                                        disabled: {
                                            $cond: [superAdminExist, false, null]
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    {
                        $filter: {
                            input: "$items",
                            as: "item",
                            cond: {
                                $eq: ["$$item.isDisplay", true]
                            }
                        }
                    }
                ]
            };
        }
        const project = getAllSubModuleManagementAttributes(itemsCondition);
        let match = await getMatchData(project, search);
        let rows = await SubModuleRepository.filteredSubModuleManagementList([
            {
                $match: {
                    ...(display === true &&
                        !superAdminExist && {
                            isDisplay: display
                        }),
                    ...(!!menuID && {
                        menuItemId: ObjectId(menuID)
                    }),
                    ...(!!tabType && {
                        type: tabType
                    })
                }
            },
            {
                $addFields: {
                    commonValues: {$cond: [superAdminExist, [], {$setIntersection: [user.role, "$roles"]}]},
                    disabled: {$cond: [superAdminExist, false, "$disabled"]}
                }
            },
            {
                $match: {
                    commonValues: []
                }
            },
            ...getAllAggregationFooter(project, match, "order", 1, [])
        ]);
        return res.success({
            ...outputData(rows),
            roles
        });
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        for await (const ele of req.body) {
            let itemDetails = await SubModuleRepository.getDocById(ele._id);
            await SubModuleRepository.updateDoc(itemDetails, ele);
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Sub Module has been")
        });
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const subModuleExists = subModuleJson.find(x => x._id == req.params.id);
        if (subModuleExists) {
            return res.preconditionFailed(MESSAGES.apiErrorStrings.CANNOT_DELETE("Sub Module"));
        } else {
            await SubModuleRepository.deleteDoc({_id: req.params.id});
            return res.success({message: MESSAGES.apiSuccessStrings.DELETED("Sub Module")});
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await SubModuleRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Sub Module");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});

exports.getAllSubModuleForPermissions = async data => {
    let menuItemRoles = await MenuItem.getAllMenuItemsRolesForPermissions(data.menuItemId);
    menuItemRoles = JSON.parse(JSON.stringify(menuItemRoles));
    let roleExists = false;
    if (data.role == SUPER_ADMIN_ID) {
        roleExists = true;
    } else {
        roleExists = menuItemRoles.roles.map(x => x.valueOf()).includes(data.role);
    }
    let rows = await SubModuleRepository.filteredSubModuleManagementList([
        {
            $match: {
                menuItemId: ObjectId(data.menuItemId)
            }
        },
        {
            $project: {
                subModuleId: "$_id",
                subModuleName: "$displayName",
                type: 1,
                items: 1
            }
        },
        {
            $group: {
                _id: "$type",
                data: {
                    $push: {
                        $cond: [
                            {$eq: ["$type", "REPORT"]},
                            {
                                items: "$items",
                                subModuleId: "$subModuleId",
                                subModuleName: "$subModuleName",
                                viewAction: roleExists,
                                downloadAction: roleExists,
                                printAction: roleExists
                            },
                            {
                                $cond: [
                                    {$eq: ["$type", "MASTER"]},
                                    {
                                        items: "$items",
                                        subModuleId: "$subModuleId",
                                        subModuleName: "$subModuleName",
                                        createAction: roleExists,
                                        viewAction: roleExists,
                                        editAction: roleExists,
                                        downloadAction: roleExists,
                                        approveAction: roleExists
                                    },
                                    {
                                        items: "$items",
                                        subModuleId: "$subModuleId",
                                        subModuleName: "$subModuleName",
                                        createAction: roleExists,
                                        viewAction: roleExists,
                                        editAction: roleExists,
                                        deleteAction: roleExists,
                                        approveAction: roleExists,
                                        downloadAction: roleExists,
                                        generateReportAction: roleExists,
                                        rejectAction: roleExists,
                                        cancelledAction: roleExists
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        }
    ]);
    return {rows, roleExists};
};

exports.getAllSubModuleList = async menuID => {
    try {
        let rows = await SubModuleRepository.filteredSubModuleManagementList([
            {
                $match: {
                    menuItemId: ObjectId(menuID),
                    isDisplay: true
                }
            },
            {
                $sort: {order: 1}
            },
            {
                $group: {
                    _id: "$type",
                    functionTabs: {$push: {title: "$title", order: "$order"}}
                }
            },
            {
                $project: {
                    _id: 0,
                    systemTabs: "$_id",
                    functionTabs: {
                        $map: {
                            input: {$sortArray: {input: {$ifNull: ["$functionTabs", []]}, sortBy: {order: 1}}},
                            as: "tab",
                            in: "$$tab.title"
                        }
                    }
                }
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllSubModuleList", e);
    }
};

exports.getAllSubModule = async module => {
    try {
        let rows = await SubModuleRepository.filteredSubModuleManagementList([
            {
                $match: {
                    type: "REPORT",
                    module: module
                }
            },
            {
                $project: {
                    title: 1,
                    displayName: 1
                }
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllSubModule", e);
    }
};

exports.getAllFilteredCardsManagement = asyncHandler(async (req, res) => {
    try {
        const {menuID = null, type = null} = req.query;
        let project = {
            order: 1,
            isDisplay: 1,
            title: 1,
            displayName: 1,
            disabled: 1,
            items: 1
        };
        let pipeline = [
            {
                $match: {
                    ...(!!menuID && {
                        menuItemId: ObjectId(menuID)
                    }),
                    ...(!!type && {type: type})
                }
            }
        ];
        let rows = await SubModuleRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllFilteredCardsManagement", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.updateById = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await SubModuleRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        await SubModuleRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Sub Module")
        });
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});

exports.getCountsMenuItemWise = asyncHandler(async (req, res) => {
    try {
        const {menuID = null, type = null} = req.query;
        let groupCounts = await SubModuleRepository.filteredSubModuleManagementList([
            {
                $match: {
                    ...(!!menuID && {
                        menuItemId: ObjectId(menuID)
                    }),
                    ...(!!type && {type: type})
                }
            },
            {
                $group: {
                    _id: {
                        menuItemId: "$menuItemId",
                        type: "$type"
                    },
                    module: {$first: "$module"},
                    uniqueTitle: {$addToSet: "$title"}
                }
            },
            {
                $project: {
                    _id: 0,
                    module: 1,
                    type: "$_id.type",
                    counts: {$size: "$uniqueTitle"}
                }
            }
        ]);
        return res.success(groupCounts);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});

exports.getAllFeaturesMgmt = asyncHandler(async (req, res) => {
    try {
        let project = {
            module: 1,
            type: 1,
            displayName: 1,
            featureConfig: 1,
            status: {
                $cond: [
                    {$gt: [{$size: {$ifNull: ["$featureConfig", []]}}, 0]},
                    OPTIONS.defaultStatus.ACTIVE,
                    OPTIONS.defaultStatus.INACTIVE
                ]
            }
        };
        let pipeline = [];
        let rows = await SubModuleRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllFeaturesMgmt", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllForCards = asyncHandler(async (req, res) => {
    try {
        let user = await User.getAllRoleByUserId(req.user.company, req.user.sub);
        const {menuID = null, tabType = null, display = true, parentId = null} = req.query;
        let superAdminExist = user.role.some(x => String(x) == SUPER_ADMIN_ID);
        const cardsPerRow =
            CARD_LAYOUT_JSON?.find(x => x.menuID == menuID && x.tabType == tabType && x.parentId == parentId)
                ?.cardsPerRow ?? 4;
        let rows = await SubModuleRepository.filteredSubModuleManagementList([
            {
                $match: {
                    ...(display === true &&
                        !superAdminExist && {
                            isDisplay: display
                        }),
                    ...(!!menuID && {
                        menuItemId: ObjectId(menuID)
                    }),
                    ...(!!tabType && {
                        type: tabType
                    })
                }
            },
            {
                $addFields: {
                    commonValues: {$cond: [superAdminExist, [], {$setIntersection: [user.role, "$roles"]}]},
                    disabled: {$cond: [superAdminExist, false, "$disabled"]},
                    items: {
                        $cond: [
                            superAdminExist,
                            {
                                $map: {
                                    input: "$items",
                                    as: "item",
                                    in: {
                                        $mergeObjects: [
                                            "$$item",
                                            {
                                                disabled: {
                                                    $cond: [superAdminExist, false, null]
                                                }
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                $filter: {
                                    input: "$items",
                                    as: "item",
                                    cond: {
                                        $eq: ["$$item.isDisplay", true]
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            {
                $match: {
                    commonValues: []
                }
            },
            {
                $project: {
                    isDisplay: 1,
                    title: 1,
                    displayName: 1,
                    disabled: 1,
                    url: 1,
                    _id: 1,
                    items: 1,
                    order: 1
                }
            }
        ]);
        rows = flattenMenuItems(rows);
        let filterArr = CARDS_TO_FILTERED.filter(x => x._id != String(parentId))?.map(y => y._id);
        rows = rows.filter(z => !filterArr.includes(String(z._id)));
        if (!!parentId) {
            rows = rows?.filter(y => String(y?.parentId) == parentId);
        }
        rows?.sort((a, b) => a?.order - b?.order);
        return res.success({
            rows,
            cardsPerRow
        });
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
// exports.getAllForCards1 = asyncHandler(async (req, res) => {
//     try {
//         let user = await User.getAllRoleByUserId(req.user.company, req.user.sub);
//         const {menuID = null, tabType = null, display = true, parentId = null} = req.query;
//         user.role = user?.role?.map(x => x.valueOf());
//         let superAdminExist = user.role.some(x => String(x) == SUPER_ADMIN_ID);
//         const cardsPerRow =
//             CARD_LAYOUT_JSON?.find(x => x.menuID == menuID && x.tabType == tabType && x.parentId == parentId)
//                 ?.cardsPerRow ?? 4;
//         const cacheKey = `${menuID}__${tabType}__${parentId}`;
//         let cachedData = memoryCacheHandler.get(cacheKey);
//         console.log(user?.role, "cachedData", cachedData);
//         let rows = [];
//         if (cachedData) {
//             rows = cachedData;
//         } else {
//         }

//         return res.success({
//             rows: rows?.filter(z => z?.roles?.filter(y => user?.role.includes(y.valueOf()))?.length == 0),
//             cardsPerRow
//         });
//     } catch (e) {
//         const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
//         res.serverError(errors);
//         console.error(e);
//     }
// });
// exports.cardsListForCache = async (superAdminExist, menuID, tabType, parentId) => {
//     try {
//         let rows = await SubModuleRepository.filteredSubModuleManagementList([
//             {
//                 $match: {
//                     ...(display === true &&
//                         !superAdminExist && {
//                             isDisplay: display
//                         }),
//                     ...(!!menuID && {
//                         menuItemId: ObjectId(menuID)
//                     }),
//                     ...(!!tabType && {
//                         type: tabType
//                     })
//                 }
//             },
//             {
//                 $addFields: {
//                     // commonValues: {$cond: [superAdminExist, [], {$setIntersection: [user.role, "$roles"]}]},
//                     disabled: {$cond: [superAdminExist, false, "$disabled"]},
//                     items: {
//                         $cond: [
//                             superAdminExist,
//                             {
//                                 $map: {
//                                     input: "$items",
//                                     as: "item",
//                                     in: {
//                                         $mergeObjects: [
//                                             "$$item",
//                                             {
//                                                 disabled: {
//                                                     $cond: [superAdminExist, false, null]
//                                                 }
//                                             }
//                                         ]
//                                     }
//                                 }
//                             },
//                             {
//                                 $filter: {
//                                     input: "$items",
//                                     as: "item",
//                                     cond: {
//                                         $eq: ["$$item.isDisplay", true]
//                                     }
//                                 }
//                             }
//                         ]
//                     }
//                 }
//             },
//             // {
//             //     $match: {
//             //         commonValues: []
//             //     }
//             // },
//             {
//                 $project: {
//                     isDisplay: 1,
//                     title: 1,
//                     displayName: 1,
//                     disabled: 1,
//                     url: 1,
//                     _id: 1,
//                     items: 1,
//                     order: 1,
//                     roles: 1
//                 }
//             }
//         ]);
//         rows = flattenMenuItems(rows);
//         if (!!parentId) {
//             rows = rows?.filter(y => String(y?.parentId) == parentId);
//         }
//         return rows?.sort((a, b) => a?.order - b?.order);
//     } catch (error) {}
// };
function flattenMenuItems(items, parentId = ObjectId(MODULE_PARENT_ID), grandParentId) {
    let result = [];

    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        if (String(parentId) == String(MODULE_PARENT_ID)) {
            grandParentId = item._id;
        }
        const newItem = {
            ...item,
            parentId: parentId,
            grandParentId: grandParentId
        };
        if (item.items && item.items.length > 0) {
            newItem.items = item.items.length; // Count of child items
            result.push(newItem);
            result = result.concat(flattenMenuItems(item.items, item._id, newItem.grandParentId));
        } else {
            result.push({...newItem, grandParentId});
        }
    }
    return result;
}

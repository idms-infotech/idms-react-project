const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/stores/inventoryCorrectionModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {outputData, getAllAggregationFooter} = require("../../../../helpers/utility");
const {getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {getAllSuppliers} = require("../../purchase/suppliers/suppliers");
const {getAllItems} = require("../../purchase/items/items");
const {default: mongoose} = require("mongoose");
const {getDateDiff, dateToAnyFormat, getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {getCompanyLocations} = require("../../settings/company/company");
const InventoryCorrectionHelper = require("../../../../models/stores/helpers/inventoryCorrectionHelper");
const InventoryCorrectionRepo = require("../../../../models/stores/repository/inventoryCorrectionRepository");
const {filteredItemList} = require("../../../../models/purchase/repository/itemRepository");
const {GOODS_TRANSFER_REQUEST_DEPT, STOCK_PREP_UOM} = require("../../../../mocks/constantData");
const {getAllCheckedItemCategoriesList} = require("../../purchase/itemCategoryMaster/itemCategoryMaster");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const InventoryRepository = require("../../../../models/stores/repository/inventoryCorrectionRepository");
const {filteredInvZoneConfigList} = require("../../../../models/planning/repository/invZoneConfigRepository");
const {filteredCompanyList} = require("../../../../models/settings/repository/companyRepository");
const ObjectId = mongoose.Types.ObjectId;
exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1,
            supplier = null,
            itemId = null,
            fromDate = null,
            toDate = null
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let project = InventoryCorrectionHelper.getAllInventoryCorrectionReportsAttributes();
        const suppliers = await getAllSuppliers(req.user.company, {supplierName: 1});
        const items = await getAllItems(req.user.company, {itemCode: 1, itemName: 1});
        let match = await getMatchData(project, search);
        match = {
            ...match,
            ...(!!supplier && {
                supplier: ObjectId(supplier)
            })
        };
        let query = {
            company: ObjectId(req.user.company),
            closedIRQty: {$gt: 0},
            ...(!!itemId && {
                item: ObjectId(itemId)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    ICDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([
            {$match: query},
            {
                $addFields: {
                    GINDateS: {$dateToString: {format: "%d-%m-%Y", date: "$GINDate"}},
                    itemValueINR: {$toString: {$multiply: ["$closedIRQty", "$purchaseRatINR"]}},
                    closedIRQty: {$toString: "$closedIRQty"},
                    openIRQty: {$toString: "$openIRQty"},
                    purchaseRatINR: {$toString: "$purchaseRatINR"}
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [{$project: {itemCode: 1, itemName: 1, itemDescription: 1}}],
                    as: "item"
                }
            },
            {$unwind: "$item"},
            {
                $lookup: {
                    from: "MRN",
                    localField: "MRN",
                    foreignField: "_id",
                    pipeline: [{$project: {MRNNumber: 1, supplier: 1}}],
                    as: "MRN"
                }
            },
            {$unwind: "$MRN"},
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        let totalAmount = await Model.aggregate([
            {$match: query},
            {
                $group: {
                    _id: null,
                    totalItemValueINR: {$sum: {$multiply: ["$closedIRQty", "$purchaseRatINR"]}}
                }
            },
            {
                $project: {
                    totalItemValueINR: 1,
                    _id: 0
                }
            }
        ]);
        return res.success({
            ...outputData(rows),
            suppliers,
            items,
            totalAmount
        });
    } catch (e) {
        console.error("getAllAdvanceSalaryRequest", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllDuplicatesItem = asyncHandler(async () => {
    try {
        let rows = await Model.aggregate([
            {
                $match: {
                    closedIRQty: {$gt: 0}
                }
            },
            {
                $project: {
                    UOM: 1,
                    item: 1
                }
            },
            {
                $group: {
                    _id: {item: "$item"},
                    count: {
                        $sum: 1
                    },
                    uniqueValues: {$addToSet: "$UOM"}
                }
            },
            {
                $match: {
                    $nor: [{uniqueValues: {$exists: false}}, {uniqueValues: {$size: 0}}, {uniqueValues: {$size: 1}}]
                }
            },
            {
                $project: {
                    item: "$_id.item",
                    _id: 0
                }
            }
        ]);
        console.log("rows", JSON.stringify(rows));
    } catch (e) {
        console.error("getAllDuplicatesItem", e);
    }
});

exports.getReorderLevelReports = asyncHandler(async (req, res) => {
    try {
        const items = await filteredItemList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isActive: "A"
                }
            },
            {
                $project: {itemCode: 1}
            }
        ]);
        const {fromDate = null, toDate = null, item = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!item && {
                item: ObjectId(item)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    GINDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = InventoryCorrectionHelper.getReorderLevelReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $group: {
                    _id: "$item",
                    totalGINQty: {$sum: "$closedIRQty"}
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "_id",
                    foreignField: "_id",
                    pipeline: [
                        {$project: {itemCode: 1, itemDescription: 1, itemName: 1, perishableGoods: 1, itemROL: 1}}
                    ],
                    as: "itemDetails"
                }
            },
            {
                $unwind: "$itemDetails"
            }
        ];
        let rows = await InventoryCorrectionRepo.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            items,
            ...rows
        });
    } catch (e) {
        console.error("getReorderLevelReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getStockAgingReports = asyncHandler(async (req, res) => {
    try {
        const items = await filteredItemList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isActive: "A"
                }
            },
            {
                $project: {itemCode: 1}
            }
        ]);
        const {fromDate = null, toDate = null, item = null} = req.query;
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        let query = {
            company: ObjectId(req.user.company),
            closedIRQty: {$gt: 0},
            ...(!!item && {
                item: ObjectId(item)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    GINDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = InventoryCorrectionHelper.getStockAgingReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [
                        {$project: {itemCode: 1, itemDescription: 1, itemName: 1, perishableGoods: 1, shelfLife: 1}}
                    ],
                    as: "item"
                }
            },
            {$unwind: "$item"},
            {
                $match: {"item.perishableGoods": "Yes"}
            },
            {
                $addFields: {
                    GINDateS: {$dateToString: {format: "%d-%m-%Y", date: "$GINDate"}},
                    expiryDate: {
                        $dateAdd: {
                            startDate: "$GINDate",
                            unit: "month",
                            amount: "$item.shelfLife"
                        }
                    }
                }
            }
        ];
        let output = await InventoryCorrectionRepo.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        if (output.rows.length > 0) {
            for (const ele of output.rows) {
                if (ele.expiryDate) {
                    ele.expiryDate = `${ele.expiryDate.split("-")[2]}-${ele.expiryDate.split("-")[1]}-${
                        ele.expiryDate.split("-")[0]
                    }`;
                    let dateDiff = getDateDiff(ele.expiryDate, currentDate, "days");
                    if (+dateDiff < 0) {
                        ele.status = "red";
                    } else if (+dateDiff > 0 && +dateDiff < 30) {
                        ele.status = "yellow";
                    } else {
                        ele.status = "green";
                    }
                }
            }
        }
        // await insertManyInventory();
        // await updateManyDualUnitOfInventory();
        return res.success({
            items,
            ...output
        });
    } catch (e) {
        console.error("getStockAgingReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const insertManyInventory = async () => {
    try {
        let invList = await InventoryCorrectionRepo.filteredInventoryCorrectionList([
            {
                $lookup: {
                    from: "MRN",
                    localField: "MRN",
                    foreignField: "_id",
                    pipeline: [{$project: {MRNNumber: 1, MRNDate: 1, supplier: 1}}],
                    as: "MRN"
                }
            },
            {$unwind: "$MRN"},
            {
                $lookup: {
                    from: "Items",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                itemCode: 1,
                                itemName: 1,
                                itemDescription: 1
                            }
                        }
                    ],
                    as: "item"
                }
            },
            {$unwind: "$item"},
            {
                $project: {
                    _id: {$toObjectId: "$_id"},
                    company: {$toObjectId: "$company"},
                    createdBy: {$toObjectId: "$createdBy"},
                    updatedBy: {$toObjectId: "$updatedBy"},
                    GIN: {$toObjectId: "$GIN"},
                    GINDate: 1,
                    MRN: {$toObjectId: "$MRN._id"},
                    supplier: {$toObjectId: "$MRN.supplier"},
                    MRNNumber: "$MRN.MRNNumber",
                    MRNDate: "$MRN.MRNDate",
                    ICStatus: 1,
                    UOM: 1,
                    primaryToSecondaryConversion: 1,
                    secondaryToPrimaryConversion: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    conversionOfUnits: 1,
                    item: {$toObjectId: "$item._id"},
                    referenceModel: "Items",
                    itemCode: "$item.itemCode",
                    itemName: "$item.itemName",
                    itemDescription: "$item.itemDescription",
                    width: 1,
                    length: 1,
                    SQM: 1,
                    expiryDate: 1,
                    itemType: 1,
                    itemSubCategory: 1,
                    updatedQty: 1,
                    closedIRQty: 1,
                    standardRate: 1,
                    purchaseRate: 1,
                    purchaseRateUSD: 1,
                    purchaseRatINR: 1,
                    lineValueINR: 1,
                    batchDate: 1,
                    deliveryLocation: 1,
                    storageLocationMapping: 1,
                    department: GOODS_TRANSFER_REQUEST_DEPT.STORES,
                    type: "InventoryCorrection"
                }
            }
        ]);
        console.log("invList", JSON.stringify(invList));
        return;
        // First Take Backup Then only remove return
        await InventoryCorrectionRepo.deleteManyDoc({});
        return InventoryCorrectionRepo.insertManyDoc(invList);
    } catch (error) {
        console.error(error);
    }
};
const updateManyDualUnitOfInventory = async () => {
    try {
        let inventoryList = await InventoryCorrectionRepo.filteredInventoryCorrectionList([
            {
                $lookup: {
                    from: "Items",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                primaryUnit: 1,
                                secondaryUnit: 1,
                                primaryToSecondaryConversion: 1,
                                secondaryToPrimaryConversion: 1
                            }
                        }
                    ],
                    as: "item"
                }
            },
            {$unwind: "$item"},
            {
                $project: {
                    inventoryId: "$_id",
                    itemId: "$item._id",
                    itemCode: 1,
                    primaryUnit: "$item.primaryUnit",
                    secondaryUnit: "$item.secondaryUnit",
                    primaryToSecondaryConversion: "$item.primaryToSecondaryConversion",
                    secondaryToPrimaryConversion: "$item.secondaryToPrimaryConversion"
                }
            }
        ]);
        return;
        let dualUnitNotDefined = [];
        for await (const ele of inventoryList) {
            if (ele.primaryToSecondaryConversion || ele.secondaryToPrimaryConversion) {
                await InventoryCorrectionRepo.findAndUpdateDoc(
                    {_id: ele.inventoryId},
                    {
                        primaryUnit: ele.primaryUnit,
                        secondaryUnit: ele.secondaryUnit,
                        primaryToSecondaryConversion: ele.primaryToSecondaryConversion,
                        secondaryToPrimaryConversion: ele.secondaryToPrimaryConversion
                    }
                );
            } else {
                dualUnitNotDefined.push({
                    inventoryId: ele.inventoryId,
                    itemId: ele.itemId,
                    itemCode: ele.itemCode
                });
            }
        }
        console.log("dualUnitNotDefined", dualUnitNotDefined);
    } catch (error) {
        console.error(error);
    }
};
exports.getAllInventoryLocationWiseReports = asyncHandler(async (req, res) => {
    try {
        const {fromDate = null, toDate = null, location = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!toDate &&
                !!fromDate && {
                    GINDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                }),
            ...(!!location && {deliveryLocation: location})
        };
        let project = InventoryCorrectionHelper.getAllInventoryLocationWiseReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [{$project: {itemCode: 1, itemName: 1, itemDescription: 1}}],
                    as: "item"
                }
            },
            {$unwind: "$item"}
        ];
        let rows = await InventoryCorrectionRepo.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        const locations = await getCompanyLocations(req.user.company);
        return res.success({
            locations: locations?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            }),
            ...rows
        });
    } catch (e) {
        console.error("getAllInventoryLocationWiseReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllLocationSupplierItemWiseReports = asyncHandler(async (req, res) => {
    try {
        const suppliersList = await getAllSuppliers(req.user.company, {supplierName: 1});
        const subLocationsOptions = await getAllModuleMaster(req.user.company, "SUB_LOCATIONS");
        const itemsList = await filteredItemList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isActive: "A"
                }
            },
            {
                $project: {itemCode: 1, itemName: 1}
            }
        ]);
        const locations = await getCompanyLocations(req.user.company);
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        const {
            toDate = null,
            location = null,
            subLocation = null,
            supplierId = null,
            itemId = null,
            showZeroQty = null,
            department = GOODS_TRANSFER_REQUEST_DEPT.STORES
        } = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!showZeroQty && {
                closedIRQty: {$gt: 0}
            }),
            ...(!!itemId && {
                item: ObjectId(itemId)
            }),
            ...(!!toDate && {
                ICDate: {
                    $lte: getEndDateTime(toDate)
                }
            }),
            department: department,
            ...(!!subLocation && {
                "storageLocationMapping.subLocation": subLocation
            })
        };
        let project = InventoryCorrectionHelper.getAllLocationSupplierItemWiseReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $addFields: {
                                supplierDetails: {$first: "$supplierDetails"}
                            }
                        },
                        {
                            $addFields: {
                                purchaseRateCommon: {$first: "$supplierDetails.purchaseRateCommon"}
                            }
                        },
                        {
                            $project: {
                                shelfLife: 1,
                                supplierDetails: 1,
                                purchaseRateCommon: 1
                            }
                        }
                    ],
                    as: "itemInfo"
                }
            },
            {
                $lookup: {
                    from: "ProductionItem",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                shelfLife: 1
                            }
                        }
                    ],
                    as: "childItemInfo"
                }
            },
            {
                $addFields: {
                    item: {$concatArrays: ["$itemInfo", "$childItemInfo"]}
                }
            },
            {$unwind: "$item"},
            {
                $addFields: {
                    expiryDate: {
                        $ifNull: [
                            "$expiryDate",
                            {
                                $dateAdd: {
                                    startDate: "$batchDate",
                                    unit: "month",
                                    amount: "$item.shelfLife"
                                }
                            }
                        ]
                    }
                }
            },
            // {
            //     $lookup: {
            //         from: "MRN",
            //         localField: "MRN",
            //         foreignField: "_id",
            //         pipeline: [{$project: {MRNNumber: 1, supplier: 1}}],
            //         as: "MRN"
            //     }
            // },
            // {$unwind: "$MRN"},
            {
                $match: {
                    ...(!!supplierId && {
                        supplier: ObjectId(supplierId)
                    }),
                    ...(!!location && {deliveryLocation: location})
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1, _id: 1, supplierNickName: 1}}],
                    as: "supplierInfo"
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [
                        {$project: {supplierName: "$customerName", _id: 1, supplierNickName: "$customerNickName"}}
                    ],
                    as: "customerInfo"
                }
            },
            {
                $addFields: {
                    supplier: {$concatArrays: ["$supplierInfo", "$customerInfo"]}
                }
            },
            {
                $unwind: {
                    path: "$supplier",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];
        let output = await InventoryCorrectionRepo.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        value: {$sum: {$toDouble: "$lineValue"}}
                    }
                }
            ]
        });

        if (output.rows.length > 0) {
            for (const ele of output.rows) {
                if (!!ele.expiryDate) {
                    ele.expiryDate = dateToAnyFormat(ele.expiryDate, "YYYY-MM-DD");
                    let dateDiff = getDateDiff(ele.expiryDate, currentDate, "days");
                    ele.expiryDate = new Date(ele.expiryDate);
                    if (+dateDiff < 0) {
                        ele.status = "red";
                    } else if (+dateDiff > 0 && +dateDiff < 30) {
                        ele.status = "orange";
                    } else {
                        ele.status = "green";
                    }
                } else {
                    ele.status = "green";
                }
            }
        }
        return res.success({
            suppliersList,
            subLocationsOptions,
            itemsList,
            locations: locations?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            }),
            ...output
        });
    } catch (e) {
        console.error("getAllInventoryLocationWiseReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// exports.getTotalNoOfInventoryPerDay = async company => {
//     const rows = await Model.aggregate([
//         {
//             $match: {
//                 company: ObjectId(company),
//                 ICDate: {
//                     $lte: getEndDateTime(new Date()),
//                     $gte: getStartDateTime(new Date())
//                 }
//             }
//         },
//         {
//             $group: {
//                 _id: null,
//                 totalInventory: {$sum: 1},
//                 totalInventoryValue: {$sum: "$lineValueINR"}
//             }
//         },
//         {
//             $project: {
//                 _id: 0,
//                 totalInventory: 1,
//                 totalInventoryValue: 1
//             }
//         }
//     ]);
//     return rows.length > 0 ? rows[0] : [];
// };

exports.getStockPreparationShopReports = asyncHandler(async (req, res) => {
    try {
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            stockPreparation: true
        });
        itemCategoriesList = itemCategoriesList.map(x => x.category);
        let project = InventoryCorrectionHelper.getStockPreparationShopReportsAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    closedIRQty: {$gt: 0},
                    department: {$in: [GOODS_TRANSFER_REQUEST_DEPT.PLANNING, GOODS_TRANSFER_REQUEST_DEPT.PRODUCTION]}
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                itemType: 1
                            }
                        }
                    ],
                    as: "item"
                }
            },
            {
                $match: {
                    ...(itemCategoriesList.length > 0 && {"item.itemType": {$in: itemCategoriesList}})
                }
            },
            {
                $addFields: {
                    convertedClosedIRQty: {
                        $cond: [
                            {$eq: [STOCK_PREP_UOM.SQM, "$UOM"]},
                            "$closedIRQty",
                            {
                                $cond: [
                                    {$ne: ["$primaryToSecondaryConversion", null]},
                                    {
                                        $multiply: ["$closedIRQty", "$primaryToSecondaryConversion"]
                                    },
                                    {
                                        $divide: ["$closedIRQty", "$secondaryToPrimaryConversion"]
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        ];
        let rows = await InventoryCorrectionRepo.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });

        let WXLDimensionsUnit = await getAllModuleMaster(req.user.company, "WXL_DIMENSIONS_UNIT");

        return res.success({
            ...rows,
            WXLDimensionsUnit: WXLDimensionsUnit?.map(x => x.value)
        });
    } catch (e) {
        console.error("getStockPreparationShopReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllStockPreparationShop = asyncHandler(async (req, res) => {
    try {
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            stockPreparation: true
        });
        itemCategoriesList = itemCategoriesList.map(x => x.category);
        let project = InventoryCorrectionHelper.getAllStockPreparationShopAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    closedIRQty: {$gt: 0},
                    department: {$in: [GOODS_TRANSFER_REQUEST_DEPT.PLANNING, GOODS_TRANSFER_REQUEST_DEPT.PRODUCTION]}
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                itemType: 1
                            }
                        }
                    ],
                    as: "item"
                }
            },
            {
                $match: {
                    ...(itemCategoriesList.length > 0 && {"item.itemType": {$in: itemCategoriesList}})
                }
            },
            {
                $addFields: {
                    convertedClosedIRQty: {
                        $cond: [
                            {$eq: [STOCK_PREP_UOM.SQM, "$UOM"]},
                            "$closedIRQty",
                            {
                                $cond: [
                                    {$ne: ["$primaryToSecondaryConversion", null]},
                                    {
                                        $multiply: ["$closedIRQty", "$primaryToSecondaryConversion"]
                                    },
                                    {
                                        $divide: ["$closedIRQty", "$secondaryToPrimaryConversion"]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $project: project
            }
        ];
        let rows = await InventoryCorrectionRepo.filteredInventoryCorrectionList(pipeline);

        let WXLDimensionsUnit = await getAllModuleMaster(req.user.company, "WXL_DIMENSIONS_UNIT");

        return res.success({
            rows,
            WXLDimensionsUnit: WXLDimensionsUnit?.map(x => x.value)
        });
    } catch (e) {
        console.error("getAllStockPreparationShop", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllItemWiseReports = asyncHandler(async (req, res) => {
    try {
        const itemsOptions = await filteredItemList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isActive: "A"
                }
            },
            {
                $project: {itemCode: 1, itemName: 1}
            }
        ]);
        const {
            toDate = null,
            fromDate = null,
            itemId = null,
            department = GOODS_TRANSFER_REQUEST_DEPT.STORES
        } = req.query;
        let query = {
            company: ObjectId(req.user.company),
            closedIRQty: {$gt: 0},
            ...(!!itemId && {
                item: ObjectId(itemId)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    ICDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                }),
            ...(!!department && {
                department: department
            })
        };
        let project = {
            _id: 0,
            UOM: 1,
            closedIRQty: 1,
            purchaseRatINR: 1,
            itemCode: 1,
            itemName: 1,
            itemDescription: 1,
            primaryUnit: 1,
            secondaryUnit: 1,
            conversionOfUnits: 1,
            primaryToSecondaryConversion: 1,
            secondaryToPrimaryConversion: 1,
            lineValue: 1
        };
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                itemCode: 1,
                                itemName: 1,
                                itemDescription: 1
                            }
                        }
                    ],
                    as: "item"
                }
            },
            {
                $lookup: {
                    from: "ProductionItem",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                itemCode: 1,
                                itemName: 1,
                                itemDescription: 1
                            }
                        }
                    ],
                    as: "childItem"
                }
            },
            {
                $addFields: {
                    item: {
                        $concatArrays: ["$item", "$childItem"]
                    }
                }
            },
            {
                $unwind: {
                    path: "$item",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: {MRN: "$item._id", UOM: "$UOM"},
                    UOM: {$first: "$UOM"},
                    closedIRQty: {$sum: "$closedIRQty"},
                    purchaseRatINR: {$last: "$purchaseRatINR"},
                    itemCode: {$first: "$item.itemCode"},
                    itemName: {$first: "$item.itemName"},
                    itemDescription: {$first: "$item.itemDescription"},
                    primaryUnit: {$first: "$primaryUnit"},
                    secondaryUnit: {$first: "$secondaryUnit"},
                    conversionOfUnits: {$first: "$conversionOfUnits"},
                    primaryToSecondaryConversion: {$first: "$primaryToSecondaryConversion"},
                    secondaryToPrimaryConversion: {$first: "$secondaryToPrimaryConversion"}
                }
            },
            {
                $addFields: {
                    lineValue: {$round: [{$multiply: ["$closedIRQty", "$purchaseRatINR"]}, 2]}
                }
            }
        ];
        let output = await InventoryCorrectionRepo.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        value: {$sum: "$lineValue"}
                    }
                }
            ]
        });
        return res.success({
            itemsOptions,
            ...output
        });
    } catch (e) {
        console.error("getAllLocationSupplierItemWiseReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllInterProdReports = asyncHandler(async (req, res) => {
    try {
        const invZoneOptions = await filteredInvZoneConfigList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $sort: {
                    srNo: 1
                }
            },
            {
                $project: {
                    _id: 0,
                    invZone: "$_id",
                    invZoneName: 1,
                    label: {$concat: ["$invZoneCode", " - ", "$invZoneName"]}
                }
            }
        ]);
        const locationOptions = await filteredCompanyList([
            {
                $match: {
                    _id: ObjectId(req.user.company)
                }
            },
            {$unwind: "$placesOfBusiness"},
            {$group: {_id: null, locationIDs: {$addToSet: "$placesOfBusiness.locationID"}}},
            {
                $unwind: "$locationIDs"
            },
            {$project: {_id: 0, label: "$locationIDs", value: "$locationIDs"}}
        ]);
        const {toDate = null, invZone = null, location = null, prodUnitConfig = null} = req.query;
        let project = InventoryCorrectionHelper.getAllInterProdReportsAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    closedIRQty: {$gt: 0},
                    ...(!!invZone && {
                        invZoneId: ObjectId(invZone)
                    }),
                    ...(!!prodUnitConfig && {
                        departmentId: ObjectId(prodUnitConfig)
                    }),
                    ...(!!location && {
                        deliveryLocation: location
                    }),
                    ...(!!toDate && {
                        batchDate: {
                            $lte: getEndDateTime(toDate)
                        }
                    }),
                    refDepartment: "ProductionUnitConfig"
                    // referenceModel: "ProductionItem"
                }
            }
        ];
        let rows = await InventoryCorrectionRepo.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        totalValue: {$sum: "$value"}
                    }
                }
            ]
        });
        return res.success({
            invZoneOptions,
            locationOptions,
            ...rows
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

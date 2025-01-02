const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getIncrementNumWithPrefix} = require("../../../../helpers/utility");
const {OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getAllProdItemCategory} = require("../../settings/prodItemCategory/prodItemCategory");
const {PROD_ITEM_CATEGORY_TYPE} = require("../../../../mocks/constantData");
const {getProdByBOMId} = require("../billOfMaterial/BOMOfProdItem/BOMOfProdItem");
const ProdItemMasterHelper = require("../../../../models/planning/helpers/prodItemMasterHelper");
const ProdItemRepository = require("../../../../models/planning/repository/prodItemRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {filteredInvZoneConfigList} = require("../../../../models/planning/repository/invZoneConfigRepository");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
const {
    filteredProductionUnitConfigList
} = require("../../../../models/planning/repository/productionUnitConfigRepository");
const unitJson = require("../../../../mocks/unit.json");
const {PRODUCTION_ITEMS_OPTION} = require("../../../../mocks/dropDownOptions");
const {filteredHSNList} = require("../../../../models/purchase/repository/hsnRepository");
const {filteredSubModuleManagementList} = require("../../../../models/settings/repository/subModuleRepository");
const ObjectId = mongoose.Types.ObjectId;
exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await ProdItemRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Prod Item")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Prod Item", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = ProdItemMasterHelper.getAllProdItemMasterAttributes();
        if (req.query.excel == "true") {
            project = ProdItemMasterHelper.getAllProdItemMasterExcelAttributes();
        }
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    prodUnitId: ObjectId(req.query.prodUnitConfig)
                }
            }
        ];
        let rows = await ProdItemRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await ProdItemRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Prod Item");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Prod Item", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await ProdItemRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Prod Item")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Prod Item");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Prod Item", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ProdItemRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await ProdItemRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Prod Item")
        });
    } catch (e) {
        console.error("update Prod Item", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const {prodUnitConfigId = null} = req.query;
        let WXLDimensionsUnit = await getAllModuleMaster(req.user.company, "WXL_DIMENSIONS_UNIT");
        const featureConfig = await filteredSubModuleManagementList([
            {
                $match: {
                    _id: ObjectId(req.query.subModuleId)
                }
            },
            {
                $unwind: "$featureConfig"
            },
            {
                $match: {
                    "featureConfig.status": true
                }
            },
            {
                $project: {
                    featureCode: "$featureConfig.featureCode",
                    value: "$featureConfig.value"
                }
            }
        ]);

        const options = await dropDownOptions(req.user.company, prodUnitConfigId);
        return res.success({
            ...options,
            featureConfig,
            WXLDimensionsUnit: WXLDimensionsUnit?.map(x => x.value)
        });
    } catch (error) {
        console.error("getAllMasterData Prod Item", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const dropDownOptions = async (company, prodUnitConfigId = null) => {
    try {
        const invZoneOptions = await filteredInvZoneConfigList([
            {
                $match: {
                    company: ObjectId(company),
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
        const categoryList = await getAllProdItemCategory([
            {
                $match: {
                    type: PROD_ITEM_CATEGORY_TYPE.PRODUCTION_ITEM,
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE,
                    ...(!!prodUnitConfigId && {
                        prodUnitConfigId: ObjectId(prodUnitConfigId)
                    })
                }
            }
        ]);
        let autoIncValues = {};
        if (categoryList.length > 0) {
            for (const ele of categoryList) {
                autoIncValues[ele.category] = getIncrementNumWithPrefix({
                    modulePrefix: ele.prefix,
                    autoIncrementValue: ele.nextAutoIncrement,
                    digit: ele.digit
                });
            }
        }
        return {
            categoryList: categoryList.map(x => {
                return {label: x.label, value: x.category};
            }),
            autoIncValues,
            invZoneOptions
        };
    } catch (error) {
        console.error(error);
    }
};
exports.viewByBOMId = asyncHandler(async (req, res) => {
    try {
        let BOMData = await getProdByBOMId(req.user.company, req.query.childItemId);
        if (BOMData) {
            return res.success({
                BOMData
            });
        } else {
            const errors = "BOM Not available";
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("getById Prod Item", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllProdItemsListForBOM = async (company, category = null, title, project = null) => {
    try {
        let projectObj = {
            prodItemCategory: 1,
            reference: "$_id",
            referenceModel: "ProductionItem",
            itemCode: 1,
            itemName: 1,
            itemDescription: 1,
            UOM: {
                $cond: [
                    {$or: [{$not: ["$secondaryUnit"]}, {$eq: ["$secondaryUnit", "-"]}]},
                    "$unitOfMeasurement",
                    "$secondaryUnit"
                ]
            },
            unitCost: {$ifNull: ["$stdCostInfo.prodItemCost", 0]},
            itemCost: {$ifNull: ["$stdCostInfo.prodItemCost", 0]},
            partCount: {$literal: 0},
            qtyPerSKUUnit: {$literal: 0},
            wastePercentage: {$literal: 0},
            BOM: {$ifNull: ["$BOMOfProdItem.BOMNo", "-"]},
            type: "prodItem",
            _id: 0
        };

        if (project) {
            projectObj = project;
        }
        const rows = await ProdItemRepository.filteredProdItemList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(company),
                    ...(!!category && {prodItemCategory: category})
                }
            },
            {
                $lookup: {
                    from: "BOMOfProdItem",
                    let: {fieldId: "$_id"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$item", "$$fieldId"]
                                }
                            }
                        },
                        {$project: {BOMNo: 1}}
                    ],
                    as: "BOMOfProdItem"
                }
            },
            {
                $unwind: {
                    path: "$BOMOfProdItem",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "ProdItemStdCost",
                    let: {fieldId: "$_id"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$item", "$$fieldId"]
                                }
                            }
                        },
                        {
                            $addFields: {
                                prodUnitDetails: {$first: "$prodUnitDetails"}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                prodItemCost: "$prodUnitDetails.prodItemCost"
                            }
                        }
                    ],
                    as: "stdCostInfo"
                }
            },
            {
                $unwind: {
                    path: "$stdCostInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: projectObj
            },
            {
                $sort: {
                    itemCode: 1
                }
            }
        ]);
        return rows;
    } catch (error) {
        console.error("getAllProdItemsListForBOM", error);
    }
};
exports.getAllProdItemCountByCategoryAndSOM = async company => {
    try {
        const result = await ProdItemRepository.filteredProdItemList([
            {
                $match: {
                    company: ObjectId(company)
                }
            },
            {
                $group: {
                    _id: null,
                    inHouseL20Counts: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        {$eq: ["$prodItemCategory", "L20/Prod Item"]},
                                        {$eq: ["$sourceOfManufacturing", "Inhouse"]}
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    outSourcedL20Counts: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        {$eq: ["$prodItemCategory", "L20/Prod Item"]},
                                        {$eq: ["$sourceOfManufacturing", "Outsourced"]}
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    outSourcedL30Counts: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        {$eq: ["$prodItemCategory", "L30/Grand Child"]},
                                        {$eq: ["$sourceOfManufacturing", "Outsourced"]}
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    inHouseL30Counts: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        {$eq: ["$prodItemCategory", "L30/Grand Child"]},
                                        {$eq: ["$sourceOfManufacturing", "Inhouse"]}
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    inHouseL20Counts: 1,
                    outSourcedL20Counts: 1,
                    outSourcedL30Counts: 1,
                    inHouseL30Counts: 1,
                    _id: 0
                }
            }
        ]);
        let obj = {
            inHouseL20Counts: result[0]?.inHouseL20Counts || 0,
            outSourcedL20Counts: result[0]?.outSourcedL20Counts || 0,
            outSourcedL30Counts: result[0]?.outSourcedL30Counts || 0,
            inHouseL30Counts: result[0]?.inHouseL30Counts || 0
        };
        return obj;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};

exports.getProdItemsListForStockLevels = asyncHandler(async (req, res) => {
    try {
        const categoryOptions = await getAllProdItemCategory([
            {
                $match: {
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE,
                    type: PROD_ITEM_CATEGORY_TYPE.PRODUCTION_ITEM
                }
            },
            {
                $project: {
                    _id: 0,
                    label: "$category",
                    value: "$category"
                }
            }
        ]);
        const {filterBy = null, filterByCategory = null} = req.query;
        let project = ProdItemMasterHelper.getAllProdItemStockLevelsAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            },
            {
                $addFields: {
                    status: {
                        $cond: [
                            {
                                $and: [{$gt: [{$ifNull: ["$stockLevels.reorderLevel", null]}, null]}]
                            },
                            OPTIONS.defaultStatus.ACTIVE,
                            OPTIONS.defaultStatus.INACTIVE
                        ]
                    }
                }
            },
            {
                $match: {
                    ...(!!filterBy && {
                        status: filterBy
                    }),
                    ...(!!filterByCategory && {
                        prodItemCategory: filterByCategory
                    })
                }
            }
        ];
        let rows = await ProdItemRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        activeCount: {$sum: 1},
                        SKULinked: {$sum: {$cond: [{$in: ["$status", [OPTIONS.defaultStatus.ACTIVE]]}, 1, 0]}},
                        SKUUnLinked: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.INACTIVE]}, 1, 0]}}
                    }
                },
                {
                    $project: {
                        _id: 0
                    }
                }
            ]
        });
        return res.success({
            ...rows,
            statusArray: [
                {label: "Active Items Count", count: rows?.totalAmounts?.activeCount ?? 0},
                {label: "Stock Levels Defined - Count", count: rows?.totalAmounts?.SKULinked ?? 0},
                {label: "Stock Levels Not Defined - Count", count: rows?.totalAmounts?.SKUUnLinked ?? 0}
            ],
            statusOptions: [
                {
                    label: `Summary By Prod Item Category (CAT)`,
                    value: ""
                },
                {label: "Summary by Status - Red", value: OPTIONS.defaultStatus.INACTIVE},
                {label: "Summary by Status - Green", value: OPTIONS.defaultStatus.ACTIVE}
            ],
            categoryOptions: [
                {
                    label: "All",
                    value: ""
                },
                ...categoryOptions
            ]
        });
    } catch (e) {
        console.error("getProdItemsListForStockLevels", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.checkProdItemsValidation = async (prodItemData, column, company) => {
    try {
        const prodItemOptions = await ProdItemRepository.filteredProdItemList([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {
                    itemName: 1,
                    itemDescription: 1
                }
            }
        ]);
        let prodUnitsOptions = await filteredProductionUnitConfigList([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {
                    _id: 0,
                    label: "$prodUnitCode",
                    value: "$prodUnitCode"
                }
            }
        ]);
        const requiredFields = [
            "prodItemCategory",
            "itemCode",
            "itemName",
            "itemDescription",
            "unitOfMeasurement",
            "primaryUnit",
            "BOMLevel",
            "shelfLife"
        ];
        let unitJsonMap = unitJson.map(x => {
            return {
                label: x.label,
                value: x.value
            };
        });
        const falseArr = OPTIONS.falsyArray;
        let {categoryList, invZoneOptions} = await dropDownOptions(company);
        let dropdownCheck = [
            {
                key: "primaryUnit",
                options: unitJsonMap
            },
            {
                key: "secondaryUnit",
                options: [
                    ...unitJsonMap,
                    {
                        value: "-",
                        label: "-"
                    }
                ]
            },
            {
                key: "prodItemCategory",
                options: categoryList
            },
            {
                key: "BOMLevel",
                options: PRODUCTION_ITEMS_OPTION.BOM_LEVEL_OPTIONS
            },
            {
                key: "inwardTo",
                options: invZoneOptions?.map(x => {
                    return {
                        label: x.invZoneName,
                        value: x.invZoneName
                    };
                })
            },
            {
                key: "prodUnit",
                options: prodUnitsOptions
            }
        ];
        for await (const x of prodItemData) {
            x.isValid = true;
            x.message = null;
            for (const ele of Object.values(column)) {
                if (requiredFields.includes(ele) && falseArr.includes(x[ele])) {
                    x.isValid = false;
                    x.message = validationJson[ele] ?? `${ele} is Required`;
                    break;
                }
                for (const dd of dropdownCheck) {
                    if (ele == dd.key && !dd.options.map(values => values.value).includes(x[ele])) {
                        x.isValid = false;
                        x.message = `${ele} is Invalid Value & Value Must be ${dd.options.map(values => values.value)}`;
                        break;
                    }
                }
                for (const ele of prodItemOptions) {
                    if (ele.itemName == x["itemName"] && ele.itemDescription == x["itemDescription"]) {
                        x.isValid = false;
                        x.message = `${x["itemName"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = prodItemData.filter(x => !x.isValid);
        const validRecords = prodItemData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};
exports.bulkInsertProdItemsByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        const invZoneOptions = await filteredInvZoneConfigList([
            {
                $match: {
                    company: ObjectId(company),
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
                    _id: 1,
                    invZoneName: 1
                }
            }
        ]);
        const prodUnitsOptions = await filteredProductionUnitConfigList([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {
                    _id: 1,
                    label: "$prodUnitCode"
                }
            }
        ]);
        let prodUnitIdMap = new Map(prodUnitsOptions.map(y => [y.label, y._id]));
        let invZoneIdMap = new Map(invZoneOptions.map(y => [y.invZoneName, y._id]));
        let prodItemData = jsonData.map(x => {
            x.company = company;
            x.createdBy = createdBy;
            x.updatedBy = updatedBy;
            x.unitOfMeasurement = x.primaryUnit;
            if (x.secondaryUnit == "-") {
                x.primaryToSecondaryConversion = null;
            }
            x.prodUnitId = prodUnitIdMap.get(x?.prodUnit);
            x.invZone = invZoneIdMap.get(x?.inwardTo);
            return x;
        });
        for await (const item of prodItemData) {
            await ProdItemRepository.createDoc(item);
        }
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

exports.getProdItemsByLocation = async (req, res) => {
    try {
        const {filterBy = "All"} = req.query;
        const itemCategoryOptions = await getAllProdItemCategory([
            {
                $match: {
                    type: PROD_ITEM_CATEGORY_TYPE.PRODUCTION_ITEM,
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {
                    label: "$category",
                    value: "$category"
                }
            }
        ]);
        itemCategoryOptions.unshift({
            label: "All",
            value: "All"
        });
        let itemsList = await ProdItemRepository.filteredProdItemList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(req.user.company),
                    prodUnitId: ObjectId(req.query.prodUnitId),
                    prodItemCategory: filterBy == "All" ? {$exists: true} : filterBy
                }
            },
            {
                $project: {
                    _id: 1,
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: "$unitOfMeasurement",
                    unitOfMeasurement: 1,
                    conversionOfUnits: 1,
                    shelfLife: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    batchCardClosureDate: {$literal: null},
                    batchOutputQty: {$literal: 0},
                    batchCardNo: {$literal: null},
                    expiryDate: {
                        $cond: [
                            {$and: ["$shelfLife", {$gt: ["$shelfLife", 0]}]},
                            {
                                $dateAdd: {
                                    startDate: "$$NOW",
                                    unit: "day",
                                    amount: {$multiply: ["$shelfLife", 30]}
                                }
                            },
                            null
                        ]
                    }
                }
            },
            {
                $sort: {
                    itemCode: 1
                }
            }
        ]);
        return res.success({
            itemsList,
            itemCategoryOptions
        });
    } catch (error) {
        console.error("getProdItemsByLocation  Prod Item", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAllForHSN = asyncHandler(async (req, res) => {
    try {
        const {filterBy = null, filterByCategory = null, prodUnitConfig = null} = req.query;
        const itemCategories = await getAllProdItemCategory([
            {
                $match: {
                    prodUnitConfigId: ObjectId(prodUnitConfig),
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ]);
        let project = ProdItemMasterHelper.getAllForHSNAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE,
                    prodUnitId: ObjectId(prodUnitConfig),
                    ...(!!filterByCategory && {
                        prodItemCategory: filterByCategory
                    })
                }
            },
            {
                $addFields: {
                    HSNStatus: {
                        $cond: [{$not: ["$HSN"]}, OPTIONS.defaultStatus.INACTIVE, OPTIONS.defaultStatus.ACTIVE]
                    }
                }
            },
            {
                $match: {
                    ...(!!filterBy && {
                        HSNStatus: filterBy
                    })
                }
            },
            {
                $sort: {itemCode: 1}
            }
        ];
        let rows = await ProdItemRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        activeItems: {$sum: 1},
                        itemLinkedData: {$sum: {$cond: [{$eq: ["$HSNStatus", OPTIONS.defaultStatus.ACTIVE]}, 1, 0]}},
                        itemUnlinkedData: {$sum: {$cond: [{$eq: ["$HSNStatus", OPTIONS.defaultStatus.INACTIVE]}, 1, 0]}}
                    }
                },
                {
                    $project: {
                        _id: 0
                    }
                }
            ]
        });
        const HSNCodesOptions = await filteredHSNList([
            {$match: {company: ObjectId(req.user.company), isActive: "Y"}},
            {$sort: {createdAt: -1}},
            {
                $project: {
                    HSN: "$_id",
                    HSNCode: "$hsnCode",
                    goodsDescription: 1,
                    gstRate: 1
                }
            }
        ]);
        return res.success({
            ...rows,
            statusArray: [
                {label: "Active Prod Item Count", count: rows?.totalAmounts?.activeItems ?? 0},
                {label: "Total Prod Item with HSN Count", count: rows?.totalAmounts?.itemLinkedData ?? 0},
                {label: "Total Prod Item without HSN Count", count: rows?.totalAmounts?.itemUnlinkedData ?? 0}
            ],
            categoryOptions: itemCategories?.map(x => x?.category),
            statusOptions: [
                {label: "Summary by Prod Item Category", value: ""},
                {label: "Summary by Status - Red", value: OPTIONS.defaultStatus.INACTIVE},
                {label: "Summary by Status - Green", value: OPTIONS.defaultStatus.ACTIVE}
            ],
            HSNCodesOptions
        });
    } catch (e) {
        console.error("getAllForHSN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllCopyFlowMasterData = asyncHandler(async (req, res) => {
    try {
        const {prodUnitConfig = null} = req.query;
        const prodItemList = await ProdItemRepository.filteredProdItemList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE,
                    prodUnitId: ObjectId(prodUnitConfig)
                }
            },
            {
                $match: {
                    $or: [{HSN: {$exists: false}}, {HSN: null}]
                }
            },
            {
                $project: {
                    _id: 0,
                    select: {$literal: false},
                    item: "$_id",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    HSNCode: 1,
                    UOM: "$unitOfMeasurement",
                    itemCategory: "$prodItemCategory"
                }
            }
        ]);
        const itemCategories = await getAllProdItemCategory([
            {
                $match: {
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE,
                    prodUnitConfigId: ObjectId(prodUnitConfig)
                }
            },
            {
                $project: {
                    _id: 0,
                    label: "$category",
                    value: "$category"
                }
            }
        ]);
        return res.success({itemCategoriesOptions: itemCategories, prodItemList});
    } catch (error) {
        console.error("getAllCopyFlowMasterData Prod Item", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.createCopy = asyncHandler(async (req, res) => {
    try {
        let existingData = await ProdItemRepository.findOneDoc({_id: req.body.item});
        if (!existingData) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Prod Item");
            return res.unprocessableEntity(errors);
        }
        for (const ele of req.body.processArray) {
            await ProdItemRepository.findAndUpdateDoc(
                {_id: ele.item},
                {
                    HSN: existingData?.HSN,
                    HSNCode: existingData?.HSNCode,
                    revisionInfo: req.body.revisionInfo,
                    revisionHistory: [
                        {
                            itemCode: existingData?.itemCode,
                            itemName: existingData?.itemName,
                            itemDescription: existingData?.itemDescription,
                            UOM: existingData?.UOM,
                            prodItemCategory: existingData?.prodItemCategory,
                            HSN: existingData?.HSN,
                            HSNCode: existingData?.HSNCode,
                            status: existingData?.status,
                            revisionInfo: req.body?.revisionInfo
                        }
                    ]
                }
            );
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Prod Items")
        });
    } catch (e) {
        console.error("create Prod Items", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllInkList = async company => {
    try {
        let rows = await ProdItemRepository.filteredProdItemList([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $lookup: {
                    from: "ProductionUnitConfig",
                    localField: "prodUnitId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $match: {
                                formulationFlag: true
                            }
                        },
                        {
                            $project: {
                                _id: 1
                            }
                        }
                    ],
                    as: "productionUnitInfo"
                }
            },
            {
                $unwind: "$productionUnitInfo"
            },
            {
                $project: {
                    inkId: "$_id",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UoM: "$unitOfMeasurement",
                    inkCostPerKg: {$literal: 0},
                    inkCostPerGm: {$literal: 0},
                    colSeq: null,
                    mesh: {$literal: 0},
                    GSM: {$literal: 0},
                    areaSqm: {$literal: 0},
                    inkArea: {$literal: 0},
                    inkAreaSqm: {$literal: 0},
                    ink: {$literal: 0}
                }
            },
            {$sort: {itemCode: 1}}
        ]);
        return rows;
    } catch (e) {
        console.error("error", e);
    }
};

const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllJobWorkItemMasterAttributes,
    getAllJWItemForStockLevelAttributes,
    getAllForHSNAttributes
} = require("../../../../models/purchase/helpers/jobWorkItemMasterHelper");
const JobWorkItemMasterRepository = require("../../../../models/purchase/repository/jobWorkItemMasterRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getIncrementNumWithPrefix} = require("../../../../helpers/utility");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
const {getAllProdItemCategory} = require("../../settings/prodItemCategory/prodItemCategory");
const {PROD_ITEM_CATEGORY_TYPE} = require("../../../../mocks/constantData");
const {PRODUCTION_ITEMS_OPTION} = require("../../../../mocks/dropDownOptions");
const unitJson = require("../../../../mocks/unit.json");
const {filteredHSNList} = require("../../../../models/purchase/repository/hsnRepository");

// const {updateJobWorkItem} = require("./jobWorkItem.seeder.");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllJobWorkItemMasterAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await JobWorkItemMasterRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await JobWorkItemMasterRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Job Work Item Master")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Job Work Item Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await JobWorkItemMasterRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await JobWorkItemMasterRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Job Work Item Master has been")
        });
    } catch (e) {
        console.error("update Job Work Item Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await JobWorkItemMasterRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Job Work Item Master")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Job Work Item Master");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Job Work Item Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await JobWorkItemMasterRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Job Work Item Master");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Job Work Item Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const options = await dropDownOptions(req.user.company);
        let autoIncValues = {};
        if (options.itemCategories.length > 0) {
            for (const ele of options.itemCategories) {
                autoIncValues[ele.category] = getIncrementNumWithPrefix({
                    modulePrefix: ele.prefix,
                    autoIncrementValue: ele.nextAutoIncrement,
                    digit: ele.digit
                });
            }
            options.itemCategories = options.itemCategories.map(x => {
                return {label: x.label, value: x.category};
            });
        }
        let WXLDimensionsUnit = await getAllModuleMaster(req.user.company, "WXL_DIMENSIONS_UNIT");
        return res.success({
            autoIncValues,
            WXLDimensionsUnit: WXLDimensionsUnit?.map(x => x.value),
            ...options
        });
    } catch (error) {
        console.error("getAllMasterData Job Work Item Master", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const dropDownOptions = async company => {
    try {
        const QCLevelsOptions = await getAllModuleMaster(company, "QUALITY_CONTROL_LEVEL");
        const HSNCodesList = await filteredHSNList([
            {$match: {company: ObjectId(company), isActive: "Y"}},
            {$sort: {createdAt: -1}},
            {
                $project: {
                    label: {$concat: ["$hsnCode", "$goodsDescription"]},
                    value: "$hsnCode",
                    hsnCode: 1,
                    goodsDescription: 1,
                    gstRate: 1,
                    igstRate: 1,
                    cgstRate: 1,
                    sgstRate: 1,
                    ugstRate: 1
                }
            }
        ]);
        const itemCategories = await getAllProdItemCategory([
            {
                $match: {
                    type: PROD_ITEM_CATEGORY_TYPE.JW_ITEM,
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ]);
        return {
            QCLevelsOptions,
            HSNCodesList,
            itemCategories
        };
    } catch (error) {
        console.error(error);
    }
};
exports.checkJobWorkItemsValidation = async (jobWorkItemData, column, company) => {
    try {
        const jobWorkItemOptions = await JobWorkItemMasterRepository.filteredJobWorkItemMasterList([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {
                    jobWorkItemName: 1,
                    jobWorkItemDescription: 1
                }
            }
        ]);
        const requiredFields = [
            "itemCategory",
            "jobWorkItemName",
            "jobWorkItemDescription",
            "primaryUnit",
            "shelfLife",
            "HSNCode",
            "QCLevels"
        ];
        let unitJsonMap = unitJson.map(x => {
            return {
                label: x.label,
                value: x.value
            };
        });
        const falseArr = OPTIONS.falsyArray;
        let {QCLevelsOptions, HSNCodesList, itemCategories} = await dropDownOptions(company);
        let dropdownCheck = [
            {
                key: "itemCategory",
                options: itemCategories.map(x => {
                    return {
                        label: x.category,
                        value: x.category
                    };
                })
            },
            {
                key: "BOMLevel",
                options: PRODUCTION_ITEMS_OPTION.BOM_LEVEL_OPTIONS
            },
            {
                key: "QCLevels",
                options: QCLevelsOptions
            },
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
                key: "HSNCode",
                options: HSNCodesList.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            }
        ];

        for await (const x of jobWorkItemData) {
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
                for (const ele of jobWorkItemOptions) {
                    if (
                        ele.jobWorkItemName == x["jobWorkItemName"] &&
                        ele.itemDescription == x["jobWorkItemDescription"]
                    ) {
                        x.isValid = false;
                        x.message = `${x["jobWorkItemName"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = jobWorkItemData.filter(x => !x.isValid);
        const validRecords = jobWorkItemData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};
exports.bulkInsertJobWorkItemsByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        const HSNCodesList = await filteredHSNList([
            {$match: {company: ObjectId(company), isActive: "Y"}},
            {
                $project: {
                    HSN: "$_id",
                    HSNCode: "$hsnCode",
                    gstRate: 1,
                    igstRate: 1,
                    cgstRate: 1,
                    sgstRate: 1,
                    ugstRate: 1
                }
            }
        ]);
        let jobWorkItemData = jsonData.map(x => {
            const HSNObj = HSNCodesList.find(ele => ele.HSNCode == x.HSNCode);
            if (HSNObj) {
                x.HSN = HSNObj.HSN;
                x.gst = HSNObj.gstRate;
                x.igst = HSNObj.igstRate;
                x.sgst = HSNObj.cgstRate;
                x.cgst = HSNObj.sgstRate;
                x.ugst = HSNObj.ugstRate;
            }
            x.orderInfoUOM = x.primaryUnit;
            if (x.secondaryUnit == "-") {
                x.primaryToSecondaryConversion = null;
            }
            x.company = company;
            x.createdBy = createdBy;
            x.updatedBy = updatedBy;
            return x;
        });
        for await (const item of jobWorkItemData) {
            await JobWorkItemMasterRepository.createDoc(item);
        }
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

exports.getAllJWItemForStockLevels = asyncHandler(async (req, res) => {
    try {
        const itemCategories = await getAllProdItemCategory([
            {
                $match: {
                    type: PROD_ITEM_CATEGORY_TYPE.JW_ITEM,
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ]);
        const {filterBy = null, filterByCategory = null} = req.query;
        let project = getAllJWItemForStockLevelAttributes();
        let pipeline = [
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(req.user.company),
                    ...(!!filterByCategory && {
                        itemCategory: filterByCategory
                    })
                }
            },
            {
                $addFields: {
                    status: {
                        $cond: [
                            {
                                $and: ["$JWItemStockLevels.reorderLevel", "$JWItemStockLevels.reorderLevel"]
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
                    })
                }
            }
        ];
        let rows = await JobWorkItemMasterRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        activeItems: {$sum: 1},
                        itemWithSLData: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.ACTIVE]}, 1, 0]}},
                        itemWithoutSLData: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.INACTIVE]}, 1, 0]}}
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
                {label: "Active JW Items Count", count: rows?.totalAmounts?.activeItems ?? 0},
                {label: "Total JW Items with SL data", count: rows?.totalAmounts?.itemWithSLData ?? 0},
                {label: "Total JW Items without SL Data", count: rows?.totalAmounts?.itemWithoutSLData ?? 0}
            ],
            itemCategories,
            statusOptions: [
                {label: "Summary By JW Item Code Category (CAT)", value: ""},
                {label: "Summary by Status - Red", value: OPTIONS.defaultStatus.INACTIVE},
                {label: "Summary by Status - Green", value: OPTIONS.defaultStatus.ACTIVE}
            ]
        });
    } catch (e) {
        console.error("getAllForStockLevels items", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllForHSN = asyncHandler(async (req, res) => {
    try {
        const itemCategories = await getAllProdItemCategory([
            {
                $match: {
                    type: PROD_ITEM_CATEGORY_TYPE.JW_ITEM,
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ]);
        const {filterBy = null, filterByCategory = null} = req.query;
        let project = getAllForHSNAttributes();
        let pipeline = [
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(req.user.company),
                    ...(!!filterByCategory && {
                        itemCategory: filterByCategory
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
                $sort: {jobWorkItemCode: 1}
            }
        ];
        let rows = await JobWorkItemMasterRepository.getAllReportsPaginate({
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
            HSNCodesOptions,
            statusArray: [
                {label: "Active JW Items Count", count: rows?.totalAmounts?.activeItems ?? 0},
                {label: "Total JW Items with HSN Count", count: rows?.totalAmounts?.itemLinkedData ?? 0},
                {label: "Total JW Items without HSN Count", count: rows?.totalAmounts?.itemUnlinkedData ?? 0}
            ],
            itemCategories,
            statusOptions: [
                {label: "Summary By JW Item Code Category (CAT)", value: ""},
                {label: "Summary by Status - Red", value: OPTIONS.defaultStatus.INACTIVE},
                {label: "Summary by Status - Green", value: OPTIONS.defaultStatus.ACTIVE}
            ]
        });
    } catch (e) {
        console.error("getAllForHSN items", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllCopyMasterData = asyncHandler(async (req, res) => {
    try {
        const {filterByCategory = null} = req.query;
        const itemsList = await JobWorkItemMasterRepository.filteredJobWorkItemMasterList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE,
                    ...(!!filterByCategory && {
                        itemCategory: filterByCategory
                    })
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
                    jobWorkItem: "$_id",
                    jobWorkItemCode: 1,
                    jobWorkItemName: 1,
                    jobWorkItemDescription: 1,
                    HSNCode: 1,
                    UOM: "$orderInfoUOM",
                    itemCategory: "$itemCategory"
                }
            }
        ]);
        const itemCategories = await getAllProdItemCategory([
            {
                $match: {
                    type: PROD_ITEM_CATEGORY_TYPE.JW_ITEM,
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ]);
        return res.success({itemCategoriesOptions: itemCategories, itemsList});
    } catch (error) {
        console.error("getAllCopyFlowMasterData Prod Item", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.createCopy = asyncHandler(async (req, res) => {
    try {
        let existingData = await JobWorkItemMasterRepository.findOneDoc({_id: req.body.item});
        if (!existingData) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("JW Item");
            return res.unprocessableEntity(errors);
        }
        for (const ele of req.body.itemsArray) {
            await JobWorkItemMasterRepository.findAndUpdateDoc(
                {_id: ele.jobWorkItem},
                {
                    HSN: existingData?.HSN,
                    HSNCode: existingData?.HSNCode,
                    revisionInfo: req.body.revisionInfo,
                    revisionHistory: [
                        {
                            jobWorkItemCode: existingData?.jobWorkItemCode,
                            jobWorkItemName: existingData?.jobWorkItemName,
                            jobWorkItemDescription: existingData?.jobWorkItemDescription,
                            orderInfoUOM: existingData?.orderInfoUOM,
                            itemCategory: existingData?.itemCategory,
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
            message: MESSAGES.apiSuccessStrings.ADDED("JW Item")
        });
    } catch (e) {
        console.error("create JW Item ", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

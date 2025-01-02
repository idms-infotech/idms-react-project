const asyncHandler = require("express-async-handler");
const {getAllSKUAttributes} = require("../../../../models/sales/helpers/SKUMasterHelper");
const {ObjectId} = require("../../../../../config/mongoose");
const SKUMasterRepository = require("../../../../models/sales/repository/SKUMasterRepository");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getAllProdItemsListForBOM, getAllInkList} = require("../../planning/prodItemMaster/prodItemMaster");
const {getAllItemsForBOM} = require("../../purchase/items/items");
const {getAllCheckedItemCategoriesList} = require("../../purchase/itemCategoryMaster/itemCategoryMaster");
// const {getAllInkList} = require("../../production/inkMaster/inkMaster");
const {SKU_MASTER_DIMENSIONS_UNITS, STOCK_PREP_UOM} = require("../../../../mocks/constantData");
const ItemRepository = require("../../../../models/purchase/repository/itemRepository");
const ProdItemRepository = require("../../../../models/planning/repository/prodItemRepository");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
const InkMasterRepository = require("../../../../models/production/repository/inkMasterRepository");
exports.getAllForAttributes = asyncHandler(async (req, res) => {
    try {
        const {type = "Dimensions"} = req.query;
        let project = getAllSKUAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isActive: "A"
                }
            },
            {
                $addFields: {
                    SKUAttributesStatus: {
                        $cond: [
                            {$eq: [type, "Dimensions"]},
                            "$SKUDimStatus",
                            {$cond: [{$eq: [type, "Materials"]}, "$SKUMaterialStatus", "$SKUInkStatus"]}
                        ]
                    }
                }
            }
        ];
        let rows = await SKUMasterRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        activeSKUCount: {$sum: 1},
                        SKUDimIntegratedCount: {
                            $sum: {$cond: [{$eq: ["$SKUAttributesStatus", OPTIONS.defaultStatus.ACTIVE]}, 1, 0]}
                        },
                        SKUDimUnIntegratedCount: {
                            $sum: {$cond: [{$eq: ["$SKUAttributesStatus", OPTIONS.defaultStatus.INACTIVE]}, 1, 0]}
                        },
                        SKUDMSIntegratedCount: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            {$eq: ["$SKUDimStatus", OPTIONS.defaultStatus.ACTIVE]},
                                            {$eq: ["$SKUMaterialStatus", OPTIONS.defaultStatus.ACTIVE]},
                                            {$eq: ["$SKUInkStatus", OPTIONS.defaultStatus.ACTIVE]}
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        SKUDMSUnIntegratedCount: {
                            $sum: {
                                $cond: [
                                    {
                                        $or: [
                                            {$eq: ["$SKUDimStatus", OPTIONS.defaultStatus.INACTIVE]},
                                            {$eq: ["$SKUMaterialStatus", OPTIONS.defaultStatus.INACTIVE]},
                                            {$eq: ["$SKUInkStatus", OPTIONS.defaultStatus.INACTIVE]}
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
                        _id: 0
                    }
                }
            ]
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAllForAttributes", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getByIdForSKUDimAttributes = asyncHandler(async (req, res) => {
    try {
        let existing = await SKUMasterRepository.getDocById(req.params.id, {dimensionsDetails: 1});
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getByIdForSKUDimAttributes SKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getByIdForSKUMaterialAttributes = asyncHandler(async (req, res) => {
    try {
        let existing = await SKUMasterRepository.getDocById(req.params.id, {
            dimensionsDetails: 1,
            materialInfo: 1,
            SKUMaterialStatus: 1
        });
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU");
            return res.unprocessableEntity(errors);
        }
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            stockPreparation: true
        });
        itemCategoriesList = itemCategoriesList.map(x => x.category);
        let materialList = await getAllItemsForBOM(req.user.company, itemCategoriesList, {
            item: "$_id",
            referenceModel: "Items",
            itemCode: 1,
            itemName: 1,
            itemDescription: 1,
            UoM: "$UOM",
            qtyPerSKUUnit: {$literal: 0},
            isSelect: {$literal: false},
            unitCost: {
                $ifNull: [
                    {
                        $cond: [
                            {$and: [{$eq: ["$purchaseRateCommon.unit2", "$UOM"]}, "$purchaseRateCommon.rate2"]},
                            "$purchaseRateCommon.rate2",
                            "$purchaseRateCommon.rate1"
                        ]
                    },
                    0
                ]
            },
            // primaryUnit: 1,
            // secondaryUnit: 1,
            _id: 0
        });
        return res.success({
            materialList,
            SKUData: existing,
            status: [OPTIONS.defaultStatus.IN_PROGRESS, OPTIONS.defaultStatus.COMPLETED]
        });
    } catch (e) {
        console.error("getByIdForSKUMaterialAttributes", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.createCopyForSKUDimAttributes = asyncHandler(async (req, res) => {
    try {
        let SKUDimData = await SKUMasterRepository.findOneDoc(
            {_id: req.body.SKU},
            {
                dimensionsDetails: 1
            }
        );
        for await (const ele of req.body.SKUArray) {
            if (SKUDimData) {
                await SKUMasterRepository.findAndUpdateDoc(
                    {_id: ele._id},
                    {
                        dimensionsDetails: SKUDimData.dimensionsDetails,
                        SKUDimStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                );
            }
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("SKU Dim")
        });
    } catch (e) {
        console.error("create SKU Dim", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSKUDimExcel = asyncHandler(async (req, res) => {
    try {
        let rows = await SKUMasterRepository.filteredSKUMasterList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isActive: "A"
                }
            },
            {
                $project: {
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    primaryUnit: 1,
                    productCategory: 1,
                    SKUStage: 1,
                    SKUDimStatus: {$ifNull: ["$SKUDimStatus", "Inactive"]},
                    actualUnit: "$dimensionsDetails.actualDimensions.unit",
                    actualWidth: "$dimensionsDetails.actualDimensions.width",
                    actualLength: "$dimensionsDetails.actualDimensions.length",
                    actualUps: "$dimensionsDetails.actualDimensions.ups",
                    actualMSqArea: "$dimensionsDetails.actualDimensions.mSqArea",
                    layoutUnit: "$dimensionsDetails.layoutDimensions.unit",
                    layoutWidth: "$dimensionsDetails.layoutDimensions.width",
                    layoutLength: "$dimensionsDetails.layoutDimensions.length",
                    layoutUps: "$dimensionsDetails.layoutDimensions.ups",
                    layoutMSqArea: "$dimensionsDetails.layoutDimensions.mSqArea"
                }
            },
            {
                $sort: {
                    SKUNo: -1
                }
            }
        ]);
        return res.success(rows);
    } catch (e) {
        console.error("getAllSKUDimExcel", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.createCopyForSKUMaterialsAttributes = asyncHandler(async (req, res) => {
    try {
        let SKUMaterialsData = await SKUMasterRepository.findOneDoc(
            {_id: req.body.SKU},
            {
                materialInfo: 1
            }
        );
        for await (const ele of req.body.SKUArray) {
            if (SKUMaterialsData) {
                await SKUMasterRepository.findAndUpdateDoc(
                    {_id: ele._id},
                    {
                        materialInfo: SKUMaterialsData.materialInfo,
                        SKUMaterialStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                );
            }
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("SKU Dim")
        });
    } catch (e) {
        console.error("create SKU Dim", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllForCopyAttributes = asyncHandler(async (req, res) => {
    try {
        const {type = "Dimensions"} = req.query;
        let rows = await SKUMasterRepository.filteredSKUMasterList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isActive: "A"
                }
            },
            {
                $addFields: {
                    SKUAttributesStatus: {
                        $cond: [
                            {$eq: [type, "Dimensions"]},
                            "$SKUDimStatus",
                            {$cond: [{$eq: [type, "Materials"]}, "$SKUMaterialStatus", "$SKUInkStatus"]}
                        ]
                    }
                }
            },
            {
                $match: {
                    $or: [
                        {SKUAttributesStatus: OPTIONS.defaultStatus.INACTIVE},
                        {SKUAttributesStatus: {$exists: false}}
                    ]
                }
            },
            {
                $project: {
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    primaryUnit: 1,
                    productCategory: 1,
                    SKUStage: 1
                }
            }
        ]);
        return res.success(rows);
    } catch (e) {
        console.error("getAllForAttributes", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getByIdForSKUInkAttributes = asyncHandler(async (req, res) => {
    try {
        let existing = await SKUMasterRepository.getDocById(req.params.id, {
            inkDetails: 1,
            dimensionsDetails: 1,
            SKUInkStatus: 1,
            totalNoOfColors: 1
        });
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU");
            return res.unprocessableEntity(errors);
        }
        const inkList = await getAllInkList(req.user.company);
        return res.success({
            inkList,
            SKUData: existing,
            status: [OPTIONS.defaultStatus.IN_PROGRESS, OPTIONS.defaultStatus.COMPLETED]
        });
    } catch (e) {
        console.error("getByIdForSKUDimAttributes SKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.createCopyForSKUInkAttributes = asyncHandler(async (req, res) => {
    try {
        let SKUInkData = await SKUMasterRepository.findOneDoc(
            {_id: req.body.SKU},
            {
                inkDetails: 1,
                totalNoOfColors: 1
            }
        );
        for await (const ele of req.body.SKUArray) {
            if (SKUInkData) {
                await SKUMasterRepository.findAndUpdateDoc(
                    {_id: ele._id},
                    {
                        inkDetails: SKUInkData.inkDetails,
                        totalNoOfColors: SKUInkData.totalNoOfColors,
                        SKUInkStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                );
            }
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("SKU Ink")
        });
    } catch (e) {
        console.error("create SKU Ink", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.checkSKUDimensionValidation = async (dimensionData, column, company) => {
    try {
        const SKUOptions = await SKUMasterRepository.filteredSKUMasterList([
            {$match: {company: ObjectId(company), isActive: "A"}},
            {$project: {SKUNo: 1}}
        ]);
        let dropdownCheck = [
            {
                key: "unit",
                options: SKU_MASTER_DIMENSIONS_UNITS.getAllSKUMasterDimensionsUnit().map(x => {
                    return {
                        label: x,
                        value: x
                    };
                })
            }
        ];
        for await (const x of dimensionData) {
            x.isValid = true;
            x.message = null;
            for (const ele of Object.values(column)) {
                for (const dd of dropdownCheck) {
                    if (ele == dd.key && !dd.options.map(values => values.value).includes(x[ele])) {
                        x.isValid = false;
                        x.message = `${ele} is Invalid Value & Value Must be ${dd.options.map(values => values.value)}`;
                        break;
                    }
                }
                for (const ele of SKUOptions) {
                    if (ele.SKUNo != x["SKUNo"]) {
                        x.isValid = false;
                        x.message = `${x["SKUNo"]} not exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = dimensionData.filter(x => !x.isValid);
        const validRecords = dimensionData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};
exports.bulkInsertSKUDimByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        let SKUDimData = jsonData.map(x => {
            const {
                actualUnit,
                actualWidth,
                actualLength,
                actualUps,
                actualArea,
                actualMSqArea,
                layoutUnit,
                layoutWidth,
                layoutLength,
                layoutUps,
                layoutArea,
                layoutMSqArea,
                wastePercentage,
                ...rest
            } = x;
            let details = {
                actualDimensions: {
                    unit: actualUnit,
                    width: actualWidth,
                    length: actualLength,
                    ups: actualUps,
                    area: actualArea,
                    mSqArea: actualMSqArea
                },
                layoutDimensions: {
                    unit: layoutUnit,
                    width: layoutWidth,
                    length: layoutLength,
                    ups: layoutUps,
                    area: layoutArea,
                    mSqArea: layoutMSqArea,
                    wastePercentage: wastePercentage
                }
            };
            rest.dimensionsDetails = details;
            rest.company = company;
            rest.createdBy = createdBy;
            rest.updatedBy = updatedBy;
            return rest;
        });
        for (const SKU of SKUDimData) {
            await SKUMasterRepository.findAndUpdateDoc(
                {
                    SKUNo: SKU.SKUNo
                },
                {
                    $set: {
                        dimensionsDetails: SKU.dimensionsDetails,
                        SKUDimStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                }
            );
        }
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

exports.checkSKUMaterialValidation = async (materialData, column, company) => {
    try {
        const SKUOptions = await SKUMasterRepository.filteredSKUMasterList([
            {$match: {company: ObjectId(company), isActive: "A"}},
            {$project: {SKUNo: 1}}
        ]);
        const requiredFields = [
            "SKUNo",
            "itemCode",
            "itemName",
            "itemDescription",
            "UoM",
            "primaryUnit",
            "secondaryUnit",
            "width",
            "length",
            "widthUnit",
            "lengthUnit",
            "primaryToSecondaryConversion",
            "qtyPerSKUUnit",
            "ups"
        ];
        const falseArr = OPTIONS.falsyArray;
        let dropdownCheck = [
            {
                key: "widthUnit",
                options: SKU_MASTER_DIMENSIONS_UNITS.getAllSKUMasterDimensionsUnit().map(x => {
                    return {
                        label: x,
                        value: x
                    };
                })
            },
            {
                key: "lengthUnit",
                options: SKU_MASTER_DIMENSIONS_UNITS.getAllSKUMasterDimensionsUnit().map(x => {
                    return {
                        label: x,
                        value: x
                    };
                })
            },
            {
                key: "primaryUnit",
                options: STOCK_PREP_UOM.getStockUOM().map(x => {
                    return {
                        label: x,
                        value: x
                    };
                })
            },
            {
                key: "secondaryUnit",
                options: STOCK_PREP_UOM.getStockUOM().map(x => {
                    return {
                        label: x,
                        value: x
                    };
                })
            }
        ];
        for await (const x of materialData) {
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
                for (const ele of SKUOptions) {
                    if (ele.SKUNo != x["SKUNo"]) {
                        x.isValid = false;
                        x.message = `${x["SKUNo"]} not exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = materialData.filter(x => !x.isValid);
        const validRecords = materialData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertSKUMaterialByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        let missingItemCode = [];
        for (const ele of jsonData) {
            let itemObj = await ItemRepository.findOneDoc({itemCode: ele.itemCode});
            const SKUObj = await SKUMasterRepository.findOneDoc({SKUNo: ele.SKUNo});
            if (itemObj) {
                ele.item = itemObj._id;
                ele.referenceModel = "Items";
            } else {
                itemObj = await ProdItemRepository.findOneDoc({itemCode: ele.itemCode});
                if (itemObj) {
                    ele.item = itemObj._id;
                    ele.referenceModel = "ProductionItem";
                } else {
                    missingItemCode.push(ele.itemCode);
                }
            }

            if (SKUObj) {
                ele.layoutDimArea = SKUObj?.dimensionsDetails?.layoutDimensions?.mSqArea;
            }
        }
        let SKUMaterialData = jsonData.map(x => {
            const {
                itemCode,
                itemName,
                itemDescription,
                UoM,
                primaryUnit,
                secondaryUnit,
                width,
                length,
                widthUnit,
                lengthUnit,
                primaryToSecondaryConversion,
                qtyPerSKUUnit,
                ups,
                item,
                referenceModel,
                isSelect,
                layoutDimArea,
                ...rest
            } = x;
            let details = {
                itemCode,
                itemName,
                itemDescription,
                UoM,
                primaryUnit,
                secondaryUnit,
                width,
                length,
                widthUnit,
                lengthUnit,
                primaryToSecondaryConversion,
                qtyPerSKUUnit,
                ups,

                item,
                referenceModel,
                isSelect: true,

                childItemDescription: itemDescription,
                conversionOfUnits: `1 ${secondaryUnit ?? "Unit"} = ${primaryToSecondaryConversion ?? 1} ${
                    primaryUnit ?? "Unit"
                }`
            };
            rest.materialInfo = details;
            return rest;
        });
        for (const SKU of SKUMaterialData) {
            await SKUMasterRepository.findAndUpdateDoc(
                {
                    SKUNo: SKU.SKUNo
                },
                {
                    $push: {materialInfo: SKU.materialInfo},
                    $set: {
                        SKUMaterialStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                }
            );
        }
        return {message: "Updated successfully!"};
    } catch (error) {
        console.error(error);
    }
};

exports.checkSKUInkValidation = async (inkData, column, company) => {
    try {
        const SKUOptions = await SKUMasterRepository.filteredSKUMasterList([
            {$match: {company: ObjectId(company), isActive: "A"}},
            {$project: {SKUNo: 1}}
        ]);
        const requiredFields = [
            "colSeq",
            "itemCode",
            "itemName",
            "itemDescription",
            "UoM",
            "mesh",
            "GSM",
            "areaSqm",
            "inkArea",
            "inkAreaSqm",
            "ink"
        ];

        const falseArr = OPTIONS.falsyArray;
        let dropdownCheck = [];
        for await (const x of inkData) {
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
                for (const ele of SKUOptions) {
                    if (ele.SKUNo != x["SKUNo"]) {
                        x.isValid = false;
                        x.message = `${x["SKUNo"]} not exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = inkData.filter(x => !x.isValid);
        const validRecords = inkData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertSKUInkByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        let missingInkCode = [];
        for (const ele of jsonData) {
            let inkObj = await InkMasterRepository.findOneDoc({itemCode: ele.itemCode});
            if (inkObj) {
                ele.inkId = inkObj._id;
                ele.inkCostPerKg = inkObj.inkCostPerKg;
                ele.inkCostPerGm = inkObj.inkCostPerGm;
            } else {
                missingInkCode.push(ele.itemCode);
            }
        }
        let SKUMaterialData = jsonData.map(x => {
            const {
                inkId,
                inkCostPerKg,
                inkCostPerGm,
                SKUNo,
                colSeq,
                itemCode,
                itemName,
                itemDescription,
                UoM,
                mesh,
                GSM,
                areaSqm,
                inkArea,
                inkAreaSqm,
                ink,
                ...rest
            } = x;
            let details = {
                inkId,
                colSeq,
                itemCode,
                itemName,
                itemDescription,
                UoM,
                mesh,
                GSM,
                areaSqm,
                inkArea,
                inkAreaSqm,
                ink,
                inkCostPerKg,
                inkCostPerGm
            };
            rest.inkDetails = details;
            return rest;
        });
        for (const SKU of SKUMaterialData) {
            await SKUMasterRepository.findAndUpdateDoc(
                {
                    SKUNo: SKU.SKUNo
                },
                {
                    $push: {inkDetails: SKU.inkDetails},
                    $set: {
                        SKUMaterialStatus: OPTIONS.defaultStatus.ACTIVE
                    },
                    $inc: {
                        totalNoOfColors: 1
                    }
                }
            );
        }
        return {message: "Updated successfully!"};
    } catch (error) {
        console.error(error);
    }
};

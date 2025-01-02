const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/purchase/itemModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getIncrementNumWithPrefix,
    outputData,
    getAllAggregationFooter,
    removeFilesInError,
    removeFile,
    checkDomesticCustomer
} = require("../../../../helpers/utility");
const {getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {getAllSuppliers} = require("../suppliers/suppliers");
const {getHSNByCode} = require("../HSN/HSN");
const {default: mongoose} = require("mongoose");
const {getAllItemCategory} = require("../itemCategoryMaster/itemCategoryMaster");
const {getCurrentDate} = require("../../../../helpers/dateTime");
const {readExcel} = require("../../../../middleware/readExcel");
const updateColumn = require("../../../../mocks/excelUploadColumn/itemQCLevelKeys.json");
const ObjectId = mongoose.Types.ObjectId;
const {
    getAllItemAttributes,
    getAllItemExcelAttributes,
    getAllItemReportsAttributes,
    getAllForStockLevelAttributes
} = require("../../../../models/purchase/helpers/itemHelper");
const {filteredSupplierList} = require("../../../../models/purchase/repository/supplierRepository");
const {filteredHSNList} = require("../../../../models/purchase/repository/hsnRepository");
const ItemRepository = require("../../../../models/purchase/repository/itemRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
const {filteredChannelPartnerList} = require("../../../../models/purchase/repository/channelPartnerRepository");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {INK_MIXING_UOM, SALES_CATEGORY} = require("../../../../mocks/constantData");
const CompanyRepository = require("../../../../models/settings/repository/companyRepository");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {filteredSupplierCategoryList} = require("../../../../models/settings/repository/supplierCategoryRepository");
const {filteredCustomerCategoryList} = require("../../../../models/settings/repository/customerCategoryRepository");
const unitJson = require("../../../../mocks/unit.json");
const {filteredSubModuleManagementList} = require("../../../../models/settings/repository/subModuleRepository");
// @desc    getAll Items Record

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllItemAttributes();
        if (req.query.excel == "true") {
            project = getAllItemExcelAttributes();
        }
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $addFields: {
                    itemAMU: {$toString: "$itemAMU"},
                    itemROL: {$toString: "$itemROL"},
                    supplierDetails: {$first: "$supplierDetails"},
                    channelDetails: {$first: "$channelDetails"}
                }
            },
            {$unwind: {path: "$supplierDetails", preserveNullAndEmptyArrays: true}},
            {$unwind: {path: "$channelDetails", preserveNullAndEmptyArrays: true}}
        ];
        let rows = await ItemRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll items", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    create Items new Record
exports.create = asyncHandler(async (req, res) => {
    try {
        let existingUser = await ItemRepository.findOneDoc({
            itemName: req.body.itemName,
            itemDescription: req.body.itemDescription
        });
        if (existingUser) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("Item");
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        if (createdObj.supplierDetails) {
            createdObj.supplierDetails = JSON.parse(createdObj.supplierDetails);
        }
        if (createdObj.channelDetails) {
            createdObj.channelDetails = JSON.parse(createdObj.channelDetails);
        }
        if (createdObj.supplierDetailsForm) {
            createdObj.supplierDetailsForm = JSON.parse(createdObj.supplierDetailsForm);
        }
        if (createdObj.rmSpecifications) {
            createdObj.rmSpecifications = JSON.parse(createdObj.rmSpecifications);
        }
        if (createdObj.inventoryStockLevels) {
            createdObj.inventoryStockLevels = JSON.parse(createdObj.inventoryStockLevels);
        }
        if (createdObj.dualUnitsDimensionsDetails) {
            createdObj.dualUnitsDimensionsDetails = JSON.parse(createdObj.dualUnitsDimensionsDetails);
        }
        // if (createdObj.specificationInfo) {
        //     createdObj.specificationInfo = JSON.parse(createdObj.specificationInfo);
        // }
        if (req.files) {
            if (req.files.tdsFile && req.files.tdsFile.length > 0) {
                createdObj["tdsFile"] = req.files.tdsFile[0].filename;
            }
            if (req.files.msdsFile && req.files.msdsFile.length > 0) {
                createdObj["msdsFile"] = req.files.msdsFile[0].filename;
            }
            if (req.files.drawing && req.files.drawing.length > 0) {
                createdObj["drawing"] = req.files.drawing[0].filename;
            }
        }
        if (createdObj.unitConversionFlag == 1) {
            createdObj.secondaryToPrimaryConversion = null;
        } else {
            createdObj.primaryToSecondaryConversion = null;
        }
        const itemDetails = await ItemRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Items")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Items", e);
        if (req.files) {
            removeFilesInError(req.files.tdsFile);
            removeFilesInError(req.files.msdsFile);
            removeFilesInError(req.files.drawing);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update Items  Record
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ItemRepository.getDocById(req.params.id);
        itemDetails.updatedBy = req.user.sub;
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        if (req.body.supplierDetails) {
            req.body.supplierDetails = JSON.parse(req.body.supplierDetails);
        }
        if (req.body.channelDetails) {
            req.body.channelDetails = JSON.parse(req.body.channelDetails);
        }
        if (req.body.rmSpecifications) {
            req.body.rmSpecifications = JSON.parse(req.body.rmSpecifications);
        }
        if (req.body.inventoryStockLevels) {
            req.body.inventoryStockLevels = JSON.parse(req.body.inventoryStockLevels);
        }
        if (req.body.dualUnitsDimensionsDetails) {
            req.body.dualUnitsDimensionsDetails = JSON.parse(req.body.dualUnitsDimensionsDetails);
        }
        // if (req.body.specificationInfo) {
        //     req.body.specificationInfo = JSON.parse(req.body.specificationInfo);
        // }
        if (req.files) {
            if (req.files["tdsFile"] && req.files["tdsFile"].length > 0) {
                if (itemDetails.tdsFile) {
                    removeFile(`${req.files.tdsFile[0].destination}/${itemDetails.tdsFile}`);
                }
                itemDetails["tdsFile"] = req.files["tdsFile"][0].filename;
            }

            if (req.files["msdsFile"] && req.files["msdsFile"].length > 0) {
                if (itemDetails.msdsFile) {
                    removeFile(`${req.files.msdsFile[0].destination}/${itemDetails.msdsFile}`);
                }
                itemDetails["msdsFile"] = req.files["msdsFile"][0].filename;
            }
            if (req.files["drawing"] && req.files["drawing"].length > 0) {
                if (itemDetails.drawing) {
                    removeFile(`${req.files.drawing[0].destination}/${itemDetails.drawing}`);
                }
                itemDetails["drawing"] = req.files["drawing"][0].filename;
            }
        }
        if (req.body.unitConversionFlag == 1) {
            req.body.secondaryToPrimaryConversion = null;
        } else {
            req.body.primaryToSecondaryConversion = null;
        }
        if (req.body.secondaryUnit == "-") {
            req.body.primaryToSecondaryConversion = null;
            req.body.secondaryToPrimaryConversion = null;
        }
        itemDetails = await ItemRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Items has been")
        });
    } catch (e) {
        console.error("update Items", e);
        if (req.files) {
            removeFilesInError(req.files.tdsFile);
            removeFilesInError(req.files.msdsFile);
            removeFilesInError(req.files.drawing);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById Items Record
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Items")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Items");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Items", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById Items Record
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Items");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Items", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData Items Record
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const options = await dropDownOptions(req.user.company);

        let WXLDimensionsUnit = await getAllModuleMaster(req.user.company, "WXL_DIMENSIONS_UNIT");
        let stockLevelButtonCondition = await findAppParameterValue("STOCK_LEVEL_BUTTON_CHECK", req.user.company);
        const companyData = await CompanyRepository.getDocById(req.user.company, {companyType: 1});

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
        return res.success({
            companyType: companyData?.companyType,
            WXLDimensionsUnit: WXLDimensionsUnit?.map(x => x.value),
            stockLevelButtonCondition,
            featureConfig,
            ...options
        });
    } catch (error) {
        console.error("getAllMasterData Items", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const dropDownOptions = async company => {
    try {
        const channelPartnerOptions = await filteredChannelPartnerList([
            {$match: {company: ObjectId(company), isCPActive: "Active"}},
            {$sort: {channelPartnerName: 1}},
            {
                $addFields: {
                    billingAddress: {$arrayElemAt: ["$billingAddress", 0]}
                }
            },
            {
                $project: {
                    label: "$channelPartnerName",
                    value: "$_id",
                    channelPartnerName: 1,
                    CPCode: 1,
                    currency: 1,
                    channelPartnerCategory: 1,
                    channelBillingState: "$billingAddress.state",
                    channelBillingCity: "$billingAddress.city",
                    channelBillingPinCode: "$billingAddress.pinCode",
                    paymentTerms: 1
                }
            }
        ]);
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
        let itemCategories = await getAllItemCategory(company);
        let autoIncValues = {};
        let prefixValues = {};
        if (itemCategories.length > 0) {
            for (const ele of itemCategories) {
                autoIncValues[ele.category] = getIncrementNumWithPrefix({
                    modulePrefix: ele.prefix,
                    autoIncrementValue: ele.nextAutoIncrement,
                    digit: ele.digit
                });
                prefixValues[ele.category] = ele.prefix;
            }
        }
        itemCategories = itemCategories.map(x => x?.category);
        let supplierCategories = await filteredSupplierCategoryList([
            {
                $match: {
                    company: ObjectId(company),
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE,
                    externalProvider: true
                }
            },
            {$sort: {order: 1}}
        ]);
        if (!supplierCategories?.length) {
            supplierCategories = await getAllModuleMaster(company, "PURCHASE_TYPE");
            supplierCategories = supplierCategories.map(x => x.value);
            supplierCategories = await Promise.all(
                supplierCategories.map(async ele => {
                    const isDomestic = await checkDomesticCustomer(ele);
                    return {
                        category: ele,
                        categoryType: isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.IMPORTS
                    };
                })
            );
        } else {
            supplierCategories = supplierCategories.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType,
                    showMFR: x?.showMFR ?? false
                };
            });
        }
        let customerCategories = await filteredCustomerCategoryList([
            {
                $match: {
                    category: SALES_CATEGORY.JOB_WORK_PRINCIPAL,
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ]);
        if (customerCategories.length) {
            supplierCategories.push({
                category: SALES_CATEGORY.JOB_WORK_PRINCIPAL,
                categoryType: SALES_CATEGORY.JW,
                showMFR: true
            });
        }
        let purchaseRateTypeOptions = await getAllModuleMaster(company, "PURCHASE_RATE_TYPE");
        return {
            HSNCodesList,
            channelPartnerOptions,
            itemCategories,
            QCLevelsOptions,
            autoIncValues,
            prefixValues,
            supplierCategories,
            purchaseRateTypeOptions
        };
    } catch (error) {
        console.error(error);
    }
};

exports.getSuppliersByCategory = asyncHandler(async (req, res) => {
    try {
        let suppliersOptions = [];
        if (req.query.categoryType == SALES_CATEGORY.JW) {
            suppliersOptions = await filteredCustomerList([
                {
                    $match: {
                        company: ObjectId(req.user.company),
                        isCustomerActive: "A",
                        customerCategory: req.query.category
                    }
                },
                {$sort: {customerName: 1}},
                {
                    $addFields: {
                        customerBillingAddress: {$arrayElemAt: ["$customerBillingAddress", 0]}
                    }
                },
                {
                    $project: {
                        label: "$customerName",
                        value: "$_id",
                        currency: "$customerCurrency",
                        supplierCode: "$customerCode",
                        categoryType: 1,
                        referenceModel: "Customer",
                        supplierBillingState: "$customerBillingAddress.state",
                        supplierBillingCity: "$customerBillingAddress.city",
                        supplierBillingPinCode: "$customerBillingAddress.pinCode"
                    }
                }
            ]);
        } else {
            suppliersOptions = await filteredSupplierList([
                {
                    $match: {
                        company: ObjectId(req.user.company),
                        isSupplierActive: "A",
                        supplierPurchaseType: req.query.category
                    }
                },
                {$sort: {supplierName: 1}},
                {
                    $addFields: {
                        supplierBillingAddress: {$arrayElemAt: ["$supplierBillingAddress", 0]}
                    }
                },
                {
                    $project: {
                        label: "$supplierName",
                        value: "$_id",
                        currency: "$supplierCurrency",
                        supplierCode: 1,
                        supplierPurchaseType: 1,
                        categoryType: 1,
                        referenceModel: "Supplier",
                        supplierBillingState: "$supplierBillingAddress.state",
                        supplierBillingCity: "$supplierBillingAddress.city",
                        supplierBillingPinCode: "$supplierBillingAddress.pinCode"
                    }
                }
            ]);
        }
        return res.success({suppliersOptions});
    } catch (error) {
        console.error("getAllMasterData Items", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @desc    getAllItems Items Record
exports.getAllItems = async (company, project = {}) => {
    try {
        let rows = await Model.find(
            {
                isActive: "A",
                company: company
            },
            project
        )
            .sort({itemCode: -1})
            .populate(
                "supplierDetails.supplierId",
                "supplierCode supplierName supplierDescription supplierPurchaseType supplierCurrency itemCode itemName itemDescription"
            );
        return rows;
    } catch (e) {
        console.error("getAllItems", e);
    }
};
exports.getAllItemsCount = async company => {
    try {
        const count = await Model.countDocuments({
            isActive: "A",
            company: company
        });
        return count;
    } catch (error) {
        console.error("getAllItemsCount", error);
    }
};

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const suppliers = await getAllSuppliers(req.user.company, {supplierName: 1});
        const itemCategoryList = await getAllItemCategory(req.user.company);
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1,
            supplier = null,
            itemType = null
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!itemType && {
                itemType: itemType
            })
        };
        let project = getAllItemReportsAttributes();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([
            {
                $match: query
            },
            {$unwind: "$supplierDetails"},
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplierDetails.supplierId",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, supplierName: 1}}],
                    as: "supplierDetails.supplierId"
                }
            },
            {$unwind: "$supplierDetails.supplierId"},
            {
                $addFields: {
                    itemAMU: {$toString: "$itemAMU"},
                    itemROL: {$toString: "$itemROL"},
                    unitPrice: {$toString: "$supplierDetails.stdCostUom1"}
                }
            },
            {
                $match: {
                    ...(!!supplier && {
                        "supplierDetails.supplierId._id": ObjectId(supplier)
                    })
                }
            },
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            suppliers,
            itemCategories: itemCategoryList.map(x => x.category),
            ...outputData(rows)
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// exports.uploadItemFile = asyncHandler(async (req, res) => {
//     try {
//         let fname = req.file.filename;
//         let jsonData = await readExcel(fname, column);
//         const missingHSNCode = [];
//         const missingSupplierName = [];
//         const supplierList = await getAllSuppliers(req.user.company);
//         for (const ele of jsonData) {
//             const HSNObj = await getHSNByCode(ele.hsn);
//             if (HSNObj) {
//                 ele.gst = HSNObj.gstRate;
//                 ele.igst = HSNObj.igstRate;
//                 ele.sgst = HSNObj.cgstRate;
//                 ele.cgst = HSNObj.sgstRate;
//                 ele.ugst = HSNObj.ugstRate;
//                 ele.supplierId = null;
//                 for (const supp of supplierList) {
//                     if (supp.supplierName == ele.supplierName.trim()) {
//                         ele.supplierId = supp._id.valueOf();
//                     }
//                 }
//             } else {
//                 missingHSNCode.push(ele.hsn);
//             }
//             if (!ele.supplierName || !ele.supplierId) {
//                 missingSupplierName.push(ele.supplierName ? ele.supplierName : ele.itemName);
//             }
//         }
//         console.log("missingHSNCode", JSON.stringify(missingHSNCode));
//         console.log("missingSupplierName", JSON.stringify(missingSupplierName));
//         const arr = [];
//         let itemData = jsonData.map(x => {
//             const {supplierName, spin, supplierCurrency, stdCostUom1, supplierId, ...rest} = x;
//             let details = {
//                 supplierName,
//                 spin,
//                 supplierCurrency,
//                 stdCostUom1,
//                 supplierId
//             };
//             rest.supplierDetails = [details];
//             return rest;
//         });
//         let {itemArr, exitsItemArr} = await itemsUpload(itemData);
//         return res.success({message: "Uploaded successfully!", itemArr, exitsItemArr});
//     } catch (e) {
//         const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
//         res.serverError(errors);
//         throw new Error(e);
//     }
// });

exports.getAllItemsForBOM = async (company, categories, project = null) => {
    try {
        let projectObj = {
            reference: "$_id",
            referenceModel: "Items",
            itemCategoryJW9: 1,
            itemType: 1,
            // itemCode: {$ifNull: ["$supplierDetails.arbtCode", "$itemCode"]},
            itemCode: {$ifNull: ["$RMCode", "$itemCode"]},
            itemName: 1,
            itemDescription: 1,
            supplier: "$supplierDetails.supplierId._id",
            UOM: 1,
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
            partCount: {$literal: 0},
            itemCost: {$literal: 0},
            qtyPerSKUUnit: {$literal: 0},
            wastePercentage: {$literal: 0},
            refDesignator: {$literal: null},
            supplierPartNo: "$supplierDetails.spin",
            purchaseRateType: "$supplierDetails.purchaseRateType",
            BOM: "NA",
            type: "items",
            BOMLevel: "BLL",
            _id: 0
        };
        if (project) {
            projectObj = project;
        }
        let rows = await Model.aggregate([
            {
                $match: {
                    isActive: "A",
                    company: ObjectId(company),
                    itemType: {$in: categories}
                }
            },
            {
                $addFields: {
                    supplierDetails: {$first: "$supplierDetails"},
                    UOM: {
                        $cond: [
                            {$or: [{$not: ["$secondaryUnit"]}, {$eq: ["$secondaryUnit", "-"]}]},
                            "$orderInfoUOM",
                            "$secondaryUnit"
                        ]
                    }
                }
            },
            {
                $unwind: {
                    path: "$supplierDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    purchaseRateCommon: {$first: "$supplierDetails.purchaseRateCommon"}
                }
            },
            {
                $project: projectObj
            },
            {$sort: {itemCode: 1}}
        ]);
        return rows;
    } catch (e) {
        console.error("getAllItemsForBOM", e);
    }
};

exports.getAllItemsBySupplierId = asyncHandler(async (company, supplierId) => {
    try {
        let rows = await Model.aggregate([
            {
                $match: {
                    isActive: "A",
                    company: ObjectId(company)
                }
            },
            {
                $addFields: {
                    POQty: 0,
                    balancedQty: 0,
                    lineValue: 0,
                    linePPV: 0
                }
            },
            {
                $unwind: {
                    path: "$supplierDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    "supplierDetails.supplierId": ObjectId(supplierId)
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplierDetails.supplierId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                supplierName: 1,
                                supplierPurchaseType: 1,
                                supplierCurrency: 1,
                                supplierLeadTimeInDays: 1,
                                supplierPaymentTerms: 1
                            }
                        }
                    ],
                    as: "supplierData"
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "supplierDetails.supplierId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                supplierName: "$customerName",
                                supplierPurchaseType: "$customerCategory",
                                supplierCurrency: "$customerCurrency",
                                supplierLeadTimeInDays: null,
                                supplierPaymentTerms: "$customerPaymentTerms"
                            }
                        }
                    ],
                    as: "customerData"
                }
            },
            {
                $addFields: {
                    mergedData: {$concatArrays: ["$supplierData", "$customerData"]}
                }
            },
            {
                $unwind: {
                    path: "$mergedData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    unitConversion: "$conversionOfUnits",
                    item: "$_id",
                    POLineNumber: "$POLineNumber",
                    itemCode: 1,
                    name: "$itemName",
                    description: "$itemDescription",
                    UOM: {$ifNull: ["$orderInfoUOM", "$primaryUnit"]},
                    POQty: 1,
                    balancedQty: 1,
                    standardRate: "$supplierDetails.stdCostUom1",
                    purchaseRate: "$supplierDetails.stdCostUom1",
                    stdCostUom1: "$supplierDetails.stdCostUom1",
                    stdCostUom2: "$supplierDetails.stdCostUom2",
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    primaryToSecondaryConversion: {
                        $cond: [{$eq: ["$unitConversionFlag", 1]}, "$primaryToSecondaryConversion", null]
                    },
                    secondaryToPrimaryConversion: {
                        $cond: [{$eq: ["$unitConversionFlag", 2]}, "$secondaryToPrimaryConversion", null]
                    },
                    lineValue: 1,
                    linePPV: 1,
                    deliveryDate: getCurrentDate("YYYY-MM-DD"),
                    leadDeliveryDate: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: {
                                $cond: [
                                    {$not: ["$mergedData.supplierLeadTimeInDays"]},
                                    new Date(),
                                    {
                                        $dateAdd: {
                                            startDate: new Date(),
                                            unit: "day",
                                            amount: {$toInt: "$mergedData.supplierLeadTimeInDays"}
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    gst: 1,
                    igst: 1,
                    cgst: 1,
                    sgst: 1,
                    ugst: 1,
                    _id: 0,
                    purchaseRateType: "$supplierDetails.purchaseRateType",
                    purchaseRateCommon: "$supplierDetails.purchaseRateCommon"
                }
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllItemsBySupplierId", e);
    }
});

exports.updateItemByFile = asyncHandler(async (req, res) => {
    try {
        let fname = req.file.filename;
        let jsonData = await readExcel(fname, updateColumn);
        let nonUpdatedItemCode = [];
        for (const ele of jsonData) {
            let existing = await Model.findOne({itemCode: ele.itemCode, itemType: ele.itemType});
            if (existing && ["L1", "L2", "L3", "L4"].includes(ele.QCLevels)) {
                existing.QCLevels = ele.QCLevels;
                await existing.save();
            } else {
                nonUpdatedItemCode.push(ele.itemCode);
            }
        }
        return res.success({message: "Updated successfully!", nonUpdatedItemCode});
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        throw new Error(e);
    }
});

exports.getAllItemsForFormulationInk = async (company, itemCategoriesList) => {
    try {
        let rows = await Model.aggregate([
            {
                $match: {
                    isActive: "A",
                    company: ObjectId(company),
                    itemType: {$in: itemCategoriesList},
                    orderInfoUOM: {$in: INK_MIXING_UOM.getInkMixingUOM()}
                }
            },
            {
                $addFields: {
                    supplierDetails: {$arrayElemAt: ["$supplierDetails", 0]}
                }
            },
            {
                $project: {
                    seq: null,
                    item: "$_id",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    ratePerUnit: {
                        $cond: [
                            {
                                $and: [
                                    {
                                        $eq: ["$supplierDetails.uom2", INK_MIXING_UOM.GRAM]
                                    },
                                    {$ne: [{$type: "$supplierDetails.stdCostUom2"}, "missing"]}
                                ]
                            },
                            "$supplierDetails.stdCostUom2",
                            {
                                $cond: [
                                    {
                                        $in: ["$orderInfoUOM", [INK_MIXING_UOM.LTR, INK_MIXING_UOM.KG]]
                                    },
                                    {$divide: ["$supplierDetails.stdCostUom1", 1000]},
                                    "$supplierDetails.stdCostUom1"
                                ]
                            }
                        ]
                    },

                    UoM: "g",
                    referenceModel: "Items",
                    qtyPerKgInitial: {$literal: 0},
                    percentageLoading: {$literal: 0},
                    qtyPerKgFinal: {$literal: 0},
                    itemCost: {$literal: 0}
                }
            },
            {$sort: {itemCode: 1}}
        ]);
        return rows;
    } catch (e) {
        console.error("getAllItemsForFormulationInk", e);
    }
};

exports.checkItemsValidation = async (itemsData, column, company) => {
    try {
        const itemsOptions = await ItemRepository.filteredItemList([
            {
                $match: {
                    isActive: "A",
                    company: ObjectId(company)
                }
            },
            {
                $project: {
                    itemName: 1,
                    itemDescription: 1
                }
            }
        ]);
        let suppliersOptions = await filteredSupplierList([
            {$match: {company: ObjectId(company)}},
            {
                $project: {
                    supplierCode: 1
                }
            }
        ]);
        const requiredFields = [
            "itemType",
            "itemCode",
            "itemName",
            "itemDescription",
            "isActive",
            "primaryUnit",
            "secondaryUnit",
            "hsn",
            "shelfLife",
            "QCLevels",
            "supplierCode",
            "purchaseRateType",
            "supplierCategory"
        ];
        const falseArr = OPTIONS.falsyArray;
        let {
            HSNCodesList,
            channelPartnerOptions,
            itemCategories,
            QCLevelsOptions,
            autoIncValues,
            prefixValues,
            supplierCategories,
            purchaseRateTypeOptions
        } = await dropDownOptions(company);
        unitJson.push({
            value: "-",
            label: "-"
        });
        let dropdownCheck = [
            {
                key: "itemType",
                options: itemCategories.map(x => {
                    return {
                        label: x,
                        value: x
                    };
                })
            },
            {
                key: "purchaseRateType",
                options: [
                    {label: "Standard", value: "Standard"},
                    {label: "Volume Based", value: "Volume Based"}
                ]
            },
            {
                key: "primaryUnit",
                options: unitJson.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            },
            {
                key: "secondaryUnit",
                options: unitJson.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            },
            {
                key: "hsn",
                options: HSNCodesList.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            },
            {
                key: "QCLevels",
                options: QCLevelsOptions
            },
            {
                key: "referenceModel",
                options: [
                    {label: "Customer", value: "Customer"},
                    {label: "Supplier", value: "Supplier"}
                ]
            },
            {
                key: "supplierCode",
                options: suppliersOptions.map(x => {
                    return {
                        label: x.supplierCode,
                        value: x.supplierCode
                    };
                })
            }
        ];
        for await (const x of itemsData) {
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
                for (const ele of itemsOptions) {
                    if (ele.itemName == x["itemName"] && ele.itemDescription == x["itemDescription"]) {
                        x.isValid = false;
                        x.message = `${x["itemName"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = itemsData.filter(x => !x.isValid);
        const validRecords = itemsData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};
exports.bulkInsertItemsByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        const supplierList = await getAllSuppliers(company, {
            supplierCode: 1,
            supplierName: 1,
            categoryType: 1,
            _id: 1,
            supplierPurchaseType: 1,
            supplierCurrency: 1
        });
        let missingHSNCode = [];
        let missingSupplierName = [];
        for (const ele of jsonData) {
            ele.orderInfoUOM = ele.primaryUnit;
            const HSNObj = await getHSNByCode(ele.hsn);
            if (HSNObj) {
                ele.gst = HSNObj.gstRate;
                ele.igst = HSNObj.igstRate;
                ele.sgst = HSNObj.cgstRate;
                ele.cgst = HSNObj.sgstRate;
                ele.ugst = HSNObj.ugstRate;
                ele.supplierId = null;
                for (const supp of supplierList) {
                    if (supp.supplierCode == ele.supplierCode.trim()) {
                        ele.supplierId = supp._id.valueOf();
                        ele.supplierCategory = supp.supplierPurchaseType;
                        ele.supplierName = supp.supplierName;
                        ele.supplierCurrency = supp.supplierCurrency;
                        ele.categoryType = supp.categoryType;
                    }
                }
            } else {
                missingHSNCode.push(ele.hsn);
            }
            if (!ele.supplierName || !ele.supplierId) {
                missingSupplierName.push(ele.supplierName ? ele.supplierName : ele.itemName);
            }
        }
        let itemData = jsonData.map(x => {
            const {
                supplierCategory,
                categoryType,
                referenceModel,
                supplierName,
                spin,
                purchaseRateCommon,
                supplierCurrency,
                stdCostUom1,
                supplierId,
                maxConsumptionPerDay,
                minConsumptionPerDay,
                avgConsumptionPerDay,
                supplyLeadTime,
                inventoryTurnoverCycle,
                noOfOrdersPerCycle,
                MOQ1,
                rate1,
                rate2,
                MOQ2,
                rate3,
                MOQ3,
                purchaseRateType,
                manufacturerName,
                ...rest
            } = x;
            let details = {
                manufacturerName,
                supplierCategory,
                categoryType,
                supplierName,
                referenceModel,
                spin,
                supplierCurrency,
                supplierId,
                purchaseRateType: purchaseRateType,
                purchaseRateCommon
            };
            let secondaryUnitExists = rest?.secondaryUnit == "-" ? false : true;
            details.purchaseRateCommon = [
                {
                    currency: supplierCurrency,
                    unit1: rest?.primaryUnit,
                    MOQ1: MOQ1,
                    rate1: rate1,
                    unit2: secondaryUnitExists ? rest?.secondaryUnit : null,
                    MOQ2: secondaryUnitExists ? +(MOQ1 * rest?.primaryToSecondaryConversion).toFixed(2) : 0,
                    rate2: secondaryUnitExists ? +(rate1 / rest?.primaryToSecondaryConversion).toFixed(2) : 0
                }
            ];
            if (rate2 && MOQ2) {
                details.purchaseRateCommon.push({
                    currency: supplierCurrency,
                    unit1: rest?.primaryUnit,
                    MOQ1: MOQ2,
                    rate1: rate2,
                    unit2: secondaryUnitExists ? rest?.secondaryUnit : null,
                    MOQ2: secondaryUnitExists ? +(MOQ2 * rest.primaryToSecondaryConversion).toFixed(2) : 0,
                    rate2: secondaryUnitExists ? +(rate2 / rest.primaryToSecondaryConversion).toFixed(2) : 0
                });
            }
            if (rate3 && MOQ3) {
                details.purchaseRateCommon.push({
                    currency: supplierCurrency,
                    unit1: rest?.primaryUnit,
                    MOQ1: MOQ3,
                    rate1: rate3,
                    unit2: secondaryUnitExists ? rest?.secondaryUnit : null,
                    MOQ2: secondaryUnitExists ? +(MOQ3 * rest.primaryToSecondaryConversion).toFixed(2) : 0,
                    rate2: secondaryUnitExists ? +(rate3 / rest.primaryToSecondaryConversion).toFixed(2) : 0
                });
            }
            rest.supplierDetails = [details];
            rest.inventoryStockLevels = {
                maxConsumptionPerDay,
                minConsumptionPerDay,
                avgConsumptionPerDay,
                supplyLeadTime,
                inventoryTurnoverCycle,
                noOfOrdersPerCycle
            };

            rest.company = company;
            rest.createdBy = createdBy;
            rest.updatedBy = updatedBy;
            return rest;
        });
        // console.info("itemData", JSON.stringify(itemData));

        for await (const item of itemData) {
            await ItemRepository.createDoc(item);
        }
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

exports.getAllForStockLevels = asyncHandler(async (req, res) => {
    try {
        let itemCategories = await getAllItemCategory(req.user.company);
        let autoIncValues = {};
        let prefixValues = {};
        if (itemCategories.length > 0) {
            for (const ele of itemCategories) {
                autoIncValues[ele.category] = getIncrementNumWithPrefix({
                    modulePrefix: ele.prefix,
                    autoIncrementValue: ele.nextAutoIncrement,
                    digit: ele.digit
                });
                prefixValues[ele.category] = ele.prefix;
            }
        }
        itemCategories = itemCategories.map(x => x?.category);
        const {filterBy = null, filterByCategory = null} = req.query;
        let project = getAllForStockLevelAttributes();
        let pipeline = [
            {
                $addFields: {
                    status: {
                        $cond: [
                            {
                                $and: ["$inventoryStockLevels.reorderLevel", "$inventoryStockLevels.reorderQty"]
                            },
                            OPTIONS.defaultStatus.ACTIVE,
                            OPTIONS.defaultStatus.INACTIVE
                        ]
                    }
                }
            },
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isActive: "A",
                    ...(!!filterBy && {
                        status: filterBy
                    }),
                    ...(!!filterByCategory && {
                        itemType: filterByCategory
                    })
                }
            }
        ];
        let rows = await ItemRepository.getAllReportsPaginate({
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
                        _id: 0,
                        activeItems: 1,
                        itemWithSLData: 1,
                        itemWithoutSLData: 1
                    }
                }
            ]
        });
        return res.success({
            ...rows,
            itemCategories,
            statusOptions: [
                {label: "Summary By Item Code Category (CAT)", value: ""},
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

exports.updatePurchaseCostRateInSupplierDetails = async () => {
    try {
        let itemsList = await ItemRepository.filteredItemList([
            // {
            //     $match: {"supplierDetails.purchaseRateType": {$exists: false}}
            // },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplierDetails.supplierId",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierPurchaseType: 1, categoryType: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"},
            {
                $project: {
                    _id: 1,
                    primaryUnit: 1,
                    secondaryToPrimaryConversion: 1,
                    primaryToSecondaryConversion: 1,
                    secondaryUnit: 1,
                    supplierDetails: 1,
                    supplierPurchaseType: "$supplier.supplierPurchaseType",
                    categoryType: "$supplier.categoryType"
                }
            }
        ]);
        for await (const ele of itemsList) {
            console.log("ele", ele);
            for (const detail of ele.supplierDetails) {
                // 1 kg = 1000 gm
                // 1 kg = 200 rate/u1
                // 1 g = 0.2 rate/u1
                let MOQ2 = 0;
                let rate1 = detail.stdCostUom1 ?? 0;
                let rate2 = 0;
                if (!detail.stdCostUom1 && detail.stdCostUom2) {
                    if (ele.secondaryUnit && ele.primaryUnit && ele.secondaryToPrimaryConversion) {
                        rate1 = +(detail.stdCostUom2 / ele.secondaryToPrimaryConversion).toFixed(2);
                    }
                    if (ele.secondaryUnit && ele.primaryUnit && ele.primaryToSecondaryConversion) {
                        rate1 = +(detail.stdCostUom2 * ele.primaryToSecondaryConversion).toFixed(2);
                    }
                }
                if (ele.secondaryUnit && ele.primaryUnit && ele.primaryToSecondaryConversion) {
                    MOQ2 = +(1 * ele.primaryToSecondaryConversion).toFixed(2);
                    rate2 = +(detail.stdCostUom1 / ele.primaryToSecondaryConversion).toFixed(2);
                }
                if (ele.secondaryUnit && ele.primaryUnit && ele.secondaryToPrimaryConversion) {
                    rate2 = +(1 / ele.secondaryToPrimaryConversion).toFixed(2);
                    MOQ2 = +(detail.stdCostUom1 * ele.secondaryToPrimaryConversion).toFixed(2);
                }
                // const isDomestic = await checkDomesticCustomer(ele.supplierPurchaseType);
                let updatedDoc = await ItemRepository.findAndUpdateDoc({_id: ele._id}, [
                    {
                        $set: {
                            supplierDetails: {
                                $map: {
                                    input: "$supplierDetails",
                                    as: "supp",
                                    in: {
                                        categoryType: ele.categoryType,
                                        supplierCategory: ele.supplierPurchaseType,
                                        supplierId: "$$supp.supplierId",
                                        referenceModel: "$$supp.referenceModel",
                                        supplierName: "$$supp.supplierName",
                                        supplierCurrency: "$$supp.supplierCurrency",
                                        supplierDescription: "$$supp.supplierDescription",
                                        spin: "$$supp.spin",
                                        uom1: "$$supp.uom1",
                                        uom2: "$$supp.uom2",
                                        stdCostUom1: "$$supp.stdCostUom1",
                                        stdCostUom2: "$$supp.stdCostUom2",
                                        leadTime: "$$supp.leadTime",
                                        primaryUnit: "$$supp.primaryUnit",
                                        secondaryUnit: "$$supp.secondaryUnit",
                                        supplierPrice: "$$supp.supplierPrice",
                                        supplierBenchmarkPrice: "$$supp.supplierBenchmarkPrice",
                                        primarySupplier: "$$supp.primarySupplier",
                                        uomPurchaseCost: "$$supp.uomPurchaseCost",
                                        purchaseRateType: "Standard",
                                        purchaseRateCommon: [
                                            {
                                                currency: "$$supp.supplierCurrency",
                                                unit1: ele.primaryUnit,
                                                MOQ1: 1,
                                                rate1: rate1,
                                                unit2: "$$supp.uom2",
                                                MOQ2: MOQ2,
                                                rate2: rate2
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                ]);
            }
        }
        console.log("Items Purchase Rate Updated ");
    } catch (error) {
        console.error("error", error);
    }
};

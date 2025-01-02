const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/sales/SKUMasterModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAutoIncrementNumber,
    outputData,
    getAllAggregationFooter,
    checkDomesticCustomer,
    removeFilesInError,
    removeFile
} = require("../../../../helpers/utility");
const {getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {getAllCustomers} = require("../customerMaster/customerMaster");
const units = require("../../../../mocks/unit.json");
const {getAllSKUCategory} = require("../../settings/SKUCategoryMaster/SKUCategoryMaster");
const {dateToAnyFormat} = require("../../../../helpers/dateTime");
const {default: mongoose} = require("mongoose");
// const {getAllInkList} = require("../../production/inkMaster/inkMaster");
const {getAllItemsForBOM} = require("../../purchase/items/items");
const {getAllCheckedItemCategoriesList} = require("../../purchase/itemCategoryMaster/itemCategoryMaster");
const {getAllMapCategoryHSN} = require("../mapCategoryHSNMaster/mapCategoryHSN");
const ProdItemMaster = require("../../planning/prodItemMaster/prodItemMaster");
const updateSKUColumn = require("../../../../mocks/excelUploadColumn/skuKeys.json");
const {getAllAttributesConfiguration} = require("../../settings/attributesConfiguration/attributesConfiguration");
const {readExcel} = require("../../../../middleware/readExcel");
const {
    getAllSKUMasterAttributes,
    getAllSKUMasterExcelAttributes,
    getAllSKUMasterReportsAttributes,
    getSKUListForStockLevelsAttributes,
    getAllSKUProdItemMasterAttributes
} = require("../../../../models/sales/helpers/SKUMasterHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {SKU_MASTER} = require("../../../../mocks/schemasConstant/salesConstant");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {filteredSaleHSNList} = require("../../../../models/sales/repository/salesHSNRepository");
const SKUMasterRepository = require("../../../../models/sales/repository/SKUMasterRepository");
const {filteredProductCategoryMasterList} = require("../../../../models/settings/repository/productCategoryRepository");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {COMPANY_TYPE, STOCK_PREP_UOM, SALES_CATEGORY} = require("../../../../mocks/constantData");
const {filteredSalesProductMasterList} = require("../../../../models/sales/repository/salesProductMasterRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const CompanyRepository = require("../../../../models/settings/repository/companyRepository");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
const {getAllCustomerCategory} = require("../../settings/customerCategory/customerCategory");
const {getAllDynamicForm} = require("../../settings/dynamicForms/dynamicForms");
const {filteredSubModuleManagementList} = require("../../../../models/settings/repository/subModuleRepository");
const {CONSTANTS} = require("../../../../../config/config");
const ObjectId = mongoose.Types.ObjectId;
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSKUMasterAttributes();
        if (req.query.excel == "true") {
            project = getAllSKUMasterExcelAttributes();
        }
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $addFields: {
                    customerInfo: {$first: "$customerInfo"}
                }
            },
            {
                $unwind: {
                    path: "$customerInfo",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];
        let rows = await SKUMasterRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllSKUProcessItems = asyncHandler(async (req, res) => {
    try {
        let project = getAllSKUProdItemMasterAttributes();
        if (req.query.excel == "true") {
            project = getAllSKUProdItemMasterAttributes();
        }
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await SKUMasterRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllSKUProcessItems", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @desc    getById SKU Record
exports.getSKUProcessItemsById = asyncHandler(async (req, res) => {
    try {
        let project = getAllSKUProdItemMasterAttributes();
        let existing = await SKUMasterRepository.filteredSKUMasterList([
            {
                $match: {
                    _id: ObjectId(req.params.id)
                }
            },
            {
                $project: project
            }
        ]);
        if (!existing.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Production Items");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing[0]);
    } catch (e) {
        console.error("getById getSKUProcessItemsById", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @desc    create SKU new Record
exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        if (createdObj.SKUInfo) {
            createdObj.SKUInfo = JSON.parse(createdObj.SKUInfo);
        }
        if (createdObj.customerInfo) {
            createdObj.customerInfo = JSON.parse(createdObj.customerInfo);
        }
        if (createdObj.inkDetails) {
            createdObj.inkDetails = JSON.parse(createdObj.inkDetails);
        }
        if (createdObj.specificationInfo) {
            createdObj.specificationInfo = JSON.parse(createdObj.specificationInfo);
        }
        if (createdObj.materialInfo) {
            createdObj.materialInfo = JSON.parse(createdObj.materialInfo);
        }
        if (createdObj.dimensionsDetails) {
            createdObj.dimensionsDetails = JSON.parse(createdObj.dimensionsDetails);
        }
        if (createdObj.BOMDimensionInfo) {
            createdObj.BOMDimensionInfo = JSON.parse(createdObj.BOMDimensionInfo);
        }
        if (createdObj.offTakeInfo) {
            createdObj.offTakeInfo = JSON.parse(createdObj.offTakeInfo);
        }
        if (createdObj.costSheetInfo) {
            createdObj.costSheetInfo = JSON.parse(createdObj.costSheetInfo);
        }
        if (createdObj.toolInfo) {
            createdObj.toolInfo = JSON.parse(createdObj.toolInfo);
        }
        if (createdObj.specsAttribute) {
            createdObj.specsAttribute = JSON.parse(createdObj.specsAttribute);
        }
        if (createdObj.mouldsIDAttribute) {
            createdObj.mouldsIDAttribute = JSON.parse(createdObj.mouldsIDAttribute);
        }
        if (createdObj.packingStdAttribute) {
            createdObj.packingStdAttribute = JSON.parse(createdObj.packingStdAttribute);
        }
        if (req.files) {
            if (req.files.SKUImage && req.files.SKUImage.length > 0) {
                createdObj["SKUImage"] = req.files.SKUImage[0].filename;
            }
        }
        const itemDetails = await SKUMasterRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("SKU")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create SKU", e);
        if (req.files) {
            removeFilesInError(req.files.SKUImage);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update SKU  Record
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await SKUMasterRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        if (req.body.customerInfo) {
            req.body.customerInfo = JSON.parse(req.body.customerInfo);
        }
        if (req.body.SKUInfo) {
            req.body.SKUInfo = JSON.parse(req.body.SKUInfo);
        }
        if (req.body.inkDetails) {
            req.body.inkDetails = JSON.parse(req.body.inkDetails);
        }
        if (req.body.specificationInfo) {
            req.body.specificationInfo = JSON.parse(req.body.specificationInfo);
        }
        if (req.body.materialInfo) {
            req.body.materialInfo = JSON.parse(req.body.materialInfo);
        }
        if (req.body.dimensionsDetails) {
            req.body.dimensionsDetails = JSON.parse(req.body.dimensionsDetails);
        }
        if (req.body.BOMDimensionInfo) {
            req.body.BOMDimensionInfo = JSON.parse(req.body.BOMDimensionInfo);
        }
        if (req.body.offTakeInfo) {
            req.body.offTakeInfo = JSON.parse(req.body.offTakeInfo);
        }
        if (req.body.costSheetInfo) {
            req.body.costSheetInfo = JSON.parse(req.body.costSheetInfo);
        }
        if (req.body.toolInfo) {
            req.body.toolInfo = JSON.parse(req.body.toolInfo);
        }
        if (req.body.specsAttribute) {
            req.body.specsAttribute = JSON.parse(req.body.specsAttribute);
        }
        if (req.body.mouldsIDAttribute) {
            req.body.mouldsIDAttribute = JSON.parse(req.body.mouldsIDAttribute);
        }
        if (req.body.packingStdAttribute) {
            req.body.packingStdAttribute = JSON.parse(req.body.packingStdAttribute);
        }
        if (req.files) {
            if (req.files.SKUImage && req.files.SKUImage.length > 0) {
                if (itemDetails.SKUImage) {
                    removeFile(`${req.files.SKUImage[0].destination}/${itemDetails.SKUImage}`);
                }
                itemDetails.SKUImage = req.files.SKUImage[0].filename;
            }
        }
        if (req.body.isActive == "A") {
            req.body.remarks = null;
        }
        itemDetails = await SKUMasterRepository.updateDoc(itemDetails, req.body);

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("SKU has been")
        });
    } catch (e) {
        console.error("update SKU", e);
        if (req.files) {
            removeFilesInError(req.files.drawingArtWorkFile);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById SKU Record
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await SKUMasterRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("SKU")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById SKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById SKU Record
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await SKUMasterRepository.filteredSKUMasterList([
            {
                $match: {
                    _id: ObjectId(req.params.id)
                }
            },
            {
                $lookup: {
                    from: "DynamicForms",
                    localField: "SKUInfo.dynamicForm",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                inputLabel: 1,
                                inputType: 1,
                                options: 1
                            }
                        }
                    ],
                    as: "dynamicForm"
                }
            },
            {
                $addFields: {
                    SKUInfo: {
                        $map: {
                            input: "$SKUInfo",
                            as: "detail",
                            in: {
                                $mergeObjects: [
                                    "$$detail",
                                    {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$dynamicForm",
                                                    as: "dynamic",
                                                    cond: {$eq: ["$$dynamic._id", "$$detail.dynamicForm"]}
                                                }
                                            },
                                            0
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    SKUImageUrl: {$concat: [CONSTANTS.domainUrl, "Sku/", "$SKUImage"]}
                }
            }
        ]);
        if (!existing.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing[0]);
    } catch (e) {
        console.error("getById SKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData SKU Record
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let [options, attributesList, itemCategoriesList, company, mapHSNCategoryList, rateTypeOptions] =
            await Promise.all([
                dropDownOptions(req.user.company),
                getAllAttributesConfiguration("SKU"),
                getAllCheckedItemCategoriesList({
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE,
                    stockPreparation: true
                }),
                CompanyRepository.getDocById(req.user.company, {companyType: 1}),
                getAllMapCategoryHSN(
                    {status: OPTIONS.defaultStatus.ACTIVE, company: req.user.company},
                    {HSNCode: 1, HSN: 1, productCategory: 1, igstRate: 1, sgstRate: 1, cgstRate: 1, ugstRate: 1}
                ),
                getAllModuleMaster(req.user.company, "CUSTOMER_RATE_TYPE")
            ]);

        itemCategoriesList = itemCategoriesList.map(x => x.category);
        let materialList = [];
        let childItems = [];
        let inkList = [];
        let costSheetList = [];
        let specificationList = [];
        for (const ele of attributesList) {
            if (ele.tabName == "Materials" && ele.status) {
                [materialList, childItems] = await Promise.all([
                    getAllItemsForBOM(req.user.company, itemCategoriesList, {
                        item: "$_id",
                        referenceModel: "Items",
                        itemCode: 1,
                        itemName: 1,
                        itemDescription: 1,
                        UoM: "$orderInfoUOM",
                        qtyPerSKUUnit: {$literal: 0},
                        isSelect: {$literal: false},
                        unitCost: "$supplierDetails.stdCostUom1",
                        // primaryUnit: 1,
                        // secondaryUnit: 1,
                        _id: 0
                    }),
                    ProdItemMaster.getAllProdItemsListForBOM(req.user.company, null, "SKU", {
                        item: "$_id",
                        referenceModel: "ProductionItem",
                        itemCode: 1,
                        itemName: 1,
                        itemDescription: 1,
                        UoM: "$unitOfMeasurement",
                        qtyPerSKUUnit: {$literal: 0},
                        isSelect: {$literal: false},
                        unitCost: {$literal: 0},
                        primaryUnit: 1,
                        secondaryUnit: 1,
                        type: "prodItem",
                        _id: 0
                    })
                ]);
                materialList = [...materialList, ...childItems];
            }
            if (ele.tabName == "Colours" && ele.status) {
                inkList = await ProdItemMaster.getAllInkList(req.user.company);
            }
        }
        const SKUInfoForm = await getAllDynamicForm(req.user.company, "SKU_INFO_FIELDS");
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
            materialList,
            attributesList,
            inkList,
            rateTypeOptions,
            mapHSNCategoryList,
            specificationList,
            costSheetList,
            companyType: company.companyType,
            SKUInfoForm,
            featureConfig,
            ...options
        });
    } catch (error) {
        console.error("getAllMasterData SKU", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const dropDownOptions = async company => {
    try {
        let [WXLDimensionsUnit, shoulderTypeOptions, SKUCategoryList, hsnCodesOptions, customersOptions] =
            await Promise.all([
                getAllModuleMaster(company, "WXL_DIMENSIONS_UNIT"),
                getAllModuleMaster(company, "SHOULDER_TYPE"),
                getAllSKUCategory(company, null),
                filteredSaleHSNList([
                    {$match: {company: ObjectId(company), isActive: "Y"}},
                    {
                        $project: {
                            value: "$hsnCode",
                            hsnCode: 1,
                            goodsDescription: 1,
                            gstRate: 1,
                            igstRate: 1,
                            cgstRate: 1,
                            sgstRate: 1,
                            ugstRate: 1,
                            select: {$literal: false}
                        }
                    }
                ]),
                filteredCustomerList([
                    {$match: {company: ObjectId(company), isCustomerActive: "A"}},
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
                            customerCode: 1,
                            customerBillingState: "$customerBillingAddress.state",
                            customerBillingCity: "$customerBillingAddress.city",
                            customerBillingPinCode: "$customerBillingAddress.pinCode"
                        }
                    }
                ])
            ]);
        let autoIncValues = {};
        let productCategories;
        if (SKUCategoryList.length > 0) {
            productCategories = SKUCategoryList.map(x => {
                return {
                    label: x.displayProductCategoryName,
                    value: x.displayProductCategoryName,
                    application: x.application,
                    productNumber: x.SKUCategoryName,
                    productCode: x.productCode,
                    key: x.SKUCategoryName
                };
            });
            for (const ele of SKUCategoryList) {
                autoIncValues[ele.SKUCategoryName] = getAutoIncrementNumber(
                    ele.SKUCategoryPrefix,
                    "",
                    ele.SKUCategoryAutoIncrement,
                    ele.digit
                );
            }
        } else {
            productCategories = await filteredProductCategoryMasterList([
                {
                    $match: {
                        company: ObjectId(company),
                        categoryStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                },
                {$sort: {seq: 1}},
                {
                    $project: {
                        productNumber: 1,
                        productCode: 1,
                        displayProductCategoryName: 1,
                        application: 1
                    }
                }
            ]);
            productCategories = productCategories.map(x => {
                return {
                    label: x.displayProductCategoryName,
                    value: x.displayProductCategoryName,
                    application: x.application,
                    productNumber: x.productNumber,
                    productCode: x.productCode,
                    key: x.displayProductCategoryName
                };
            });
            for (const ele of productCategories) {
                autoIncValues[ele.label] = await getAndSetAutoIncrementNo(
                    {...SKU_MASTER.AUTO_INCREMENT_DATA()},
                    company
                );
            }
        }
        let customerCategories = await getAllCustomerCategory(company);
        if (customerCategories?.length) {
            customerCategories = customerCategories.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            });
        }
        return {
            hsnCodesOptions,
            customersOptions,
            shoulderTypeOptions,
            UOMOptions: units.map(x => {
                return {
                    value: x.value,
                    label: x.label
                };
            }),
            autoIncValues,
            productCategoryOptions: productCategories,
            customerCategories: customerCategories,
            WXLDimensionsUnit: WXLDimensionsUnit?.map(x => x.value)
        };
    } catch (error) {
        console.error(error);
    }
};
exports.getCustomersByCategory = asyncHandler(async (req, res) => {
    try {
        const customerOptions = await filteredCustomerList([
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
                    customerCode: "$customerCode",
                    categoryType: 1,
                    customerBillingState: "$customerBillingAddress.state",
                    customerBillingCity: "$customerBillingAddress.city",
                    customerBillingPinCode: "$customerBillingAddress.pinCode"
                }
            }
        ]);
        return res.success({customerOptions});
    } catch (error) {
        console.error("getAllMasterData Items", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @desc    getAllSKUs SKU Record
exports.getAllSKUs = async (company, project = {}) => {
    try {
        let rows = await Model.find({isActive: "A", company: company}, project).sort({createdAt: -1});
        return rows;
    } catch (e) {
        console.error("getAllSKUs", e);
    }
};
exports.getAllSKUMasterBySKUId = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id, {costSheetInfo: 1});
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU Master");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById SKU Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllSKUsCount = async company => {
    try {
        const count = await Model.countDocuments({
            isActive: "A",
            company: company
        });
        return count;
    } catch (error) {
        console.error(error);
    }
};
exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const customers = await getAllCustomers(req.user.company);
        // const productCategory = await findAppParameterValue("PRODUCT_CATEGORY", req.user.company);
        const productCategories = await filteredProductCategoryMasterList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {$sort: {seq: 1}},
            {
                $project: {
                    displayProductCategoryName: 1
                }
            }
        ]);
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1,
            category = null,
            customer = null
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!category && {
                productCategory: category
            }),
            ...(!!customer && {
                "customerInfo.customer": ObjectId(customer)
            })
        };
        let project = getAllSKUMasterReportsAttributes();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([
            {$unwind: "$customerInfo"},
            {
                $match: query
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customerInfo.customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerName: 1}}],
                    as: "customerInfo.customer"
                }
            },
            {$unwind: "$customerInfo.customer"},
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            customers,
            // productCategory: productCategory?.split(",")?.map(x => {
            //     return {
            //         label: x,
            //         value: x
            //     };
            // }),
            productCategories: productCategories.map(x => {
                return {
                    label: x.displayProductCategoryName,
                    value: x.displayProductCategoryName
                };
            }),
            ...outputData(rows)
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllSKUListByCustomerId = async (customerId, project = {}) => {
    try {
        let rows = await Model.aggregate([
            {$unwind: {path: "$customerInfo", preserveNullAndEmptyArrays: true}},
            {$match: {"customerInfo.customer": ObjectId(customerId), isActive: "A"}},
            {
                $addFields: {
                    discount: 0,
                    orderedQty: 0,
                    invoicedQty: 0,
                    canceledQty: 0,
                    balancedQty: 0,
                    lineValue: 0,
                    returnQty: 0
                }
            },
            {$project: project}
        ]);
        return rows;
    } catch (e) {
        console.error("getAllSKUListByCustomerId", e);
    }
};
exports.getAllUniquePODetailsByCustomerId = async customerId => {
    try {
        let rows = await Model.aggregate([
            {$unwind: "$customerInfo"},
            {
                $match: {
                    "customerInfo.customer": ObjectId(customerId),
                    isActive: "A",
                    "customerInfo.POValidDate": {$gte: new Date()}
                }
            },
            {
                $project: {
                    PONo: "$customerInfo.PONo",
                    PODate: "$customerInfo.PODate",
                    POValidDate: "$customerInfo.POValidDate"
                }
            },
            {
                $group: {
                    _id: {PONo: "$PONo", PODate: "$PODate", POValidDate: "$POValidDate"}
                }
            },
            {
                $project: {
                    _id: 0,
                    PONo: "$_id.PONo",
                    PODate: "$_id.PODate",
                    POValidDate: "$_id.POValidDate"
                }
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllUniquePODetailsByCustomerId", e);
    }
};
exports.getAllSKUListOnOpenPOByCustomerId = async query => {
    try {
        let rows = await SKUMasterRepository.filteredSKUMasterList([
            {$unwind: {path: "$customerInfo", preserveNullAndEmptyArrays: true}},
            {
                $match: {
                    "customerInfo.customer": ObjectId(query.customerId),
                    "customerInfo.PONo": query.PONo,
                    "customerInfo.PODate": query.PODate,
                    "customerInfo.POValidDate": new Date(query.POValidDate),
                    isActive: "A"
                }
            },
            {
                $addFields: {discount: 0, orderedQty: 0, invoicedQty: 0, canceledQty: 0, balancedQty: 0, lineValue: 0}
            },
            {
                $project: {
                    SKU: "$_id",
                    SKUNo: 1,
                    SKUName: 1,
                    UOM: "$primaryUnit",
                    SKUDescription: 1,
                    customerPartNo: "$customerInfo.customerPartNo",
                    productCategory: 1,
                    SOLineTargetDate: dateToAnyFormat(new Date(), "YYYY-MM-DD"),
                    discount: 1,
                    netRate: "$customerInfo.standardSellingRate",
                    orderedQty: 1,
                    invoicedQty: 1,
                    canceledQty: 1,
                    balancedQty: 1,
                    productCode: 1,
                    lineValue: 1,
                    standardRate: "$customerInfo.standardSellingRate",
                    customer: "$customerInfo.customer",
                    customerName: "$customerInfo.customerName"
                }
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllSKUListByCustomerId", e);
    }
};
exports.getAllInkDetailsForBOM = async (company, SKUId) => {
    try {
        let rows = await Model.aggregate([
            {
                $match: {
                    isActive: "A",
                    company: ObjectId(company),
                    _id: ObjectId(SKUId)
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "materialInfo.item",
                    foreignField: "_id",
                    pipeline: [
                        {$addFields: {supplierDetails: {$arrayElemAt: ["$supplierDetails", 0]}}},
                        {
                            $project: {
                                uom1: "$supplierDetails.uom1",
                                uom2: "$supplierDetails.uom2",
                                stdCostUom1: "$supplierDetails.stdCostUom1",
                                stdCostUom2: "$supplierDetails.stdCostUom2"
                            }
                        }
                    ],
                    as: "itemData"
                }
            },
            {
                $addFields: {
                    materialInfo: {
                        $map: {
                            input: "$materialInfo",
                            as: "info",
                            in: {
                                $mergeObjects: [
                                    "$$info",
                                    {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$itemData",
                                                    as: "data",
                                                    cond: {$eq: ["$$data._id", "$$info.item"]}
                                                }
                                            },
                                            0
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    inkDetails: {
                        $map: {
                            input: "$inkDetails",
                            as: "detail",
                            in: {
                                $mergeObjects: [
                                    "$$detail",
                                    {
                                        UoM: "g",
                                        inkCostPerKg: "$$detail.inkCostPerGm",
                                        qtyPerSKUUnit: "$$detail.ink"
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    mergedDetails: {
                        $concatArrays: [
                            {
                                $sortArray: {input: "$materialInfo", sortBy: {itemCode: 1}}
                            },
                            {
                                $sortArray: {input: "$inkDetails", sortBy: {colSeq: 1}}
                            }
                        ]
                    }
                }
            },
            {
                $unwind: "$mergedDetails"
            },
            {
                $addFields: {
                    qtyPerSKUUnit: {
                        $cond: {
                            if: "$mergedDetails.qtyPerSKUUnit",
                            then: "$mergedDetails.qtyPerSKUUnit",
                            else: {$round: [{$divide: ["$mergedDetails.ink", 1000]}, 5]}
                        }
                    },
                    unitCost: {
                        $cond: [
                            {$eq: [{$type: "$mergedDetails.inkId"}, "missing"]},
                            {
                                $cond: [
                                    {$eq: ["$mergedDetails.uom1", "sqm"]},
                                    {$ifNull: ["$mergedDetails.stdCostUom1", 0]},
                                    {
                                        $cond: [
                                            {$eq: ["$mergedDetails.uom2", "sqm"]},
                                            {$ifNull: ["$mergedDetails.stdCostUom2", 0]},
                                            0
                                        ]
                                    }
                                ]
                            },
                            "$mergedDetails.unitCost"
                        ]
                    }
                }
            },
            {
                $project: {
                    inkId: "$mergedDetails.inkId",
                    reference: {
                        $cond: [{$not: ["$mergedDetails.inkId"]}, "$mergedDetails.item", "$mergedDetails.inkId"]
                    },
                    referenceModel: {
                        $cond: [{$not: ["$mergedDetails.inkId"]}, "$mergedDetails.referenceModel", "InkMaster"]
                    },
                    colSeq: "$mergedDetails.colSeq",
                    itemCode: "$mergedDetails.itemCode",
                    itemName: "$mergedDetails.itemName",
                    itemDescription: "$mergedDetails.itemDescription",
                    UOM: "$mergedDetails.UoM",
                    mesh: "$mergedDetails.mesh",
                    GSM: "$mergedDetails.GSM",
                    areaSqm: "$mergedDetails.areaSqm",
                    inkArea: "$mergedDetails.inkArea",
                    inkAreaSqm: "$mergedDetails.inkAreaSqm",
                    ink: "$mergedDetails.ink",
                    // qtyPerSKUUnit: "$mergedDetails.qtyPerSKUUnit",
                    qtyPerSKUUnit: 1,
                    inkCostPerKg: "$mergedDetails.inkCostPerKg",
                    inkCostPerGm: "$mergedDetails.inkCostPerGm",
                    unitCost: {
                        $cond: [
                            {$in: ["$mergedDetails.UoM", [STOCK_PREP_UOM.ROLL, STOCK_PREP_UOM.SHEET]]},
                            {
                                $round: [
                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    {
                                                        $multiply: ["$mergedDetails.width", "$mergedDetails.length"]
                                                    },
                                                    1000000
                                                ]
                                            },
                                            "$unitCost"
                                        ]
                                    },
                                    5
                                ]
                            },
                            "$unitCost"
                        ]
                    },
                    type: {
                        $cond: [{$not: ["$mergedDetails.inkId"]}, "materialInfo", "InkInfo"]
                    },
                    partCount: "$qtyPerSKUUnit",
                    primaryUnit: "$mergedDetails.primaryUnit",
                    secondaryUnit: "$mergedDetails.secondaryUnit",
                    conversionOfUnits: "$mergedDetails.conversionOfUnits",
                    ups: "$mergedDetails.ups",
                    width: "$mergedDetails.width",
                    length: "$mergedDetails.length",
                    widthUnit: "$mergedDetails.widthUnit",
                    lengthUnit: "$mergedDetails.lengthUnit",
                    primaryToSecondaryConversion: "$mergedDetails.primaryToSecondaryConversion",
                    secondaryToPrimaryConversion: "$mergedDetails.secondaryToPrimaryConversion",
                    childItemDescription: "$mergedDetails.childItemDescription",
                    layoutDimArea: "$mergedDetails.layoutDimArea",
                    itemCost: {
                        $round: [{$multiply: ["$qtyPerSKUUnit", "$unitCost"]}, 2]
                    }
                }
            },
            {
                $addFields: {
                    unitCost: {
                        $cond: [
                            {$and: [{$eq: ["$UOM", STOCK_PREP_UOM.ROLL]}, {$eq: ["$lengthUnit", "m"]}]},
                            {$multiply: ["$unitCost", 1000]},
                            "$unitCost"
                        ]
                    }
                }
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllInkDetailsForBOM", e);
    }
};

exports.createSKU = async obj => {
    try {
        obj = JSON.parse(JSON.stringify(obj));
        delete obj._id;
        delete obj._v;
        delete obj.dSKUNo;
        let createdObj = {
            ...obj
        };
        let newSKU = await Model.create(createdObj);
        return {
            _id: newSKU._id,
            SKUNo: newSKU.SKUNo,
            SKUName: newSKU.SKUName,
            SKUDescription: newSKU.SKUDescription
        };
    } catch (error) {
        console.error("Create SKU On NPD Master Update::::: Error in creating SKU ======= ", error);
    }
};

exports.updateSKUByFile = asyncHandler(async (req, res) => {
    try {
        let fname = req.file.filename;
        let jsonData = await readExcel(fname, updateSKUColumn);
        let nonUpdatedSKUCode = [];
        for (const ele of jsonData) {
            let existing = await Model.findOne({SKUNo: ele.SKUNo});
            if (existing) {
                existing.SKUName = ele.SKUName;
                existing.SKUDescription = ele.SKUDescription;
                await existing.save();
            } else {
                nonUpdatedSKUCode.push(ele.SKUNo);
            }
        }
        return res.success({message: "Updated successfully!", nonUpdatedSKUCode});
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        throw new Error(e);
    }
});

exports.getAllSKUByCategory = async (category, company, project = {}) => {
    try {
        let rows = await Model.find({isActive: "A", productCategory: category, company: company}, project).sort({
            SKUName: 1
        });
        return rows;
    } catch (e) {
        console.error("getSKUById", e);
    }
};

exports.getMouldDataBySKUId = asyncHandler(async (req, res) => {
    try {
        // let mouldData = await filteredSalesProductMasterList([
        //     {
        //         $match: {
        //             company: ObjectId(req.user.company),
        //             status: OPTIONS.defaultStatus.ACTIVE,
        //             productCategory: req.query.category
        //         }
        //     },
        //     {
        //         $unwind: "$mouldInfo"
        //     },
        //     {
        //         $match: {
        //             "mouldInfo.select": true
        //         }
        //     },
        //     {
        //         $group: {
        //             _id: {
        //                 mouldNo: "$mouldInfo.mouldNo"
        //             }
        //         }
        //     },
        //     {
        //         $project: {
        //             mouldNo: "$_id.mouldNo",
        //             _id: 0
        //         }
        //     },
        //     {
        //         $sort: {mouldNo: 1}
        //     }
        // ]);
        let company = await CompanyRepository.getDocById(req.user.company, {companyType: 1});
        let mouldInfo = [];
        if (company.companyType == COMPANY_TYPE.INJECTION_MOULDING) {
            mouldInfo = await filteredSalesProductMasterList([
                {
                    $match: {
                        company: ObjectId(req.user.company),
                        status: OPTIONS.defaultStatus.ACTIVE,
                        productCategory: req.query.category
                    }
                },
                {
                    $project: {
                        productMasterNo: 1,
                        productCategory: 1,
                        capDia: 1,
                        capHeight: 1,
                        capFinish: 1,
                        threadType: 1,
                        orifice: 1,
                        shoulderType: 1,
                        weight: 1,
                        packingStdDetails: 1,
                        mouldInfo: {
                            $map: {
                                input: "$mouldInfo",
                                as: "info",
                                in: {
                                    mouldNo: "$$info.mouldNo"
                                }
                            }
                        },
                        // qtyPerPrimaryPack: "$packingStdDetails.qtyPerPrimaryPack",
                        // qtyPerSecondaryPack: "$packingStdDetails.qtyPerSecondaryPack",
                        _id: 1
                    }
                }
            ]);
            // packingStdInfo = await filteredSalesProductMasterList([
            //     {
            //         $match: {
            //             company: ObjectId(req.user.company),
            //             status: OPTIONS.defaultStatus.ACTIVE,
            //             productCategory: req.query.category
            //         }
            //     },
            //     {
            //         $group: {
            //             _id: null,
            //             qtyPerPrimaryPack: {$first: "$packingStdDetails.qtyPerPrimaryPack"},
            //             qtyPerSecondaryPack: {$first: "$packingStdDetails.qtyPerSecondaryPack"}
            //         }
            //     },
            //     {
            //         $project: {
            //             _id: 0,
            //             qtyPerPrimaryPack: 1,
            //             qtyPerSecondaryPack: 1
            //         }
            //     }
            // ]);
        }
        return res.success({mouldInfo});
    } catch (e) {
        console.error("getMouldDataBySKUId", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.checkSKUValidation = async (SKUData, column, company) => {
    try {
        const SKUOptions = await SKUMasterRepository.filteredSKUMasterList([
            {$match: {company: ObjectId(company), isActive: "A"}},
            {$project: {SKUName: 1, SKUDescription: 1}}
        ]);
        const requiredFields = [
            "SKUStage",
            "productCategory",
            "SKUName",
            "SKUDescription",
            "hsn",
            "primaryUnit",
            // "customer",
            "customerCode",
            "customerPartNo",
            "customerCurrency",
            "standardSellingRate"
        ];
        const falseArr = OPTIONS.falsyArray;
        let {
            hsnCodesOptions,
            customersOptions,
            shoulderTypeOptions,
            UOMOptions,
            productCategoryOptions,
            WXLDimensionsUnit
        } = await dropDownOptions(company);
        UOMOptions.push({
            value: "-",
            label: "-"
        });
        let dropdownCheck = [
            {
                key: "hsn",
                options: hsnCodesOptions.map(x => {
                    return {
                        label: x.hsnCode,
                        value: x.hsnCode
                    };
                })
            },
            {
                key: "customerCode",
                options: customersOptions.map(x => {
                    return {
                        label: x.customerCode,
                        value: x.customerCode
                    };
                })
            },
            // {
            //     key: "shoulderType",
            //     options: shoulderTypeOptions.map(x => {
            //         return {
            //             label: x.label,
            //             value: x.value
            //         };
            //     })
            // },
            {
                key: "primaryUnit",
                options: UOMOptions
            },
            {
                key: "secondaryUnit",
                options: UOMOptions
            },
            {
                key: "rateType",
                options: [
                    {label: "Standard", value: "Standard"},
                    {label: "Volume Based Pricing", value: "Volume Based Pricing"}
                ]
            },
            {
                key: "productCategory",
                options: productCategoryOptions.map(x => {
                    return {
                        label: x.label,
                        value: x.label
                    };
                })
            }
        ];
        let uniqueSKU = [];
        for await (const x of SKUData) {
            x.isValid = true;
            x.message = null;
            let label = `${x["SKUName"]} - ${x["SKUDescription"]}`;
            if (uniqueSKU.includes(label)) {
                x.isValid = false;
                x.message = `${x["SKUName"]} duplicate Entry`;
                break;
            }
            uniqueSKU.push(label);
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
                for (const SKU of SKUOptions) {
                    if (SKU.SKUName == x["SKUName"] && SKU.SKUDescription == x["SKUDescription"]) {
                        x.isValid = false;
                        x.message = `${x["SKUName"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = SKUData.filter(x => !x.isValid);
        const validRecords = SKUData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertSKUByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        const customersOptions = await filteredCustomerList([
            {$match: {company: ObjectId(company), isCustomerActive: "A"}},
            {$sort: {customerName: 1}},
            {
                $project: {
                    label: "$customerCode",
                    value: "$_id",
                    currency: "$customerCurrency",
                    customerCategory: 1,
                    categoryType: 1,
                    customerName: 1
                }
            }
        ]);
        let missingCustomerName = [];
        for (const ele of jsonData) {
            for (const customer of customersOptions) {
                if (ele.customerCode.trim() == customer.label) {
                    ele.customer = customer.value.valueOf();
                    ele.customerName = customer.customerName;
                    ele.customerCurrency = customer.currency;
                    ele.customerCategory = customer.customerCategory;
                    ele.categoryType = customer.categoryType;
                }
            }
            if (!ele.customerName || !ele.customer) {
                missingCustomerName.push(ele.customerName ? ele.customerName : ele.itemName);
            }
        }
        let SKUData = jsonData.map(x => {
            const {
                customer,
                customerName,
                customerCurrency,
                customerPartNo,
                customerCategory,
                categoryType,
                rateType,
                MOQ1,
                rate1,
                MOQ2,
                rate2,
                MOQ3,
                rate3,
                ...rest
            } = x;
            let secondaryUnitExists = rest?.secondaryUnit == "-" ? false : true;
            let details = {
                customer,
                customerName,
                customerPartNo,
                customerCategory,
                categoryType,
                primaryUnit: rest?.primaryUnit,
                secondaryUnit: rest?.secondaryUnit,
                customerCurrency,
                rateType: rateType,
                sellingRateCommon: [
                    {
                        currency: customerCurrency,
                        unit1: rest?.primaryUnit,
                        MOQ1: MOQ1,
                        rate1: rate1,
                        unit2: secondaryUnitExists ? rest?.secondaryUnit : null,
                        MOQ2: secondaryUnitExists ? +(MOQ1 * rest.primaryToSecondaryConversion).toFixed(2) : 0,
                        rate2: secondaryUnitExists ? +(rate1 / rest.primaryToSecondaryConversion).toFixed(2) : 0
                    }
                ]
            };
            if (rate2 && MOQ2) {
                details.sellingRateCommon.push({
                    currency: customerCurrency,
                    unit1: rest?.primaryUnit,
                    MOQ1: MOQ2,
                    rate1: rate2,
                    unit2: secondaryUnitExists ? rest?.secondaryUnit : null,
                    MOQ2: secondaryUnitExists ? +(MOQ2 * rest.primaryToSecondaryConversion).toFixed(2) : 0,
                    rate2: secondaryUnitExists ? +(rate2 / rest.primaryToSecondaryConversion).toFixed(2) : 0
                });
            }
            if (rate3 && MOQ3) {
                details.sellingRateCommon.push({
                    currency: customerCurrency,
                    unit1: rest?.primaryUnit,
                    MOQ1: MOQ3,
                    rate1: rate3,
                    unit2: secondaryUnitExists ? rest?.secondaryUnit : null,
                    MOQ2: secondaryUnitExists ? +(MOQ3 * rest.primaryToSecondaryConversion).toFixed(2) : 0,
                    rate2: secondaryUnitExists ? +(rate3 / rest.primaryToSecondaryConversion).toFixed(2) : 0
                });
            }
            rest.customerInfo = [details];
            rest.company = company;
            rest.createdBy = createdBy;
            rest.updatedBy = updatedBy;
            return rest;
        });
        for await (const item of SKUData) {
            await SKUMasterRepository.createDoc(item);
        }
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

exports.updateCategoryTypeInCustomerInfo = async () => {
    try {
        let SKUList = await SKUMasterRepository.filteredSKUMasterList([
            {
                $match: {"customerInfo.categoryType": {$exists: false}}
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customerInfo.customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerCategory: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},
            {
                $project: {
                    _id: 1,
                    customerInfo: 1,
                    customerCategory: "$customer.customerCategory"
                }
            }
        ]);
        for await (const ele of SKUList) {
            const isDomestic = await checkDomesticCustomer(ele.customerCategory);
            let updatedDoc = await SKUMasterRepository.findAndUpdateDoc({_id: ele._id}, [
                {
                    $set: {
                        customerInfo: {
                            $map: {
                                input: "$customerInfo",
                                as: "supp",
                                in: {
                                    $mergeObjects: [
                                        "$$supp",
                                        {
                                            categoryType: isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.EXPORTS,
                                            rateType: "Std. Selling",
                                            customerCategory: ele.customerCategory
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            ]);
        }
        console.log("SKU Category Type Updated");
    } catch (error) {
        console.error("error", error);
    }
};

exports.updateSellingRateInCustomerDetails = async () => {
    try {
        let SKUList = await SKUMasterRepository.filteredSKUMasterList([
            {
                $match: {"customerInfo.sellingRateCommon": {$exists: false}}
            },
            {
                $project: {
                    _id: 1,
                    primaryUnit: 1,
                    secondaryToPrimaryConversion: 1,
                    primaryToSecondaryConversion: 1,
                    secondaryUnit: 1,
                    customerInfo: 1,
                    customerCategory: 1
                }
            }
        ]);
        for await (const ele of SKUList) {
            for (const detail of ele.customerInfo) {
                // 1 kg = 1000 gm
                // 1 kg = 200 rate/u1
                // 1 g = 0.2 rate/u1
                let MOQ2 = 0;
                let rate1 = detail.standardSellingRate ?? 0;
                let rate2 = 0;
                // if (!detail.stdCostUom1 && detail.stdCostUom2) {
                //     if (ele.secondaryUnit && ele.primaryUnit && ele.secondaryToPrimaryConversion) {
                //         rate1 = +(detail.stdCostUom2 / ele.secondaryToPrimaryConversion).toFixed(2);
                //     }
                //     if (ele.secondaryUnit && ele.primaryUnit && ele.primaryToSecondaryConversion) {
                //         rate1 = +(detail.stdCostUom2 * ele.primaryToSecondaryConversion).toFixed(2);
                //     }
                // }
                if (ele.secondaryUnit && ele.primaryUnit && ele.primaryToSecondaryConversion) {
                    MOQ2 = +(1 * ele.primaryToSecondaryConversion).toFixed(2);
                    rate2 = +(detail.standardSellingRate / ele.primaryToSecondaryConversion).toFixed(2);
                }
                if (ele.secondaryUnit && ele.primaryUnit && ele.secondaryToPrimaryConversion) {
                    rate2 = +(1 / ele.secondaryToPrimaryConversion).toFixed(2);
                    MOQ2 = +(detail.standardSellingRate * ele.secondaryToPrimaryConversion).toFixed(2);
                }
                const isDomestic = await checkDomesticCustomer(ele.customerCategory);
                let updatedDoc = await SKUMasterRepository.findAndUpdateDoc({_id: ele._id}, [
                    {
                        $set: {
                            customerInfo: {
                                $map: {
                                    input: "$customerInfo",
                                    as: "supp",
                                    in: {
                                        categoryType: isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.IMPORTS,
                                        customerCategory: ele.customerCategory,
                                        customer: "$$supp.customer",
                                        customerCategory: "$$supp.customerCategory",
                                        customerPartNo: "$$supp.customerPartNo",
                                        customerName: "$$supp.customerName",
                                        customerCurrency: "$$supp.customerCurrency",
                                        customerPartDescription: "$$supp.customerPartDescription",
                                        PONo: "$$supp.PONo",
                                        PODate: "$$supp.PODate",
                                        primaryUnit: "$$supp.primaryUnit",
                                        secondaryUnit: "$$supp.secondaryUnit",
                                        rateType: "$$supp.rateType",

                                        rateType: "Standard",
                                        sellingRateCommon: [
                                            {
                                                currency: "$$supp.customerCurrency",
                                                unit1: ele.primaryUnit,
                                                MOQ1: 1,
                                                rate1: rate1,
                                                unit2: "$$supp.secondaryUnit",
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
        console.log("SKU Sales Rate Updated");
    } catch (error) {
        console.error("error", error);
    }
};

exports.getSKUListForStockLevels = asyncHandler(async (req, res) => {
    try {
        let SKUCategoryList = await getAllSKUCategory(req.user.company, null);
        let productCategories;
        if (SKUCategoryList.length > 0) {
            productCategories = SKUCategoryList.map(x => {
                return {
                    label: x.displayProductCategoryName,
                    value: x.displayProductCategoryName,
                    application: x.application,
                    productNumber: x.SKUCategoryName,
                    productCode: x.productCode,
                    key: x.SKUCategoryName
                };
            });
        } else {
            productCategories = await filteredProductCategoryMasterList([
                {
                    $match: {
                        company: ObjectId(req.user.company),
                        categoryStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                },
                {$sort: {seq: 1}},
                {
                    $project: {
                        productNumber: 1,
                        productCode: 1,
                        displayProductCategoryName: 1,
                        application: 1
                    }
                }
            ]);
            productCategories = productCategories.map(x => {
                return {
                    label: x.displayProductCategoryName,
                    value: x.displayProductCategoryName,
                    application: x.application,
                    productNumber: x.productNumber,
                    productCode: x.productCode,
                    key: x.displayProductCategoryName
                };
            });
        }
        const {filterBy = null, filterByCategory = null} = req.query;
        let project = getSKUListForStockLevelsAttributes();
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
                                $and: [
                                    {$gt: [{$ifNull: ["$SKUStockLevels.minLevel", null]}, null]},
                                    {$gt: [{$ifNull: ["$SKUStockLevels.maxLevel", null]}, null]}
                                ]
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
                        productCategory: filterByCategory
                    })
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
                {label: "Active SKU Count", count: rows?.totalAmounts?.activeCount ?? 0},
                {label: "Stock Levels Defined - SKU Count", count: rows?.totalAmounts?.SKULinked ?? 0},
                {label: "Stock Levels Not Defined - SKU Count", count: rows?.totalAmounts?.SKUUnLinked ?? 0}
            ],
            statusOptions: [
                {label: "Summary By SKU Code Category (CAT)", value: ""},
                {label: "Summary by Status - Red", value: OPTIONS.defaultStatus.INACTIVE},
                {label: "Summary by Status - Green", value: OPTIONS.defaultStatus.ACTIVE}
            ],
            productCategories
        });
    } catch (e) {
        console.error("getSKUListForStockLevels", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

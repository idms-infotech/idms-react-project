const asyncHandler = require("express-async-handler");
const {default: mongoose} = require("mongoose");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAutoIncrementNumber, removeFilesInError, removeFile} = require("../../../../helpers/utility");
const {OPTIONS} = require("../../../../helpers/global.options");
const units = require("../../../../mocks/unit.json");
const {getAllMapCategoryHSN} = require("../../sales/mapCategoryHSNMaster/mapCategoryHSN");
const {getAllNPDReviewForVariants, updateNPDReviewOnDesignSKUCreate} = require("../NPDReview/NPDReview");
const {getAllCheckedItemCategoriesList} = require("../../purchase/itemCategoryMaster/itemCategoryMaster");
const {getAllItemsForBOM} = require("../../purchase/items/items");
// const {getAllInkList} = require("../../production/inkMaster/inkMaster");
const {createSKU} = require("../../sales/SKU/SKU");
const {getAllSKUCategory} = require("../../settings/SKUCategoryMaster/SKUCategoryMaster");
const ProdItemMaster = require("../../planning/prodItemMaster/prodItemMaster");
const {getAllProspectsForNPD} = require("../prospect/prospect");
const {getAllCustomersForNPD} = require("../../sales/customerMaster/customerMaster");
const {getAllCostSheet} = require("../costSheet/costSheet");
const {getAllAttributesConfiguration} = require("../../settings/attributesConfiguration/attributesConfiguration");
const {updateBOMOfDSKUStatus} = require("../billOfMaterial/BoMOfDSKU/BOMOfDSKU");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {
    getAllNPDMasterAttributes,
    getAllPendingDSKUConversionReportAttributes,
    getAllDSKUToSKUConversionReportAttributes
} = require("../../../../models/businessLeads/helpers/NPDMasterHelper");
const {CONSTANTS} = require("../../../../../config/config");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {NPD_MASTER} = require("../../../../mocks/schemasConstant/businessLeadsConstant");
const {filteredSpecificationList} = require("../../../../models/quality/repository/specificationRepository");
const NPDMasterRepository = require("../../../../models/businessLeads/repository/NPDMasterRepository");
const {filteredProspectList} = require("../../../../models/businessLeads/repository/prospectMasterRepository");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const ObjectId = mongoose.Types.ObjectId;
const {getAllModuleMaster} = require("../../settings/module-master/module-master");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllNPDMasterAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isConvertedToSKU: false
                }
            },
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
        let rows = await NPDMasterRepository.getAllPaginate({pipeline, project, queryParams: req.query});
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
        if (createdObj.costSheetInfo) {
            createdObj.costSheetInfo = JSON.parse(createdObj.costSheetInfo);
        }
        if (createdObj.BOMDimensionInfo) {
            createdObj.BOMDimensionInfo = JSON.parse(createdObj.BOMDimensionInfo);
        }
        if (createdObj.offTakeInfo) {
            createdObj.offTakeInfo = JSON.parse(createdObj.offTakeInfo);
        }
        if (createdObj.dualUnitsDimensionsDetails) {
            createdObj.dualUnitsDimensionsDetails = JSON.parse(createdObj.dualUnitsDimensionsDetails);
        }
        if (req.files) {
            if (req.files.drawingArtWorkFile && req.files.drawingArtWorkFile.length > 0) {
                createdObj["drawingArtWorkFile"] = req.files.drawingArtWorkFile[0].filename;
            }
            if (req.files.productionLayoutFile && req.files.productionLayoutFile.length > 0) {
                createdObj["productionLayoutFile"] = req.files.productionLayoutFile[0].filename;
            }
        }
        const itemDetails = await NPDMasterRepository.createDoc(createdObj);
        if (itemDetails) {
            await updateNPDReviewOnDesignSKUCreate(req.user.company, itemDetails.NPDReview, itemDetails.dSKUNo);
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("NPD Master")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create NPD Master", e);
        if (req.files) {
            removeFilesInError(req.files.drawingArtWorkFile);
            removeFilesInError(req.files.productionLayoutFile);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await NPDMasterRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        if (req.body.customerInfo) {
            req.body.customerInfo = JSON.parse(req.body.customerInfo);
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
        if (req.body.costSheetInfo) {
            req.body.costSheetInfo = JSON.parse(req.body.costSheetInfo);
        }
        if (req.body.BOMDimensionInfo) {
            req.body.BOMDimensionInfo = JSON.parse(req.body.BOMDimensionInfo);
        }
        if (req.body.offTakeInfo) {
            req.body.offTakeInfo = JSON.parse(req.body.offTakeInfo);
        }
        if (req.body.dualUnitsDimensionsDetails) {
            req.body.dualUnitsDimensionsDetails = JSON.parse(req.body.dualUnitsDimensionsDetails);
        }
        if (req.files) {
            if (req.files.drawingArtWorkFile && req.files.drawingArtWorkFile.length > 0) {
                if (itemDetails.drawingArtWorkFile) {
                    removeFile(`${req.files.drawingArtWorkFile[0].destination}/${itemDetails.drawingArtWorkFile}`);
                }
                itemDetails.drawingArtWorkFile = req.files.drawingArtWorkFile[0].filename;
            }
            if (req.files.productionLayoutFile && req.files.productionLayoutFile.length > 0) {
                if (itemDetails.productionLayoutFile) {
                    removeFile(`${req.files.productionLayoutFile[0].destination}/${itemDetails.productionLayoutFile}`);
                }
                itemDetails.productionLayoutFile = req.files.productionLayoutFile[0].filename;
            }
        }
        let output = {
            message: MESSAGES.apiSuccessStrings.UPDATE("NPD Master has been")
        };
        if (
            itemDetails &&
            req.body.action == "Converted to SKU" &&
            itemDetails.customerInfo.every(x => x.referenceModel == "Customer")
        ) {
            let SKUCreateObj = JSON.parse(JSON.stringify(itemDetails));
            itemDetails.isConvertedToSKU = true;
            SKUCreateObj.customerInfo = SKUCreateObj.customerInfo.map(x => {
                x.customer = x.reference;
                return x;
            });
            let newSKU = await createSKU(SKUCreateObj);
            if (newSKU) {
                await updateBOMOfDSKUStatus(SKUCreateObj._id, newSKU);
            }
            output = {
                message: `# ${newSKU.SKUNo} has been converted successfully`,
                ...newSKU
            };
        }
        itemDetails = await NPDMasterRepository.updateDoc(itemDetails, req.body);
        return res.success(output);
    } catch (e) {
        console.error("update NPD Master", e);
        if (req.files) {
            removeFilesInError(req.files.drawingArtWorkFile);
            removeFilesInError(req.files.productionLayoutFile);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await NPDMasterRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("NPD Master")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("NPD Master");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById NPD Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await NPDMasterRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("NPD Master");
            return res.unprocessableEntity(errors);
        }
        let autoIncValues = {};
        const SKUCategoryList = await getAllSKUCategory(req.user.company, existing.productCategory);
        if (SKUCategoryList.length > 0) {
            for (const ele of SKUCategoryList) {
                autoIncValues[ele.SKUCategoryName] = getAutoIncrementNumber(
                    ele.SKUCategoryPrefix,
                    "",
                    ele.SKUCategoryAutoIncrement,
                    ele.digit
                );
            }
        } else {
            const autoIncrementedNo = await getAndSetAutoIncrementNo(
                NPD_MASTER.AUTO_INCREMENT_DATA(),
                req.user.company
            );
            autoIncValues[existing.productCategory] = autoIncrementedNo;
        }
        existing.SKUNo = autoIncValues[existing.productCategory];
        return res.success(existing);
    } catch (e) {
        console.error("getById NPD Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            BOM: true
        });
        const costSheetList = await getAllCostSheet(req.user.company, {
            componentType: 1,
            order: 1,
            costElement: 1,
            tooltip: 1,
            componentCode: 1
        });
        const prospectsOptions = await filteredProspectList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(req.user.company)
                }
            },
            {$sort: {prospectName: 1}},
            {
                $project: {
                    customerCode: "$prospectRegistrationCode",
                    customerBillingState: "$correspondenceAddress.state",
                    customerBillingCity: "$correspondenceAddress.city",
                    customerBillingPinCode: "$correspondenceAddress.pinCode",
                    name: "$prospectName",
                    label: "$prospectName",
                    type: "Prospect",
                    currency: ""
                }
            }
        ]);
        const customersOptions = await filteredCustomerList([
            {
                $match: {
                    isCustomerActive: "A",
                    company: ObjectId(req.user.company)
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
                    customerCode: 1,
                    customerBillingState: "$customerBillingAddress.state",
                    customerBillingCity: "$customerBillingAddress.city",
                    customerBillingPinCode: "$customerBillingAddress.pinCode",
                    name: "$customerName",
                    label: "$customerName",
                    type: "Customer",
                    currency: "$customerCurrency"
                }
            }
        ]);
        for (let i = 0; i < prospectsOptions.length; i++) {
            const ele = prospectsOptions[i];
            customersOptions.push(ele);
        }
        const inkList = await ProdItemMaster.getAllInkList(req.user.company);
        const attributesList = await getAllAttributesConfiguration("D-SKU");
        const specificationList = await filteredSpecificationList([
            {$match: {company: ObjectId(req.user.company), status: OPTIONS.defaultStatus.ACTIVE}},
            {$sort: {createdAt: -1}},
            {
                $project: {
                    seq: {$literal: 0},
                    specValue: {$literal: 0},
                    tolerance: {$literal: 0},
                    specificationCode: 1,
                    characteristic: 1,
                    UOM: 1,
                    testStandard: 1,
                    measuringInstrument: 1
                }
            }
        ]);
        itemCategoriesList = itemCategoriesList.map(x => x.category);
        let materialList = await getAllItemsForBOM(req.user.company, itemCategoriesList, {
            item: "$_id",
            referenceModel: "Items",
            itemCode: 1,
            itemName: 1,
            itemDescription: 1,
            UoM: "$orderInfoUOM",
            qtyPerSKUUnit: {$literal: 0},
            isSelect: {$literal: false},
            unitCost: "$supplierDetails.stdCostUom1",
            _id: 0
        });
        const categoryList = await getAllMapCategoryHSN(
            {status: OPTIONS.defaultStatus.ACTIVE, company: req.user.company},
            {HSNCode: 1, HSN: 1, productCategory: 1}
        );
        const NPDOptions = await getAllNPDReviewForVariants(req.user.company);
        const autoIncrementNo = await getAndSetAutoIncrementNo(NPD_MASTER.AUTO_INCREMENT_DATA(), req.user.company);
        let childItems = await ProdItemMaster.getAllProdItemsListForBOM(req.user.company, null, "SKU", {
            item: "$_id",
            referenceModel: "ProductionItem",
            itemCode: 1,
            itemName: 1,
            itemDescription: 1,
            UoM: "$unitOfMeasurement",
            qtyPerSKUUnit: {$literal: 0},
            isSelect: {$literal: false},
            unitCost: {$ifNull: ["$itemCost", 0]},
            _id: 0
        });

        materialList = [...materialList, ...childItems];
        const DSKUList = await this.getAllNPDMaster(
            {company: ObjectId(req.user.company)},
            {
                dSKUNo: 1,
                SKUName: 1,
                SKUDescription: 1,
                primaryUnit: 1,
                _id: 1
            }
        );
        let WXLDimensionsUnit = await getAllModuleMaster(req.user.company, "WXL_DIMENSIONS_UNIT");
        return res.success({
            autoIncrementNo,
            attributesList,
            uomOptions: units.map(x => {
                return {
                    value: x.value,
                    label: x.label
                };
            }),
            customersOptions,
            inkList,
            categoryList,
            NPDOptions,
            DSKUList,
            specificationList,
            materialList,
            costSheetList,
            WXLDimensionsUnit: WXLDimensionsUnit?.map(x => x.value)
        });
    } catch (error) {
        console.error("getAllMasterData", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllPendingDSKUConversionReport = asyncHandler(async (req, res) => {
    try {
        const prospects = await getAllProspectsForNPD(req.user.company);
        const customers = await getAllCustomersForNPD(req.user.company);
        for (let i = 0; i < prospects.length; i++) {
            const ele = prospects[i];
            customers.push(ele);
        }
        const {reference = null, toDate = null, fromDate = null} = req.query;
        let query = {
            isConvertedToSKU: false,
            company: ObjectId(req.user.company),
            ...(!!toDate &&
                !!fromDate && {
                    createdAt: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = getAllPendingDSKUConversionReportAttributes();
        let pipeline = [
            {
                $match: query
            },
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
            },
            {
                $match: {
                    ...(!!reference && {
                        "customerInfo.customerName": reference
                    })
                }
            },
            {
                $lookup: {
                    from: "NPDReview",
                    localField: "NPDReview",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, NPDDate: 1, updatedAt: 1}}],
                    as: "NPDReview"
                }
            },
            {$unwind: "$NPDReview"}
        ];
        let rows = await NPDMasterRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            prospects,
            customers,
            ...rows
        });
    } catch (e) {
        console.error("getAllPendingDSKUConversionReport", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllDSKUToSKUConversionReport = asyncHandler(async (req, res) => {
    try {
        const prospects = await getAllProspectsForNPD(req.user.company);
        const customers = await getAllCustomersForNPD(req.user.company);
        for (let i = 0; i < prospects.length; i++) {
            const ele = prospects[i];
            customers.push(ele);
        }
        const {reference = null, toDate = null, fromDate = null} = req.query;
        let query = {
            isConvertedToSKU: true,
            company: ObjectId(req.user.company),
            ...(!!toDate &&
                !!fromDate && {
                    createdAt: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = getAllDSKUToSKUConversionReportAttributes();
        let pipeline = [
            {
                $match: query
            },
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
            },
            {
                $match: {
                    ...(!!reference && {
                        "customerInfo.customerName": reference
                    })
                }
            },
            {
                $lookup: {
                    from: "NPDReview",
                    localField: "NPDReview",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, NPDDate: 1, updatedAt: 1}}],
                    as: "NPDReview"
                }
            },
            {$unwind: "$NPDReview"}
        ];
        let rows = await NPDMasterRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            customers,
            ...rows
        });
    } catch (e) {
        console.error("getAllDSKUToSKUConversionReport", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllNPDMaster = async (match = {}, project = {}) => {
    try {
        let rows = await NPDMasterRepository.filterNPDMasterList([
            {
                $match: {
                    isActive: "A",
                    ...match
                }
            },
            {
                $project: project
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllNPDMaster", e);
    }
};
exports.getAllNPDMasterByDSKUId = asyncHandler(async (req, res) => {
    try {
        let existing = await NPDMasterRepository.getDocById(req.params.id, {costSheetInfo: 1});
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("NPD Master");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById NPD Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllDSKUInkDetailsForBOMByDSKUId = async (company, DSKUId) => {
    try {
        let rows = await NPDMasterRepository.filterNPDMasterList([
            {
                $match: {
                    isActive: "A",
                    company: ObjectId(company),
                    _id: ObjectId(DSKUId)
                }
            },
            {$project: {mergedDetails: {$concatArrays: ["$inkDetails", "$materialInfo"]}}},
            {
                $unwind: "$mergedDetails"
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
                    qtyPerSKUUnit: "$mergedDetails.qtyPerSKUUnit",
                    qtyPerSKUUnit: {
                        $cond: {
                            if: "$mergedDetails.qtyPerSKUUnit",
                            then: "$mergedDetails.qtyPerSKUUnit",
                            else: {$round: [{$divide: ["$mergedDetails.ink", 1000]}, 5]}
                        }
                    },
                    inkCostPerKg: "$mergedDetails.inkCostPerKg",
                    inkCostPerGm: "$mergedDetails.inkCostPerGm",
                    unitCost: "$mergedDetails.unitCost",
                    type: {
                        $cond: [{$not: ["$mergedDetails.inkId"]}, "materialInfo", "InkInfo"]
                    },
                    partCount: null
                }
            },
            {$sort: {itemCode: 1}}
        ]);
        return rows;
    } catch (e) {
        console.error("getAllInkDetailsForBOM", e);
    }
};
exports.getAllDSKUByCategory = async (category, company, project = {}) => {
    try {
        let rows = await NPDMasterRepository.filterNPDMasterList([
            {
                $match: {productCategory: category, company: ObjectId(company)}
            },
            {$sort: {createdAt: -1}},
            {
                $project: project
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllDSKUByCategory", e);
    }
};

exports.getAllDSKUListByCustomerOrProspectId = async (customerOrProspectId, company, project = {}) => {
    try {
        let rows = await NPDMasterRepository.filterNPDMasterList([
            {$unwind: {path: "$customerInfo", preserveNullAndEmptyArrays: true}},
            {
                $match: {
                    "customerInfo.reference": ObjectId(customerOrProspectId),
                    company: ObjectId(company),
                    isActive: "A"
                }
            },
            {$project: project}
        ]);
        return rows;
    } catch (e) {
        console.error("getAllSKUListByCustomerOrProspectId", e);
    }
};
exports.getAllDSKUByCustomerForJobCard = async (customerOrProspectId, company) => {
    try {
        let rows = await NPDMasterRepository.filterNPDMasterList([
            {$unwind: {path: "$customerInfo", preserveNullAndEmptyArrays: true}},
            {
                $match: {
                    "customerInfo.reference": ObjectId(customerOrProspectId),
                    company: ObjectId(company),
                    isActive: "A"
                }
            },
            {
                $lookup: {
                    from: "NPDReview",
                    localField: "NPDReview",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, NPD: 1, NPDNo: 1, NPDDate: 1}}],
                    as: "NPDReview"
                }
            },
            {$unwind: "$NPDReview"},
            {
                $lookup: {
                    from: "NPD",
                    localField: "NPDReview.NPD",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, requestedQty: 1}}],
                    as: "NPDReview.NPD"
                }
            },
            {$unwind: "$NPDReview.NPD"},
            {
                $project: {
                    NPD: "$NPDReview.NPD._id",
                    NPDNo: "$NPDReview.NPDNo",
                    NPDDate: "$NPDReview.NPDDate",
                    code: "#ffc107",
                    DSKU: "$_id",
                    DSKUNo: "$dSKUNo",
                    DSKUName: "$SKUName",
                    DSKUDescription: "$SKUDescription",
                    drawing: "$artWorkHyperLink",
                    UOM: "$primaryUnit",
                    balQty: "$NPDReview.NPD.requestedQty",
                    batchQty: {$ifNull: ["$batchQty", 0]},
                    _id: 0
                }
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllDSKUByCustomerForJobCard", e);
    }
};

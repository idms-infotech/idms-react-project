const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/stores/goodInwardEntryModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {updateMRNStatusOnGIN} = require("../../quality/Mrn/Mrn");
const {default: mongoose} = require("mongoose");
const {getFirstDateOfCurrentFiscalYear, getLastDateOfCurrentFiscalYear} = require("../../../../utilities/utility");
const {dateToAnyFormat} = require("../../../../helpers/dateTime");
// const {getGINMailConfig} = require("./goodsInwardEntryMail");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {GOOD_INWARD_ENTRY} = require("../../../../mocks/schemasConstant/storesConstant");
const {getAllGoodInwardEntryAttributes} = require("../../../../models/stores/helpers/goodInwardEntryHelper");
const GINRepository = require("../../../../models/stores/repository/goodInwardEntryRepository");
const ObjectId = mongoose.Types.ObjectId;
const MailTriggerRepository = require("../../../../models/settings/repository/mailTriggerRepository");
const {STORES_MAIL_CONST} = require("../../../../mocks/mailTriggerConstants");
const {GOODS_TRANSFER_REQUEST_DEPT, COMPANY_SUPPLIER_ID} = require("../../../../mocks/constantData");
const InventoryRepository = require("../../../../models/stores/repository/inventoryCorrectionRepository");
const purchaseOrderRepository = require("../../../../models/purchase/repository/purchaseOrderRepository");
const {setConversion} = require("../../../../helpers/utility");
const InventoryDepartmentsRepository = require("../../../../models/settings/repository/inventoryDepartmentsRepository");
const {filteredSubModuleManagementList} = require("../../../../models/settings/repository/subModuleRepository");
const {SOURCE_DOCUMENT} = require("../../../../mocks/constantData");
const {filteredInvZoneConfigList} = require("../../../../models/planning/repository/invZoneConfigRepository");
const {filteredMRNList} = require("../../../../models/quality/repository/mrnRepository");
const {
    filteredMaterialRevalidationList
} = require("../../../../models/quality/repository/materialRevalidationRepository");
const {filteredDeliveryChallanList} = require("../../../../models/purchase/repository/deliveryChallanRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const MaterialRevalidationRepository = require("../../../../models/quality/repository/materialRevalidationRepository");
const DeliveryChallanRepository = require("../../../../models/purchase/repository/deliveryChallanRepository");
// @desc    getAll GoodsInwardEntry Record
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllGoodInwardEntryAttributes();
        if (req.query.excel == "true") {
            project = getAllGoodInwardEntryAttributes();
        }
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1}}],
                    as: "supplier"
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "GINDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                supplierName: 1,
                                itemCode: 1,
                                itemName: 1,
                                itemPacking: 1,
                                primaryUnit: 1,
                                spin: 1,
                                hsn: 1,
                                gst: 1,
                                igst: 1,
                                sgst: 1,
                                cgst: 1,
                                ugst: 1
                            }
                        }
                    ],
                    as: "item"
                }
            }
        ];
        let rows = await GINRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllServicePurchaseOrder", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    create GoodsInwardEntry new Record
exports.create = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findOne(
            {
                MRNNumber: req.body.MRNNumber
            },
            {_id: 1}
        );
        if (existing) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("Goods Inward Entry");
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const saveObj = new Model(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            await this.insertInventory(itemDetails._id, itemDetails.MRNNumber.valueOf(), req.user);
            if (itemDetails.refMRN == "MaterialRevalidation") {
                await MaterialRevalidationRepository.findAndUpdateDoc(
                    {_id: itemDetails.MRNNumber},
                    {MRVStatus: OPTIONS.defaultStatus.CLOSED}
                );
            } else if (itemDetails.refMRN == "DeliveryChallan") {
                await DeliveryChallanRepository.findAndUpdateDoc(
                    {_id: itemDetails.MRNNumber},
                    {status: OPTIONS.defaultStatus.CLOSED}
                );
            }
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Goods Inward Entry")
            });
            // let mailCreateObj = {
            //     ginId: itemDetails._id,
            //     company: req.user.company,
            //     mailAction: "Create"
            // };
            // getGINMailConfig(mailCreateObj);
            let mailTriggerCreateObj = {
                subModuleId: itemDetails._id,
                action: "created",
                company: req.user.company,
                mailAction: "Create",
                collectionName: GOOD_INWARD_ENTRY.COLLECTION_NAME,
                message: `Goods Inward Entry Created - ${itemDetails?.GINNumber}`,
                module: STORES_MAIL_CONST.GIN.MODULE,
                subModule: STORES_MAIL_CONST.GIN.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Goods Inward Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.insertInventory = async (GINId, MRNId, user) => {
    try {
        let MRNData = await updateMRNStatusOnGIN(MRNId);
        let invDept = await InventoryDepartmentsRepository.findOneDoc(
            {
                departmentType: GOODS_TRANSFER_REQUEST_DEPT.STORES
            },
            {
                _id: 1
            }
        );

        let inventoryInsertArray = await GINRepository.filteredGINList([
            {
                $match: {_id: ObjectId(GINId)}
            },
            {
                $unwind: {
                    path: "$GINDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "GINDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                referenceModel: "Items",
                                itemCode: 1,
                                itemName: 1,
                                itemDescription: 1,
                                width: "$dualUnitsDimensionsDetails.widthInMM",
                                length: {
                                    $round: [{$multiply: ["$dualUnitsDimensionsDetails.lengthInM", 1000]}, 2]
                                },
                                SQM: "$dualUnitsDimensionsDetails.sqmPerRoll",
                                shelfLife: 1
                            }
                        }
                    ],
                    as: "itemInfo"
                }
            },
            {
                $lookup: {
                    from: "ProductionItem",
                    localField: "GINDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                referenceModel: "ProductionItem",
                                itemCode: 1,
                                itemName: 1,
                                itemDescription: 1,
                                width: "$dualUnitsDimensionsDetails.widthInMM",
                                length: {
                                    $round: [{$multiply: ["$dualUnitsDimensionsDetails.lengthInM", 1000]}, 2]
                                },
                                SQM: "$dualUnitsDimensionsDetails.sqmPerRoll",
                                shelfLife: 1
                            }
                        }
                    ],
                    as: "childItemInfo"
                }
            },
            {
                $addFields: {
                    itemInfo: {$concatArrays: ["$itemInfo", "$childItemInfo"]}
                }
            },
            {
                $unwind: {
                    path: "$itemInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    expiryDate: {
                        $dateAdd: {
                            startDate: "$GINDate",
                            unit: "month",
                            amount: "$itemInfo.shelfLife"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    company: user.company,
                    createdBy: user.sub,
                    updatedBy: user.sub,
                    GIN: "$_id",
                    GINDate: 1,
                    MRN: "$MRNNumber",

                    supplier: 1,
                    referenceModelSC: "$referenceModel",
                    supplierName: 1,
                    MRNNumber: {$ifNull: [MRNData?.MRNNumber, "$docNo"]},
                    MRNDate: {$ifNull: [MRNData?.MRNDate, "$MRNDate"]},
                    ICStatus: "IC Created",
                    // GINLineNumber: ele.GINLineNumber,
                    UOM: "$GINDetails.UOM",
                    primaryToSecondaryConversion: "$GINDetails.primaryToSecondaryConversion",
                    secondaryToPrimaryConversion: "$GINDetails.secondaryToPrimaryConversion",
                    primaryUnit: "$GINDetails.primaryUnit",
                    secondaryUnit: "$GINDetails.secondaryUnit",
                    conversionOfUnits: "$GINDetails.conversionOfUnits",
                    item: "$itemInfo._id",
                    referenceModel: "$itemInfo.referenceModel",
                    itemCode: "$itemInfo.itemCode",
                    itemName: "$itemInfo.itemName",
                    itemDescription: "$itemInfo.itemDescription",
                    width: "$itemInfo.width",
                    length: "$itemInfo.length",
                    SQM: "$itemInfo.SQM",
                    expiryDate: {$ifNull: ["$expiryDate", null]},
                    itemType: "$GINDetails.itemType",
                    updatedQty: {$literal: 0},
                    closedIRQty: "$GINDetails.GINQty",
                    standardRate: "$GINDetails.standardRate",
                    purchaseRate: "$GINDetails.purchaseRate",
                    invoiceRate: "$GINDetails.invoiceRate",
                    purchaseRateUSD: "$GINDetails.purchaseRateUSD",
                    purchaseRatINR: "$GINDetails.purchaseRatINR",
                    lineValueINR: "$GINDetails.lineValueINR",
                    batchDate: "$GINDetails.batchDate",
                    deliveryLocation: "$GINDetails.deliveryLocation",
                    storageLocationMapping: {
                        subLocation: "$GINDetails.subLocation",
                        rowNo: "$GINDetails.rowNo",
                        rackNo: "$GINDetails.rackNo",
                        binNo: "$GINDetails.binNo",
                        otherId: "$GINDetails.otherId"
                    },
                    department: GOODS_TRANSFER_REQUEST_DEPT.STORES,
                    departmentName: GOODS_TRANSFER_REQUEST_DEPT.STORES,
                    departmentId: invDept?._id,
                    refDepartment: "InventoryDepartments",
                    type: "InventoryCorrection",
                    invZoneId: "$GINDetails.inventoryZoneId",
                    invZoneName: "$GINDetails.invZoneName"
                }
            }
        ]);
        // console.log("inventoryInsertArray", inventoryInsertArray);
        if (inventoryInsertArray?.length) {
            for (const ele of inventoryInsertArray) {
                if (
                    ele?.secondaryUnit &&
                    ele?.secondaryUnit != "-" &&
                    ele?.primaryUnit &&
                    (ele?.primaryToSecondaryConversion || ele?.secondaryToPrimaryConversion)
                ) {
                    let UOMConvertData = {
                        UOM: ele?.secondaryUnit,
                        quantity: ele?.closedIRQty,
                        primaryUnit: ele?.primaryUnit,
                        secondaryUnit: ele?.secondaryUnit,
                        primaryToSecondaryConversion: ele?.primaryToSecondaryConversion,
                        secondaryToPrimaryConversion: ele?.secondaryToPrimaryConversion
                    };
                    if (ele?.UOM != ele?.secondaryUnit) {
                        ele.closedIRQty = setConversion(UOMConvertData);
                        if (ele?.primaryToSecondaryConversion) {
                            ele.purchaseRate = +(+ele.purchaseRate / +ele.primaryToSecondaryConversion).toFixed(3);
                            ele.purchaseRatINR = +(+ele.purchaseRatINR / +ele.primaryToSecondaryConversion).toFixed(3);
                        }
                        if (ele?.secondaryToPrimaryConversion) {
                            ele.purchaseRate = +(+ele.purchaseRate * +ele.secondaryToPrimaryConversion).toFixed(3);
                            ele.purchaseRatINR = +(+ele.purchaseRatINR * +ele.secondaryToPrimaryConversion).toFixed(3);
                        }
                        ele.UOM = ele?.secondaryUnit;
                    }
                }
            }
            await InventoryRepository.insertManyDoc(inventoryInsertArray);
        }
    } catch (error) {
        console.error("error", error);
    }
};
exports.insertPPICInventory = async (GINId, MRNId, excelJsonObj) => {
    try {
        let MRNData = await updateMRNStatusOnGIN(MRNId);
        let inventoryInsertArray = await GINRepository.filteredGINList([
            {
                $match: {_id: ObjectId(GINId)}
            },
            {
                $unwind: {
                    path: "$GINDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "GINDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                itemCode: 1,
                                itemName: 1,
                                itemDescription: 1,
                                width: "$dualUnitsDimensionsDetails.widthInMM",
                                length: {
                                    $round: [{$multiply: ["$dualUnitsDimensionsDetails.lengthInM", 1000]}, 2]
                                },
                                SQM: "$dualUnitsDimensionsDetails.sqmPerRoll",
                                shelfLife: 1
                            }
                        }
                    ],
                    as: "GINDetails.item"
                }
            },
            {
                $unwind: {
                    path: "$GINDetails.item",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    expiryDate: {
                        $dateAdd: {
                            startDate: "$GINDate",
                            unit: "month",
                            amount: "$GINDetails.item.shelfLife"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    company: excelJsonObj.company,
                    createdBy: excelJsonObj.sub,
                    updatedBy: excelJsonObj.sub,
                    GIN: "$_id",
                    GINDate: 1,
                    MRN: "$MRNNumber",
                    supplier: 1,
                    MRNNumber: MRNData?.MRNNumber,
                    MRNDate: MRNData?.MRNDate,
                    ICStatus: "IC Created",
                    // GINLineNumber: ele.GINLineNumber,
                    UOM: excelJsonObj.UOM,
                    primaryToSecondaryConversion: excelJsonObj.primaryToSecondaryConversion,
                    primaryUnit: excelJsonObj.primaryUnit,
                    secondaryUnit: excelJsonObj.secondaryUnit,
                    conversionOfUnits: excelJsonObj.conversionOfUnits,
                    item: "$GINDetails.item._id",
                    referenceModel: "Items",
                    itemCode: "$GINDetails.item.itemCode",
                    itemName: excelJsonObj.itemName,
                    itemDescription: excelJsonObj.itemDescription,
                    width: excelJsonObj.width,
                    length: excelJsonObj.length,
                    SQM: excelJsonObj.SQM,
                    expiryDate: {$ifNull: ["$expiryDate", null]},
                    itemType: "$GINDetails.itemType",
                    // openIRQty: "$GINDetails.GINQty",
                    updatedQty: {$literal: 0},
                    closedIRQty: "$GINDetails.GINQty",
                    standardRate: "$GINDetails.standardRate",
                    purchaseRate: "$GINDetails.purchaseRate",
                    purchaseRateUSD: "$GINDetails.purchaseRateUSD",
                    purchaseRatINR: "$GINDetails.purchaseRatINR",
                    lineValueINR: "$GINDetails.lineValueINR",
                    // releasedQty: "$GINDetails.releasedQty",
                    // rejectedQty: "$GINDetails.rejectedQty",
                    batchDate: "$GINDetails.batchDate",
                    deliveryLocation: 1,
                    storageLocationMapping: 1,
                    department: GOODS_TRANSFER_REQUEST_DEPT.PLANNING,
                    type: "InventoryCorrection",
                    formType: "Child"
                }
            }
        ]);
        if (inventoryInsertArray.length) {
            await InventoryRepository.insertManyDoc(inventoryInsertArray);
        }
    } catch (error) {
        console.error("error", error);
    }
};
// @desc    update GoodsInwardEntry  Record
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
        if (itemDetails.GINStatus == "Report Generated") {
            await updateMRNStatusOnGIN(itemDetails.MRNNumber.valueOf());
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Goods Inward Entry has been")
        });
    } catch (e) {
        console.error("update Goods Inward Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById GoodsInwardEntry Record
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Goods Inward Entry")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Goods Inward Entry");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Goods Inward Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById GoodsInwardEntry Record
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await GINRepository.filteredGINList([
            {
                $match: {_id: ObjectId(req.params.id)}
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "GINDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                itemName: 1,
                                itemCode: 1,
                                itemDescription: 1
                            }
                        }
                    ],
                    as: "itemInfo"
                }
            },
            {
                $lookup: {
                    from: "ProductionItem",
                    localField: "GINDetails.item",
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
                $lookup: {
                    from: "MRN",
                    localField: "MRNNumber",
                    foreignField: "_id",
                    pipeline: [{$project: {MRNNumber: 1}}],
                    as: "MRNInfo"
                }
            },
            {
                $unwind: {
                    path: "$MRNInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    itemInfo: {
                        $concatArrays: ["$itemInfo", "$childItem"]
                    },
                    sourceDoc: {$ifNull: ["$sourceDoc", SOURCE_DOCUMENT.MRN]},
                    docNo: {$ifNull: ["$docNo", "$MRNInfo.MRNNumber"]}
                }
            },
            {
                $addFields: {
                    GINDetails: {
                        $map: {
                            input: "$GINDetails",
                            as: "detail",
                            in: {
                                $mergeObjects: [
                                    "$$detail",
                                    {
                                        item: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$itemInfo",
                                                        as: "itemInfo",
                                                        cond: {$eq: ["$$itemInfo._id", "$$detail.item"]}
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    },
                                    {
                                        MRNNumber: {$ifNull: ["$$detail.MRNNumber", "$docNo"]},
                                        deliveryLocation: {$ifNull: ["$$detail.deliveryLocation", "$deliveryLocation"]},
                                        subLocation: {
                                            $ifNull: ["$$detail.subLocation", "$storageLocationMapping.subLocation"]
                                        },
                                        rowNo: {$ifNull: ["$$detail.rowNo", "$storageLocationMapping.rowNo"]},
                                        rackNo: {$ifNull: ["$$detail.rackNo", "$storageLocationMapping.rackNo"]},
                                        binNo: {$ifNull: ["$$detail.binNo", "$storageLocationMapping.binNo"]}
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                supplierName: 1
                            }
                        }
                    ],
                    as: "supplier"
                }
            },
            {
                $unwind: {
                    path: "$supplier",
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);
        if (!existing.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("GoodsInwardEntry");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing[0]);
    } catch (e) {
        console.error("getById Goods Inward Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData GoodsInwardEntry Record
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
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
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...GOOD_INWARD_ENTRY.AUTO_INCREMENT_DATA()},
            req.user.company
        );
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
                    inventoryZoneId: "$_id",
                    invZoneName: 1
                }
            }
        ]);
        const subLocationsOptions = await getAllModuleMaster(req.user.company, "SUB_LOCATIONS");
        return res.success({
            autoIncrementNo,
            featureConfig,
            sourceDocumentOption: SOURCE_DOCUMENT.OPTIONS(),
            invZoneOptions,
            subLocationsOptions
        });
    } catch (error) {
        console.error("getAllMasterData Goods Inward Entry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

/** Dashboard Function - End */
exports.getGINCounts = async company => {
    try {
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GINDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: "$GINStatus",
                    counts: {$sum: 1}
                }
            }
        ]);
        return result[0]?.counts || 0;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};

exports.getTotalGINCreatedPerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GINDate"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                matchDate: currentDate
            }
        },
        {
            $group: {
                _id: null,
                count: {$sum: 1}
            }
        },
        {
            $project: {
                _id: 0,
                count: 1
            }
        }
    ]);
    return rows[0]?.count || 0;
};
exports.createDirectGIN = async (MRN, POId) => {
    try {
        let PODetails = {};
        if (POId) {
            PODetails = await purchaseOrderRepository.findOneDoc(
                {_id: ObjectId(POId)},
                {
                    purchaseCategory: 1
                }
            );
        }
        let createdObj = {
            company: MRN.company,
            createdBy: MRN.createdBy,
            updatedBy: MRN.updatedBy,
            GINDate: new Date(),
            GINNumber: "0000000",
            MRNNumber: MRN._id,
            purchaseCategory: PODetails?.purchaseCategory,
            supplier: MRN.supplier,
            referenceModel: MRN.referenceModel,
            supplierName: MRN.supplierName,
            currency: MRN.currency,
            supplierInvoice: MRN.supplierInvoice ?? "-",
            supplierInvoiceDate: MRN.supplierDate ? new Date(MRN.supplierDate) : new Date(),
            deliveryLocation: MRN.deliveryLocation,
            storageLocationMapping: MRN.storageLocationMapping,
            GINDetails: MRN.MRNDetails.map((ele, idx) => {
                return {
                    item: ele.item,
                    referenceModel: ele?.referenceModel,
                    GINLineNumber: idx + 1,
                    mrnLineNumber: ele.MRNLineNumber,
                    itemType: ele.itemType,
                    UOM: ele.UOM,
                    primaryToSecondaryConversion: ele.primaryToSecondaryConversion,
                    secondaryToPrimaryConversion: ele.secondaryToPrimaryConversion,
                    primaryUnit: ele.primaryUnit,
                    secondaryUnit: ele.secondaryUnit,
                    conversionOfUnits: ele.conversionOfUnits,
                    GINQty: ele.releasedQty,
                    standardRate: ele.standardRate,
                    purchaseRate: ele.purchaseRate,
                    invoiceRate: ele.invoiceRate,
                    purchaseRateUSD: ele.purchaseRate,
                    purchaseRatINR: ele.purchaseRate * 1,
                    lineValueINR: ele.releasedQty * ele.purchaseRate * 1,
                    batchDate: ele.batchDate ? new Date(ele.batchDate) : new Date(),
                    balancedQty: 0,
                    rejectedQty: 0,
                    releasedQty: ele.releasedQty ?? 0,
                    deliveryLocation: MRN.deliveryLocation
                };
            })
        };
        // console.log("GIN createdObj", JSON.stringify(createdObj));
        const GIN = await GINRepository.createDoc(createdObj);
        // console.log("GIN", GIN);
        await this.insertInventory(GIN._id, GIN.MRNNumber.valueOf(), {
            company: GIN.company,
            sub: GIN.createdBy,
            sub: GIN.updatedBy
        });

        return;
    } catch (e) {
        console.error("create Goods Inward Entry", e);
    }
};

exports.migrateGINData = async () => {
    try {
        let bulkJSON = await GINRepository.filteredGINList([
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1, supplierCurrency: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"}
        ]);
        for (const obj of bulkJSON) {
            console.log("GIN Migration ongoing...");
            if (obj) {
                let existing = await GINRepository.getDocById(obj._id);
                if (existing) {
                    existing.referenceModel = "Supplier";
                    existing.supplierName = obj.supplier.supplierName;
                    existing.GINDetails = existing.GINDetails.map(x => {
                        x.invoiceRate = x.purchaseRate;
                        return x;
                    });
                }
                await existing.save();
            }
        }
        console.log("GIN Migration SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};

exports.getAllSourceDoc = asyncHandler(async (req, res) => {
    try {
        const {sourceDoc = null} = req.query;
        let rows = [];
        if (sourceDoc == SOURCE_DOCUMENT.MRN) {
            rows = await filteredMRNList([
                {
                    $match: {
                        MRNStatus: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED]},
                        company: ObjectId(req.user.company)
                    }
                },
                {
                    $lookup: {
                        from: "Supplier",
                        localField: "supplier",
                        foreignField: "_id",
                        pipeline: [
                            {
                                $project: {
                                    supplierPurchaseType: 1,
                                    categoryType: 1,
                                    supplierCurrency: 1
                                }
                            }
                        ],
                        as: "supplierInfo"
                    }
                },
                {
                    $lookup: {
                        from: "Customer",
                        localField: "supplier",
                        foreignField: "_id",
                        pipeline: [
                            {
                                $project: {
                                    supplierPurchaseType: "$customerCategory",
                                    categoryType: "$categoryType",
                                    supplierCurrency: "$customerCurrency"
                                }
                            }
                        ],
                        as: "customerInfo"
                    }
                },
                {
                    $addFields: {
                        supplierInfo: {$concatArrays: ["$supplierInfo", "$customerInfo"]}
                    }
                },
                {
                    $unwind: {
                        path: "$supplierInfo",
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $project: {
                        _id: 0,
                        MRNNumber: "$_id",
                        refMRN: "MRN",
                        docNo: "$MRNNumber",
                        MRNDate: 1,
                        purchaseCategory: "$supplierInfo.supplierPurchaseType",
                        categoryType: "$supplierInfo.categoryType",
                        supplier: 1,
                        referenceModel: 1,
                        supplierName: 1,
                        supplierInvoice: 1,
                        supplierInvoiceDate: 1,
                        currency: "$supplierInfo.supplierCurrency"
                    }
                }
            ]);
        } else if (sourceDoc == SOURCE_DOCUMENT.MRV) {
            rows = await filteredMaterialRevalidationList([
                {
                    $match: {
                        MRVStatus: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED]},
                        company: ObjectId(req.user.company)
                    }
                },
                {
                    $addFields: {
                        firstMRVDetails: {$first: "$MRVDetails"}
                    }
                },
                {
                    $addFields: {
                        supplier: "$firstMRVDetails.supplier",
                        referenceModel: "$firstMRVDetails.supplierRef"
                    }
                },
                {
                    $lookup: {
                        from: "Supplier",
                        localField: "supplier",
                        foreignField: "_id",
                        pipeline: [
                            {
                                $project: {
                                    supplierPurchaseType: 1,
                                    categoryType: 1,
                                    supplierCurrency: 1,
                                    supplierName: 1
                                }
                            }
                        ],
                        as: "supplierInfo"
                    }
                },
                {
                    $lookup: {
                        from: "Customer",
                        localField: "supplier",
                        foreignField: "_id",
                        pipeline: [
                            {
                                $project: {
                                    supplierName: "$customerName",
                                    supplierPurchaseType: "$customerCategory",
                                    categoryType: "$categoryType",
                                    supplierCurrency: "$customerCurrency"
                                }
                            }
                        ],
                        as: "customerInfo"
                    }
                },
                {
                    $addFields: {
                        supplierInfo: {$concatArrays: ["$supplierInfo", "$customerInfo"]}
                    }
                },
                {
                    $unwind: {
                        path: "$supplierInfo",
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $project: {
                        _id: 0,
                        MRNNumber: "$_id",
                        refMRN: "MaterialRevalidation",
                        docNo: "$MRVNumber",
                        MRVDate: 1,
                        purchaseCategory: "$supplierInfo.supplierPurchaseType",
                        categoryType: "$supplierInfo.categoryType",
                        supplier: "$supplier",
                        referenceModel: "$referenceModel",
                        supplierName: "$supplierInfo.supplierName",
                        supplierInvoice: {$literal: null},
                        supplierInvoiceDate: new Date(),
                        currency: "$supplierInfo.supplierCurrency"
                    }
                }
            ]);
        } else if (sourceDoc == SOURCE_DOCUMENT.DC) {
            rows = await filteredDeliveryChallanList([
                {
                    $match: {
                        status: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED]},
                        company: ObjectId(req.user.company)
                    }
                },
                {
                    $lookup: {
                        from: "Supplier",
                        pipeline: [
                            {
                                $match: {
                                    _id: ObjectId(COMPANY_SUPPLIER_ID)
                                }
                            },
                            {
                                $project: {
                                    supplierPurchaseType: 1,
                                    categoryType: 1,
                                    supplierCurrency: 1
                                }
                            }
                        ],
                        as: "supplierInfo"
                    }
                },
                {
                    $unwind: {
                        path: "$supplierInfo",
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $project: {
                        _id: 0,
                        MRNNumber: "$_id",
                        refMRN: "DeliveryChallan",
                        docNo: "$DCNo",
                        MRVDate: 1,
                        purchaseCategory: "$supplierInfo.supplierPurchaseType",
                        categoryType: "$supplierInfo.categoryType",
                        supplier: COMPANY_SUPPLIER_ID,
                        referenceModel: "Supplier",
                        supplierName: "$placeOfSupply",
                        supplierInvoice: {$literal: null},
                        supplierInvoiceDate: new Date(),
                        currency: "$supplierInfo.supplierCurrency"
                    }
                }
            ]);
        }

        return res.success(rows);
    } catch (error) {
        console.error("getAllSourceDoc Goods Inward Entry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getSourceItemsByDocId = asyncHandler(async (req, res) => {
    try {
        const {docId = null, sourceDoc = null} = req.query;
        let rows = [];
        if (sourceDoc == SOURCE_DOCUMENT.MRN) {
            rows = await filteredMRNList([
                {
                    $match: {
                        _id: ObjectId(docId)
                    }
                },
                {
                    $unwind: "$MRNDetails"
                },
                {
                    $lookup: {
                        from: "Items",
                        localField: "MRNDetails.item",
                        foreignField: "_id",
                        pipeline: [{$project: {itemName: 1, itemCode: 1, itemDescription: 1}}],
                        as: "itemInfo"
                    }
                },
                {
                    $lookup: {
                        from: "ProductionItem",
                        localField: "MRNDetails.item",
                        foreignField: "_id",
                        pipeline: [{$project: {itemName: 1, itemCode: 1, itemDescription: 1}}],
                        as: "prodItemInfo"
                    }
                },
                {
                    $addFields: {
                        itemInfo: {$concatArrays: ["$itemInfo", "$prodItemInfo"]}
                    }
                },
                {
                    $unwind: "$itemInfo"
                },
                {
                    $match: {
                        "MRNDetails.releasedQty": {$gt: 0}
                    }
                },
                {
                    $lookup: {
                        from: "GRN",
                        localField: "GRNNumber",
                        foreignField: "_id",
                        pipeline: [{$project: {_id: 0, storageLocationMapping: 1}}],
                        as: "GRNNumber"
                    }
                },
                {$unwind: "$GRNNumber"},
                {
                    $project: {
                        _id: 0,
                        GINLineNumber: {$literal: null},
                        MRNLineNumber: "$MRNDetails.MRNLineNumber",
                        item: "$MRNDetails.item",
                        referenceModel: "$MRNDetails.referenceModel",
                        itemName: "$itemInfo.itemName",
                        itemCode: "$itemInfo.itemCode",
                        itemDescription: "$itemInfo.itemDescription",
                        itemType: "$MRNDetails.itemType",
                        primaryToSecondaryConversion: "$MRNDetails.primaryToSecondaryConversion",
                        secondaryToPrimaryConversion: "$MRNDetails.secondaryToPrimaryConversion",
                        primaryUnit: "$MRNDetails.primaryUnit",
                        secondaryUnit: "$MRNDetails.secondaryUnit",
                        conversionOfUnits: "$MRNDetails.conversionOfUnits",
                        UOM: "$MRNDetails.UOM",
                        GINQty: "$MRNDetails.releasedQty",
                        standardRate: "$MRNDetails.standardRate",
                        purchaseRate: "$MRNDetails.purchaseRate",
                        purchaseRateUSD: "$MRNDetails.purchaseRate",
                        purchaseRatINR: "$MRNDetails.purchaseRate",
                        lineValueINR: {$multiply: ["$MRNDetails.releasedQty", "$MRNDetails.purchaseRate"]},
                        releasedQty: "$MRNDetails.releasedQty",
                        rejectedQty: "$MRNDetails.rejectedQty",
                        batchDate: "$MRNDetails.batchDate",
                        MRNNumber: 1,
                        inventoryZoneId: "66ee25dbbadf15f481a1f25b",
                        invZoneName: "Main Store",
                        deliveryLocation: 1,
                        subLocation: "$GRNNumber.storageLocationMapping.subLocation",
                        rowNo: "$GRNNumber.storageLocationMapping.rowNo",
                        rackNo: "$GRNNumber.storageLocationMapping.rackNo",
                        binNo: "$GRNNumber.storageLocationMapping.binNo"
                    }
                }
            ]);
        } else if (sourceDoc == SOURCE_DOCUMENT.MRV) {
            rows = await filteredMaterialRevalidationList([
                {
                    $match: {
                        _id: ObjectId(docId)
                    }
                },
                {
                    $unwind: "$MRVDetails"
                },
                {
                    $match: {
                        "MRVDetails.releasedQty": {$gt: 0}
                    }
                },
                {
                    $project: {
                        _id: 0,
                        GINLineNumber: {$literal: null},
                        MRNLineNumber: {$literal: null},
                        item: "$MRVDetails.item",
                        referenceModel: "$MRVDetails.referenceModel",
                        itemName: "$MRVDetails.itemName",
                        itemCode: "$MRVDetails.itemCode",
                        itemDescription: "$MRVDetails.itemDescription",
                        itemType: "$MRVDetails.itemType",
                        primaryToSecondaryConversion: "$MRVDetails.primaryToSecondaryConversion",
                        secondaryToPrimaryConversion: "$MRVDetails.secondaryToPrimaryConversion",
                        primaryUnit: "$MRVDetails.primaryUnit",
                        secondaryUnit: "$MRVDetails.secondaryUnit",
                        conversionOfUnits: "$MRVDetails.conversionOfUnits",
                        UOM: "$MRVDetails.UOM",
                        GINQty: "$MRVDetails.releasedQty",
                        standardRate: "$MRVDetails.standardRate",
                        purchaseRate: "$MRVDetails.purchaseRate",
                        purchaseRateUSD: "$MRVDetails.purchaseRate",
                        purchaseRatINR: "$MRVDetails.purchaseRate",
                        lineValueINR: {$multiply: ["$MRVDetails.releasedQty", "$MRVDetails.purchaseRate"]},
                        releasedQty: "$MRVDetails.releasedQty",
                        rejectedQty: "$MRVDetails.rejectedQty",
                        batchDate: "$MRVDetails.batchDate",
                        MRNNumber: "$MRVDetails.MRNNumber",
                        inventoryZoneId: "66ee25dbbadf15f481a1f25b",
                        invZoneName: "Main Store",
                        deliveryLocation: "$location",
                        subLocation: {$literal: null},
                        rowNo: {$literal: null},
                        rackNo: {$literal: null},
                        binNo: {$literal: null}
                    }
                }
            ]);
        } else if (sourceDoc == SOURCE_DOCUMENT.DC) {
            rows = await filteredDeliveryChallanList([
                {
                    $match: {
                        _id: ObjectId(docId)
                    }
                },
                {
                    $unwind: "$itemDetails"
                },
                {
                    $match: {
                        "itemDetails.qtyTransfer": {$gt: 0}
                    }
                },
                {
                    $lookup: {
                        from: "Items",
                        localField: "itemDetails.item",
                        foreignField: "_id",
                        pipeline: [
                            {
                                $project: {
                                    _id: 0,
                                    itemType: 1,
                                    primaryToSecondaryConversion: 1,
                                    secondaryToPrimaryConversion: 1,
                                    primaryUnit: 1,
                                    secondaryUnit: 1,
                                    conversionOfUnits: 1
                                }
                            }
                        ],
                        as: "itemInfo"
                    }
                },
                {
                    $lookup: {
                        from: "ProductionItem",
                        localField: "itemDetails.item",
                        foreignField: "_id",
                        pipeline: [
                            {
                                $project: {
                                    _id: 0,
                                    itemType: "$prodItemCategory",
                                    primaryToSecondaryConversion: 1,
                                    secondaryToPrimaryConversion: 1,
                                    primaryUnit: 1,
                                    secondaryUnit: 1,
                                    conversionOfUnits: 1
                                }
                            }
                        ],
                        as: "prodItemInfo"
                    }
                },
                {
                    $addFields: {
                        itemInfo: {$concatArrays: ["$itemInfo", "$prodItemInfo"]}
                    }
                },
                {
                    $unwind: "$itemInfo"
                },
                {
                    $project: {
                        _id: 0,
                        GINLineNumber: {$literal: null},
                        MRNLineNumber: {$literal: null},
                        item: "$itemDetails.item",
                        referenceModel: "$itemDetails.referenceModel",
                        itemName: "$itemDetails.itemName",
                        itemCode: "$itemDetails.itemCode",
                        itemDescription: "$itemDetails.itemDescription",
                        itemType: "$itemInfo.itemType",
                        primaryToSecondaryConversion: "$itemInfo.primaryToSecondaryConversion",
                        secondaryToPrimaryConversion: "$itemInfo.secondaryToPrimaryConversion",
                        primaryUnit: "$itemInfo.primaryUnit",
                        secondaryUnit: "$itemInfo.secondaryUnit",
                        conversionOfUnits: "$itemInfo.conversionOfUnits",
                        UOM: "$itemDetails.UOM",
                        GINQty: "$itemDetails.qtyTransfer",
                        standardRate: "$itemDetails.unitRate",
                        purchaseRate: "$itemDetails.unitRate",
                        purchaseRateUSD: "$itemDetails.unitRate",
                        purchaseRatINR: "$itemDetails.unitRate",
                        lineValueINR: "$taxableAmt",
                        releasedQty: "$itemDetails.qtyTransfer",
                        rejectedQty: {$literal: 0},
                        batchDate: "$itemDetails.batchDate",
                        MRNNumber: "$DCNo",
                        inventoryZoneId: "66ee25dbbadf15f481a1f25b",
                        invZoneName: "Main Store",
                        deliveryLocation: "$nameOfConsignee",
                        subLocation: {$literal: null},
                        rowNo: {$literal: null},
                        rackNo: {$literal: null},
                        binNo: {$literal: null}
                    }
                }
            ]);
        }
        return res.success(rows);
    } catch (error) {
        console.error("getAllSourceDoc Goods Inward Entry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

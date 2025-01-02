const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/stores/inventoryCorrectionModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getFirstDateOfCurrentFiscalYear, getLastDateOfCurrentFiscalYear} = require("../../../../utilities/utility");
const {dateToAnyFormat} = require("../../../../helpers/dateTime");
const {LAKH} = require("../../../../mocks/number.constant");
const {getAllInventoryCorrectionAttributes} = require("../../../../models/stores/helpers/inventoryCorrectionHelper");
const InvCorrectionRepository = require("../../../../models/stores/repository/inventoryCorrectionRepository");
const {filteredSupplierList} = require("../../../../models/purchase/repository/supplierRepository");
const {filteredItemList} = require("../../../../models/purchase/repository/itemRepository");
const {filteredHSNList} = require("../../../../models/purchase/repository/hsnRepository");
const {inventoryUpload, PPICInventoryUpload} = require("../../../../middleware/inventoryUpload");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
// const {inventoryUpload} = require("../../../../middleware/inventoryUpload");
const ObjectId = mongoose.Types.ObjectId;
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {
    GOODS_TRANSFER_REQUEST_DEPT,
    SALES_CATEGORY,
    COMPANY_SUPPLIER_ID,
    INV_FORM_TYPE,
    PROD_ITEM_CATEGORY_TYPE
} = require("../../../../mocks/constantData");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {filteredProdItemList} = require("../../../../models/planning/repository/prodItemRepository");
const CompanyRepository = require("../../../../models/settings/repository/companyRepository");
const {getAllProdItemCategory} = require("../../settings/prodItemCategory/prodItemCategory");
const {getAllPurchaseCategory} = require("../../settings/purchaseCategoryMaster/purchaseCategoryMaster");
const {checkDomesticCustomer} = require("../../../../helpers/utility");
const {filteredInvZoneConfigList} = require("../../../../models/planning/repository/invZoneConfigRepository");

// @desc    getAll InventoryCorrection Record
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllInventoryCorrectionAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
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
            }
        ];
        let rows = await InvCorrectionRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllInventoryCorrectionAggregate", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    create InventoryCorrection new Record
exports.create = asyncHandler(async (req, res) => {
    try {
        // let existing = await Model.findOne({
        //     roleName: req.body.roleName,
        // });
        // if (existing) {
        //     let errors = MESSAGES.apiErrorStrings.Data_EXISTS("InventoryCorrection");
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
                message: MESSAGES.apiSuccessStrings.ADDED("InventoryCorrection")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create InventoryCorrection", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update InventoryCorrection  Record
exports.update = asyncHandler(async (req, res) => {
    try {
        for await (const element of req.body) {
            let itemDetails = await Model.findById(element._id);
            itemDetails.updatedBy = req.user.sub;
            itemDetails = await generateCreateData(itemDetails, element);
            await itemDetails.save();
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("InventoryCorrection has been")
        });
    } catch (e) {
        console.error("update InventoryCorrection", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.updateById = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await InvCorrectionRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await InvCorrectionRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Inventory has been")
        });
    } catch (e) {
        console.error("update Inventory", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById InventoryCorrection Record
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("InventoryCorrection")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("InventoryCorrection");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById InventoryCorrection", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById InventoryCorrection Record
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("InventoryCorrection");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById InventoryCorrection", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.updateInventory = asyncHandler(async GIDetails => {
    try {
        for await (const element of GIDetails) {
            let updatedIC = await Model.findOne({_id: element.IC});
            updatedIC.closedIRQty = element.IRQty - element.GIQty;
            await updatedIC.save();
        }
    } catch (e) {
        console.error("updateInventory", e);
    }
});
exports.updateInventoryOnResolveDiscrepancy = async GIDetails => {
    try {
        for await (const element of GIDetails) {
            let updatedIC = await Model.findOne({_id: element.IC});
            if (+element.diffQty != 0) {
                updatedIC.closedIRQty = +updatedIC.closedIRQty - +element.inventoryQty;
            }
            await updatedIC.save();
        }
    } catch (e) {
        console.error("updateInventoryOnResolveDiscrepancy", e);
    }
};
exports.updateInventoryOnStockTransferToStore = async (item, transferQty, company) => {
    try {
        await Model.findOneAndUpdate(
            {
                item: item,
                company: company
            },
            {$inc: {closedIRQty: +transferQty}}
        );
    } catch (e) {
        console.error("updateInventoryOnStockTransferToStore", e);
    }
};
exports.getAllGINItemCount = async company => {
    try {
        const count = await Model.distinct("item", {
            company: ObjectId(company),
            ICDate: {
                $gte: getFirstDateOfCurrentFiscalYear(),
                $lte: getLastDateOfCurrentFiscalYear()
            }
        });
        return count.length;
    } catch (error) {
        console.error("getAllGINItemCount", error);
    }
};
exports.getTotalInventoryValue = async company => {
    try {
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$ICDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    closedIRQty: {$gt: 0},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalInventoryValue: {$sum: {$multiply: ["$closedIRQty", "$purchaseRatINR"]}}
                }
            },
            {
                $project: {
                    _id: null,
                    totalInventoryValue: {
                        $round: [{$divide: ["$totalInventoryValue", LAKH]}, 2]
                    }
                }
            }
        ]);
        return result[0]?.totalInventoryValue || 0;
    } catch (error) {
        console.error(error);
    }
};
exports.getAllInventoryCorrectionByItems = asyncHandler(async (company, GRDetails) => {
    try {
        GRDetails = GRDetails.map(x => ObjectId(x.item));
        let query = {
            company: ObjectId(company),
            closedIRQty: {$gt: 0},
            ...(GRDetails.length > 0 && {item: {$in: GRDetails}})
        };
        let rows = await Model.aggregate([
            {
                $match: query
            },
            {
                $lookup: {
                    from: "GoodInwardEntry",
                    localField: "GIN",
                    foreignField: "_id",
                    // pipeline: [{$project: {MRNDate : 1}}],
                    as: "GIN"
                }
            },
            {
                $unwind: {
                    path: "$GIN",
                    preserveNullAndEmptyArrays: true
                }
            },
            // {
            //     $lookup: {
            //         from: "MRN",
            //         localField: "MRN",
            //         foreignField: "_id",
            //         pipeline: [
            //             {
            //                 $project: {
            //                     MRNNumber: 1,
            //                     MRNDate: {$ifNull: ["$MRNDate", "$createdAt"]},
            //                     createdAt: 1
            //                 }
            //             }
            //         ],
            //         as: "MRN"
            //     }
            // },
            // {
            //     $unwind: {
            //         path: "$MRN",
            //         preserveNullAndEmptyArrays: true
            //     }
            // },
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
                                itemDescription: 1,
                                itemType: 1,
                                itemSubCategory: 1,
                                conversionOfUnits: 1,
                                shelfLife: 1
                            }
                        },
                        {$sort: {itemCode: +1}}
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
                                itemCode: 1,
                                itemName: 1,
                                itemDescription: 1,
                                itemType: "$prodItemCategory",
                                itemSubCategory: {$literal: null},
                                conversionOfUnits: 1,
                                shelfLife: 1
                            }
                        },
                        {$sort: {itemCode: +1}}
                    ],
                    as: "prodItems"
                }
            },
            {
                $addFields: {
                    item: {$concatArrays: ["$itemInfo", "$prodItems"]}
                }
            },
            {
                $unwind: {
                    path: "$item",
                    preserveNullAndEmptyArrays: true
                }
            },
            {$sort: {"item.itemCode": 1, "MRN.MRNNumber": 1}}
        ]);
        return rows;
    } catch (e) {
        console.error("getAllInventoryCorrectionByItems", e);
    }
});
exports.getTotalInventoryValuePerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$ICDate"}}
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
                totalInventoryValue: {$sum: "$lineValueINR"}
            }
        },
        {
            $project: {
                _id: 0,
                totalInventoryValue: {$round: ["$totalInventoryValue", 2]}
            }
        }
    ]);
    return rows[0]?.totalInventoryValue || 0;
};

exports.checkInventoryValidation = async excelData => {
    let supplierArray = excelData.map(x => x.supplierCode);
    let uniqueSetSupplier = Array.from(new Set(supplierArray));
    const falseArr = OPTIONS.falsyArray;
    let allSuppliers = await filteredSupplierList([
        {
            $match: {
                supplierCode: {$in: uniqueSetSupplier}
            }
        },
        {
            $project: {
                _id: 1,
                supplierCode: 1,
                supplierName: 1
            }
        }
    ]);
    let itemArray = excelData.map(element => element.itemCode);
    let uniqueSetItems = Array.from(new Set(itemArray));
    let allItemDetails = await filteredItemList([
        {$match: {itemCode: {$in: uniqueSetItems}}},
        {
            $project: {
                _id: 1,
                itemCode: 1,
                itemName: 1,
                supplierDetails: 1,
                hsn: 1,
                orderInfoUOM: 1,
                primaryToSecondaryConversion: 1,
                secondaryToPrimaryConversion: 1,
                primaryUnit: 1,
                secondaryUnit: 1
            }
        }
    ]);

    let hsnArray = allItemDetails.map(element => String(element.hsn));
    let uniqueSetHSN = Array.from(new Set(hsnArray));
    let allHSN = await filteredHSNList([
        {
            $match: {
                hsnCode: {$in: uniqueSetHSN}
            }
        },
        {
            $project: {hsnCode: 1}
        }
    ]);
    excelData = excelData.map(x => {
        x.isValid = true;
        x.message = null;
        let itemsDetails = allItemDetails.find(item => String(item.itemCode) === String(x.itemCode));
        if (falseArr.includes(itemsDetails)) {
            x.isValid = false;
            x.message = `Item Code - ${x.itemCode} not exists`;
        }
        let supplierDetails = allSuppliers.find(s => String(s.supplierCode) === String(x.supplierCode));
        if (falseArr.includes(supplierDetails)) {
            x.isValid = false;
            x.message = `Supplier Code - ${x.supplierCode} not exists`;
        } else {
            let supplierDetailsData = itemsDetails.supplierDetails.find(
                s => String(s.supplierId) === String(supplierDetails._id)
            );
            if (falseArr.includes(supplierDetailsData)) {
                x.isValid = false;
                x.message = `Supplier is not link with item - ${x.supplierCode}-${x.itemCode} `;
            }
        }

        if (!itemsDetails.orderInfoUOM) {
            x.isValid = false;
            x.message = `Item orderInfoUOM not exists`;
        }
        let hsnDetails = allHSN.find(h => String(h.hsnCode) === String(itemsDetails.hsn));
        if (falseArr.includes(hsnDetails)) {
            x.isValid = false;
            x.message = `HSN Code - ${itemsDetails.hsn} not exists for ${x.supplierCode}-${x.itemCode}`;
        }
        if (!itemsDetails.primaryUnit) {
            x.isValid = false;
            x.message = `Item primaryUnit not exists`;
        }
        if (
            itemsDetails.secondaryUnit &&
            itemsDetails.secondaryUnit != "-" &&
            (!itemsDetails.primaryToSecondaryConversion || !itemsDetails.primaryToSecondaryConversion)
        ) {
            x.isValid = false;
            x.message = `Item Unit Conversions not exists`;
        }
        return x;
    });
    const inValidRecords = excelData.filter(x => !x.isValid);
    const validRecords = excelData.filter(x => x.isValid);
    return {inValidRecords, validRecords};
};
exports.bulkInsertInventoryByCSV = async jsonData => {
    try {
        let notFoundObj = await inventoryUpload(jsonData);
        return {message: "Uploaded successfully!", notFoundObj};
    } catch (error) {
        console.error(error);
    }
};

exports.updateSPSInventory = asyncHandler(async (req, res) => {
    try {
        for await (const element of req.body) {
            if (element.isUpdated) {
                let itemDetails = await Model.findById(element._id);
                itemDetails.updatedBy = req.user.sub;
                itemDetails = await generateCreateData(itemDetails, element);
                await itemDetails.save();
            }
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("InventoryCorrection has been")
        });
    } catch (e) {
        console.error("update InventoryCorrection", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.checkPPICInventoryValidation = async excelData => {
    let supplierArray = excelData.map(x => x.supplierCode);
    let uniqueSetSupplier = Array.from(new Set(supplierArray));
    const requiredFields = [
        "itemName",
        "itemDescription",
        "primaryUnit",
        "secondaryUnit",
        "primaryToSecondaryConversion",
        "conversionOfUnits",
        "UOM",
        "SQM",
        "width",
        "length"
    ];
    const falseArr = OPTIONS.falsyArray;
    let allSuppliers = await filteredSupplierList([
        {
            $match: {
                supplierCode: {$in: uniqueSetSupplier}
            }
        },
        {
            $project: {
                _id: 1,
                supplierCode: 1,
                supplierName: 1
            }
        }
    ]);
    let itemArray = excelData.map(element => element.itemCode);
    let uniqueSetItems = Array.from(new Set(itemArray));
    let allItemDetails = await filteredItemList([
        {$match: {itemCode: {$in: uniqueSetItems}}},
        {
            $project: {
                _id: 1,
                itemCode: 1,
                itemName: 1,
                supplierDetails: 1,
                hsn: 1,
                orderInfoUOM: 1,
                primaryToSecondaryConversion: 1,
                secondaryToPrimaryConversion: 1,
                primaryUnit: 1,
                secondaryUnit: 1
            }
        }
    ]);
    let hsnArray = allItemDetails.map(element => element.hsn);
    let uniqueSetHSN = Array.from(new Set(hsnArray));
    let allHSN = await filteredHSNList([
        {
            $match: {
                hsnCode: {$in: uniqueSetHSN}
            }
        },
        {
            $project: {hsnCode: 1}
        }
    ]);
    excelData = excelData.map(x => {
        x.isValid = true;
        x.message = null;
        let itemsDetails = allItemDetails.find(item => String(item.itemCode) === String(x.itemCode));
        if (falseArr.includes(itemsDetails)) {
            x.isValid = false;
            x.message = `Item Code - ${x.itemCode} not exists`;
        }
        let supplierDetails = allSuppliers.find(s => String(s.supplierCode) === String(x.supplierCode));
        if (falseArr.includes(supplierDetails)) {
            x.isValid = false;
            x.message = `Supplier Code - ${x.supplierCode} not exists`;
        } else {
            let supplierDetailsData = itemsDetails.supplierDetails.find(
                s => String(s.supplierId) === String(supplierDetails._id)
            );
            if (falseArr.includes(supplierDetailsData)) {
                x.isValid = false;
                x.message = `Supplier is not link with item - ${x.supplierCode}-${x.itemCode} `;
            }
        }

        if (!itemsDetails.orderInfoUOM) {
            x.isValid = false;
            x.message = `Item orderInfoUOM not exists`;
        }
        let hsnDetails = allHSN.find(h => String(h.hsnCode) === String(itemsDetails.hsn));
        if (hsnDetails && falseArr.includes(hsnDetails.hsnCode)) {
            x.isValid = false;
            x.message = `HSN Code - ${itemsDetails.hsn} not exists`;
        }
        if (!itemsDetails.primaryUnit) {
            x.isValid = false;
            x.message = `Item primaryUnit not exists`;
        }
        if (!itemsDetails.secondaryUnit) {
            x.isValid = false;
            x.message = `Item secondaryUnit not exists`;
        }
        // if (!itemsDetails.primaryToSecondaryConversion || !itemsDetails.primaryToSecondaryConversion) {
        //     x.isValid = false;
        //     x.message = `Item Unit Conversions not exists`;
        // }
        let inventoryKeys = Object.keys(x);
        for (const keys of inventoryKeys) {
            if (requiredFields.includes(keys) && falseArr.includes(x[keys])) {
                x.isValid = false;
                x.message = validationJson[keys] ?? `${keys} is Required`;
                break;
            }
        }
        return x;
    });
    const inValidRecords = excelData.filter(x => !x.isValid);
    const validRecords = excelData.filter(x => x.isValid);
    return {inValidRecords, validRecords};
};

exports.bulkInsertPPICInventoryByCSV = async jsonData => {
    try {
        notFounds = await PPICInventoryUpload({jsonData});
        return {message: "Uploaded successfully!", notFounds};
    } catch (error) {
        console.error(error);
    }
};

exports.migrateInventoryData = async () => {
    try {
        let bulkJSON = await InvCorrectionRepository.filteredInventoryCorrectionList([
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
            console.log("Inventory Migration ongoing...");
            if (obj) {
                let existing = await InvCorrectionRepository.getDocById(obj._id);
                if (existing) {
                    existing.referenceModelSC = "Supplier";
                    existing.supplierName = obj.supplier.supplierName;
                    existing.invoiceRate = existing.purchaseRate;
                }
                await existing.save();
            }
        }
        console.log("Inventory Migration SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};

exports.getItemsListForReco = async (req, res) => {
    try {
        const {supplierId = null, department = GOODS_TRANSFER_REQUEST_DEPT.STORES} = req.query;
        let itemsList = await InvCorrectionRepository.filteredInventoryCorrectionList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    closedIRQty: {$gt: 0},
                    department: department,
                    ...(!!supplierId && {supplier: ObjectId(supplierId)})
                }
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
                        {$project: {partNo: "$supplierDetails.spin"}}
                    ],
                    as: "itemInfo"
                }
            },
            {$unwind: "$itemInfo"},
            {
                $project: {
                    _id: 1,
                    item: 1,
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    closedIRQty: 1,
                    partNo: "$itemInfo.partNo",
                    MRNNumber: 1,
                    batchDate: 1,
                    UOM: 1,
                    primaryToSecondaryConversion: 1,
                    secondaryToPrimaryConversion: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    conversionOfUnits: 1,
                    previousRecoQty: "$closedIRQty",
                    recoQtyPlusMinus: {$literal: 0},
                    recoQty: {$literal: 0}
                }
            },
            {
                $sort: {
                    itemCode: 1
                }
            }
        ]);
        let suppliersOptions = await filteredSupplierList([
            {$match: {company: ObjectId(req.user.company), isSupplierActive: "A"}},
            {$sort: {supplierName: 1}},
            {
                $addFields: {
                    supplierBillingAddress: {$arrayElemAt: ["$supplierBillingAddress", 0]}
                }
            },
            {
                $project: {
                    supplierName: 1,
                    _id: 1,
                    supplierCode: 1,
                    supplierBillingState: "$supplierBillingAddress.state",
                    supplierBillingCity: "$supplierBillingAddress.city",
                    supplierBillingPinCode: "$supplierBillingAddress.pinCode"
                }
            }
        ]);
        const customersOptions = await filteredCustomerList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isCustomerActive: "A",
                    customerCategory: SALES_CATEGORY.JOB_WORK_PRINCIPAL
                }
            },
            {
                $addFields: {
                    customerBillingAddress: {$arrayElemAt: ["$customerBillingAddress", 0]}
                }
            },
            {$sort: {customerName: 1}},
            {
                $project: {
                    _id: 1,
                    supplierName: "$customerName",
                    supplierCode: "$customerCode",
                    supplierBillingState: "$customerBillingAddress.state",
                    supplierBillingCity: "$customerBillingAddress.city",
                    supplierBillingPinCode: "$customerBillingAddress.pinCode"
                }
            }
        ]);
        suppliersOptions = ["All", ...suppliersOptions, ...customersOptions];
        return res.success({
            itemsList,
            suppliersOptions
        });
    } catch (error) {
        console.error("getItemsListForReco    ", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.createInvOnBCEntry = async batch => {
    try {
        let itemInfo = await filteredProdItemList([
            {
                $match: {
                    _id: ObjectId(batch?.item)
                }
            },
            {
                $project: {
                    _id: 1,
                    prodUnitId: 1,
                    inwardTo: 1,
                    invZone: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    primaryToSecondaryConversion: 1,
                    secondaryToPrimaryConversion: 1,
                    conversionOfUnits: 1,
                    prodItemCategory: 1,
                    expiryDate: {
                        $dateAdd: {
                            startDate: new Date(batch?.generateReport?.batchCardClosureDate),
                            unit: "month",
                            amount: "$shelfLife"
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "ProdItemStdCost",
                    localField: "_id",
                    foreignField: "item",
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                prodItemCost: {
                                    $reduce: {
                                        input: "$prodUnitDetails",
                                        initialValue: 0,
                                        in: {$add: ["$$value", "$$this.prodItemCost"]}
                                    }
                                }
                            }
                        }
                    ],
                    as: "itemCostInfo"
                }
            },
            {
                $unwind: {
                    path: "$itemCostInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "ProductionUnitConfig",
                    localField: "prodUnitId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                label: {$concat: ["$prodUnitName", " ", "(", "$prodUnitCode", ")"]}
                            }
                        }
                    ],
                    as: "prodUnitInfo"
                }
            },
            {
                $unwind: {
                    path: "$prodUnitInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    prodItemCost: {$ifNull: ["$itemCostInfo.prodItemCost", 0]},
                    departmentName: "$prodUnitInfo.label",
                    departmentId: "$prodUnitInfo._id",
                    expiryDate: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    primaryToSecondaryConversion: 1,
                    secondaryToPrimaryConversion: 1,
                    conversionOfUnits: 1,
                    prodItemCategory: 1,
                    inwardTo: 1,
                    invZone: 1
                }
            }
        ]);
        itemInfo = itemInfo?.length ? itemInfo[0] : {};
        const companyObj = await CompanyRepository.getDocById(batch?.company, {
            companyName: 1
        });
        let createObj = {
            company: batch?.company,
            createdBy: batch?.createdBy,
            updatedBy: batch?.updatedBy,
            ICDate: new Date(),
            GINDate: new Date(),
            GIN: "000000000000000000000000",
            MRN: batch?._id,
            supplier: COMPANY_SUPPLIER_ID,
            referenceModelSC: "Supplier",
            supplierName: companyObj?.companyName,
            MRNNumber: batch?.batchCardNo,
            MRNDate: batch?.generateReport?.batchCardClosureDate,
            UOM: batch?.UOM,
            primaryToSecondaryConversion: itemInfo?.primaryToSecondaryConversion,
            secondaryToPrimaryConversion: itemInfo?.secondaryToPrimaryConversion,
            primaryUnit: itemInfo?.primaryUnit,
            secondaryUnit: itemInfo?.secondaryUnit,
            conversionOfUnits: itemInfo?.conversionOfUnits,
            item: batch?.item,
            referenceModel: "ProductionItem",
            itemCode: batch?.itemCode,
            itemName: batch?.itemName,
            itemDescription: batch?.itemDescription,
            itemType: itemInfo?.prodItemCategory,
            closedIRQty: batch?.generateReport?.batchOutputQty,
            standardRate: itemInfo?.prodItemCost,
            purchaseRate: itemInfo?.prodItemCost,
            invoiceRate: itemInfo?.prodItemCost,
            purchaseRateUSD: itemInfo?.prodItemCost,
            purchaseRatINR: itemInfo?.prodItemCost,
            lineValueINR: +batch?.generateReport?.batchOutputQty * +itemInfo?.prodItemCost,
            batchDate: batch?.generateReport?.batchCardClosureDate,
            deliveryLocation: batch?.generateReport?.location,
            expiryDate: itemInfo?.expiryDate,
            department: GOODS_TRANSFER_REQUEST_DEPT.PRODUCTION,
            departmentName: itemInfo?.departmentName,
            formType: INV_FORM_TYPE.PARENT,
            departmentId: itemInfo?.departmentId,
            refDepartment: "ProductionUnitConfig",
            invZoneName: batch?.inventoryZone || itemInfo?.inwardTo,
            invZoneId: batch?.invZone || itemInfo?.invZone
        };
        await InvCorrectionRepository.createDoc(createObj);
    } catch (error) {
        console.error("getAllMasterData Inter Prod Store", error);
    }
};

exports.bulkCreate = asyncHandler(async (req, res) => {
    try {
        let batch = {
            item: null,
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            _id: "000000000000000000000000",
            batchCardNo: null,
            generateReport: {
                batchCardClosureDate: null,
                batchOutputQty: null,
                location: null
            },
            UOM: null,
            item: null,
            itemCode: null,
            itemName: null,
            itemDescription: null
        };
        for await (const ele of req.body.prodItemArray) {
            batch.item = ele?._id;
            batch.batchCardNo = ele?.batchCardNo;
            batch.UOM = ele?.UOM;
            batch.itemCode = ele?.itemCode;
            batch.itemName = ele?.itemName;
            batch.itemDescription = ele?.itemDescription;
            batch.generateReport.batchCardClosureDate = ele?.batchCardClosureDate;
            batch.generateReport.batchOutputQty = ele?.batchOutputQty;
            batch.generateReport.location = req.body?.location;
            await this.createInvOnBCEntry(batch);
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.INSERT("Production Items")
        });
    } catch (e) {
        console.error("create Production Items", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getProdItemsListForReco = async (req, res) => {
    try {
        const {filterBy = "All", departmentId = null, department = GOODS_TRANSFER_REQUEST_DEPT.PRODUCTION} = req.query;
        let itemsList = await InvCorrectionRepository.filteredInventoryCorrectionList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    closedIRQty: {$gt: 0},
                    department: department,
                    itemType: filterBy == "All" ? {$exists: true} : filterBy,
                    ...(!!departmentId && {departmentId: ObjectId(departmentId)})
                }
            },
            {
                $project: {
                    _id: 1,
                    item: 1,
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    closedIRQty: 1,
                    batchCardNo: "$MRNNumber",
                    batchDate: 1,
                    UOM: 1,
                    primaryToSecondaryConversion: 1,
                    secondaryToPrimaryConversion: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    conversionOfUnits: 1,
                    previousRecoQty: "$closedIRQty",
                    recoQtyPlusMinus: {$literal: 0},
                    recoQty: {$literal: 0}
                }
            },
            {
                $sort: {
                    itemCode: 1
                }
            }
        ]);
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
        return res.success({
            itemsList,
            itemCategoryOptions
        });
    } catch (error) {
        console.error("getProdItemsListForReco    ", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getBulkUploadMasterData = asyncHandler(async (req, res) => {
    try {
        const purchaseCategoryList = await getAllPurchaseCategory(req.user.company, null);
        let purchaseCategoryOptions = [];
        if (purchaseCategoryList.length > 0) {
            purchaseCategoryOptions = purchaseCategoryList.map(x => {
                return {
                    label: x.category,
                    value: x.category,
                    categoryType: x.categoryType
                };
            });
        } else {
            purchaseCategoryOptions = await getAllModuleMaster(req.user.company, "PURCHASE_TYPE");
            purchaseCategoryOptions = await Promise.all(
                purchaseCategoryOptions?.map(async x => {
                    const isDomestic = await checkDomesticCustomer(x.value);
                    return {
                        label: x.label,
                        value: x.value,
                        categoryType: isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.IMPORTS
                    };
                })
            );
        }
        const suppliersOptions = await filteredSupplierList([
            {$match: {company: ObjectId(req.user.company), isSupplierActive: "A"}},
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
        const subLocationsOptions = await getAllModuleMaster(req.user.company, "SUB_LOCATIONS");
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
        return res.success({
            suppliersOptions,
            purchaseCategoryOptions,
            subLocationsOptions,
            invZoneOptions
        });
    } catch (error) {
        console.error("getBulkUploadMasterData InventoryCorrection", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getItemsBySupplier = asyncHandler(async (req, res) => {
    try {
        const {supplierId = null, purchaseCategory = null} = req.query;
        let itemsList = await filteredItemList([
            {
                $match: {
                    isActive: "A",
                    company: ObjectId(req.user.company)
                }
            },
            {
                $addFields: {
                    supplierDetails: {$first: "$supplierDetails"}
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
                    ...(!!supplierId && {"supplierDetails.supplierId": ObjectId(supplierId)}),
                    ...(!!purchaseCategory && {"supplierDetails.categoryType": purchaseCategory})
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplierDetails.supplierId",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1, supplierCode: 1}}],
                    as: "supplierInfo"
                }
            },
            {$unwind: "$supplierInfo"},
            {
                $addFields: {
                    purchaseRateCommon: {$first: "$supplierDetails.purchaseRateCommon"}
                }
            },
            {
                $project: {
                    _id: 0,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: "$orderInfoUOM",
                    // PODate: new Date(),
                    // purchaseCategory: {$literal: null},
                    supplierName: "$supplierDetails.supplierName",
                    supplierCode: "$supplierInfo.supplierCode",
                    orderReference: "-",
                    itemCode: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    conversionOfUnits: 1,
                    primaryToSecondaryConversion: 1,
                    secondaryToPrimaryConversion: 1,
                    POQty: {$literal: 0},
                    inventoryZoneId: "66ee25dbbadf15f481a1f25b",
                    invZoneName: "Main Store",
                    // deliveryDate: new Date(),
                    // deliveryLocation: {$literal: null},
                    PORemarks: "-",
                    // GRNDate: new Date(),
                    supplierInvoice: "-",
                    // supplierInvoiceRefDate: new Date(),
                    transporterName: "-",
                    AWB_LR_BR: "-",
                    batchDate: new Date(),
                    // GRNQty: {$literal: 0},
                    remarks: "-",
                    // releasedQty: {$literal: 0},
                    currency: "$purchaseRateCommon.currency"
                    // MRNQty: {$literal: 0},
                    // GINQty: {$literal: 0}
                }
            }
        ]);
        return res.success({
            itemsList
        });
    } catch (error) {
        console.error("getItemsBySupplier InventoryCorrection", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.bulkCreateRawItems = asyncHandler(async (req, res) => {
    try {
        const inventoryArr = req.body.inventoryArr.map(ele => {
            ele.purchaseCategory = req.body.purchaseCategory;
            // ele.deliveryLocation = req.body.deliveryLocation;
            ele.GRNQty = ele?.POQty ?? 0;
            ele.releasedQty = ele?.POQty ?? 0;
            ele.MRNQty = ele?.POQty ?? 0;
            ele.GINQty = ele?.POQty ?? 0;
            ele.batchDate = ele?.batchDate?.split("-")?.reverse()?.join("-");
            return ele;
        });
        await inventoryUpload(inventoryArr);
        return res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Inventory")
        });
    } catch (e) {
        console.error("create InventoryCorrection", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

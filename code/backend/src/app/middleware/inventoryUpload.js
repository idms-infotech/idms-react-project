const {getHSNByCode} = require("../controllers/v1/purchase/HSN/HSN");
const SupplierRepository = require("../models/purchase/repository/supplierRepository");
const ItemRepository = require("../models/purchase/repository/itemRepository");
const PORepository = require("../models/purchase/repository/purchaseOrderRepository");
const GRNRepository = require("../models/stores/repository/GRNRepository");
const MRNRepository = require("../models/quality/repository/mrnRepository");
const GINRepository = require("../models/stores/repository/goodInwardEntryRepository");
const {insertInventory, insertPPICInventory} = require("../controllers/v1/stores/goodsInwardEntry/goodsInwardEntry");
const {filteredHSNList} = require("../models/purchase/repository/hsnRepository");
const {SOURCE_DOCUMENT} = require("../mocks/constantData");
let PurchaseArray = [];
let GRNArray = [];
let MRNArray = [];
let GINArray = [];
let InventoryArray = [];
let notFoundSupplier = [];
let notFoundItems = [];
let notFoundHSN = [];
exports.inventoryUpload = async excelData => {
    let supplierArray = excelData.map(x => x.supplierCode);
    var uniqueSetSupplier = Array.from(new Set(supplierArray));
    // console.log("uniqueSetSupplier", uniqueSetSupplier);

    for await (const supplierCode of uniqueSetSupplier) {
        // get supplier details
        let supplierDetails = await SupplierRepository.findOneDoc(
            {
                supplierCode: supplierCode
            },
            {_id: 1, supplierPurchaseType: 1, supplierCurrency: 1, company: 1, createdBy: 1, updatedBy: 1}
        );
        if (!supplierDetails) {
            notFoundSupplier.push(supplierCode);
            continue;
        }
        company = supplierDetails.company;
        // console.log("supplierDetails", supplierDetails);
        let itemArr = excelData.filter(x => x.supplierCode == supplierCode);
        // item codes
        let itemCodes = itemArr.map(element => element.itemCode);
        // items details bt item code
        let itemDetails = await ItemRepository.filteredItemList([
            {$match: {itemCode: {$in: itemCodes}}},
            {
                $project: {
                    _id: 1,
                    item: 1,
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    orderInfoUOM: 1,
                    hsn: 1,
                    supplierDetails: 1,
                    hsn: 1,
                    company: 1,
                    createdBy: 1,
                    updatedBy: 1,
                    itemSubCategory: 1,
                    itemType: 1,
                    primaryToSecondaryConversion: 1,
                    secondaryToPrimaryConversion: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    conversionOfUnits: 1
                }
            }
        ]);
        // console.log(supplierCode, "itemDetails", JSON.stringify(itemDetails));
        let items = itemCodes.filter(x => itemDetails.some(y => y.itemCode != x));
        if (items.length) {
            notFoundItems.push(items);
        }

        // .populate("hsn", "gst igstRate sgstRate cgstRate ugstRate");
        let PODetails = [];
        let index = 0;
        for await (const item of itemDetails) {
            const element = itemArr.find(x => x.itemCode === item.itemCode);
            const stdCostUom1 =
                item.supplierDetails.find(sup => String(supplierDetails._id) === String(sup.supplierId._id))
                    ?.purchaseRateCommon[0]?.rate1 ?? 0;
            const hsn = await getHSNByCode(item.hsn);
            if (!hsn) {
                notFoundHSN.push(item.hsn);
            }
            if (!!!item.conversionOfUnits) {
                if (item.primaryToSecondaryConversion) {
                    item.conversionOfUnits = `1 ${item.primaryUnit ?? "Unit"} - ${
                        item.primaryToSecondaryConversion ?? 1
                    } ${item.secondaryUnit ?? "Unit"}`;
                } else {
                    item.conversionOfUnits = `1 ${item.secondaryUnit ?? "Unit"} - ${
                        item.secondaryToPrimaryConversion ?? 1
                    } ${item.primaryUnit ?? "Unit"}`;
                }
            }
            // console.log("hsn", hsn);
            PODetails.push({
                item: item._id,
                POLineNumber: index + 1,
                UOM: item.orderInfoUOM,
                primaryToSecondaryConversion: element.primaryToSecondaryConversion || 1,
                secondaryToPrimaryConversion: element.secondaryToPrimaryConversion,
                primaryUnit: element.primaryUnit || "unit",
                secondaryUnit: element.secondaryUnit || "unit",
                unitConversion: element.conversionOfUnits ?? "1 unit - 1 unit",
                POQty: element.POQty,
                balancedQty: 0,
                standardRate: stdCostUom1,
                purchaseRate: stdCostUom1,
                lineValue: +stdCostUom1 * +element.POQty,
                linePPV: 0,
                deliveryDate: element.deliveryDate ? new Date(reverseString(element.deliveryDate)) : new Date(),
                gst: hsn?.gstRate,
                igst: hsn?.igstRate,
                cgst: hsn?.cgstRate,
                sgst: hsn?.sgstRate,
                ugst: hsn?.ugstRate
            });
            index++;
        }
        // console.log("PODetails", JSON.stringify(PODetails));
        await createPurchaseOrder(supplierDetails, PODetails, itemArr[0], itemDetails);
    }
    console.log("PurchaseArray", PurchaseArray);
    // try {
    //     const modulePrefix = await findAppParameterValue("PURCHASE_ORDER_MODULE_PREFIX", company);
    //     let autoIncrementNo = getAutoIncrementNumber(modulePrefix, "", 0, 7);
    //     let updatedCode = await PurchaseModel.updateMany(
    //         {_id: {$in: PurchaseArray}},
    //         {$set: {PONumber: autoIncrementNo}}
    //     );
    //     // console.log("updatedCode PO", updatedCode);
    // } catch (e) {
    //     console.log(e);
    // }
    console.log("GRNArray", GRNArray);
    // try {
    //     const modulePrefix = await findAppParameterValue("GRN_MODULE_PREFIX", company);
    //     let autoIncrementNo = getAutoIncrementNumber(modulePrefix, "", 0, 7);
    //     let updatedCode = await GRNModel.updateMany({_id: {$in: GRNArray}}, {$set: {GRNNumber: autoIncrementNo}});
    //     // console.log("updatedCode GRN", updatedCode);
    // } catch (e) {
    //     console.log(e);
    // }
    console.log("MRNArray", MRNArray);
    // try {
    //     const modulePrefix = await findAppParameterValue("MRN_MODULE_PREFIX", company);
    //     let autoIncrementNo = getAutoIncrementNumber(modulePrefix, "", 0, 4);
    //     let updatedCode = await MRNModel.updateMany({_id: {$in: MRNArray}}, {$set: {MRNNumber: autoIncrementNo}});
    //     // console.log("updatedCode MRN", updatedCode);
    // } catch (e) {
    //     console.log(e);
    // }
    console.log("GINArray", GINArray);
    // try {
    //     const modulePrefix = await findAppParameterValue("GOODS_INWARD_ENTRY_MODULE_PREFIX", company);
    //     let autoIncrementNo = getAutoIncrementNumber(modulePrefix, "", 0, 4);
    //     let updatedCode = await GINModel.updateMany({_id: {$in: GINArray}}, {$set: {GINNumber: autoIncrementNo}});
    //     // console.log("updatedCode GIN", updatedCode);
    // } catch (e) {
    //     console.log(e);
    // }
    console.log("InventoryArray", InventoryArray);
    return {notFoundSupplier, notFoundItems, notFoundHSN};
};

async function createPurchaseOrder(supplierDetails, PODetails, element, itemDetails) {
    try {
        let createdObj = {
            company: supplierDetails.company,
            createdBy: supplierDetails.createdBy,
            updatedBy: supplierDetails.updatedBy,
            purchaseCategory: element.purchaseCategory,
            supplier: supplierDetails._id,
            PONumber: "0000000",
            PODate: element.PODate ? new Date(reverseString(element.PODate)) : new Date(),
            orderReference: element.orderReference ?? "-",
            currency: element.currency,
            deliveryLocation: element.deliveryLocation,
            deliveryDate: element.deliveryDate ? new Date(reverseString(element.deliveryDate)) : new Date(),
            PODetails: PODetails,
            remarks: "-",
            PORemarks: element.PORemarks ?? "-",
            totalLineValue: PODetails.map(m => m.lineValue).reduce((a, c) => +a + +c, 0),
            netPOValue: PODetails.map(m => m.lineValue).reduce((a, c) => +a + +c, 0),
            totalPPV: 0,
            POStatus: "Closed"
        };
        // console.log("PO createdObj", JSON.stringify(createdObj));
        let PO = await PORepository.createDoc(createdObj);
        PO = await PO.populate({
            path: "supplier",
            model: "Supplier",
            select: "supplierName _id"
        });
        // console.log("PO", PO);
        PurchaseArray.push(PO._id);
        await createGRN(PO, element, itemDetails);
        return;
    } catch (e) {
        console.error("create PurchaseOrder", e);
    }
}
const createGRN = async (PO, element, itemDetails) => {
    try {
        let createdObj = {
            company: PO.company,
            createdBy: PO.createdBy,
            updatedBy: PO.updatedBy,
            GRNNumber: "0000000",
            GRNDate: element.GRNDate ? new Date(reverseString(element.GRNDate)) : new Date(),
            POId: PO._id,
            PONumber: PO.PONumber,
            supplier: PO?.supplier?._id,
            supplierName: PO?.supplier?.supplierName,
            currency: PO.currency,
            supplierInvoiceRef: element.supplierInvoice ?? "-",
            supplierInvoiceRefDate: element.supplierInvoiceRefDate
                ? new Date(reverseString(element.supplierInvoiceRefDate))
                : new Date(),
            GRNStatus: "Closed",
            remarks: element.remarks ?? "-",
            transporterName: element.transporterName ?? "-",
            AWB_LR_BR: element.AWB_LR_BR ?? "-",
            deliveryLocation: PO.deliveryLocation,
            storageLocationMapping: {
                subLocation: element?.subLocation,
                rowNo: element?.rowNo,
                rackNo: element?.rackNo,
                binNo: element?.binNo,
                otherId: element?.otherId
            },
            GRNDetails: PO.PODetails.map((ele, idx) => {
                return {
                    POLineNumber: ele.POLineNumber,
                    GRNLineNumber: idx + 1,
                    item: ele.item,
                    QCLevels: itemDetails.find(x => ele.item == x._id)?.QCLevels ?? "",
                    standardRate: ele.standardRate,
                    purchaseRate: ele.purchaseRate,
                    invoiceRate: ele.purchaseRate,
                    UOM: ele.UOM,
                    primaryToSecondaryConversion: ele.primaryToSecondaryConversion,
                    secondaryToPrimaryConversion: ele.secondaryToPrimaryConversion,
                    primaryUnit: ele.primaryUnit,
                    secondaryUnit: ele.secondaryUnit,
                    conversionOfUnits: ele.unitConversion,
                    GRNQty: ele.POQty,
                    invoicedQty: ele.POQty,
                    balancedQty: 0,
                    canceledQty: 0,
                    batchDate: element.batchDate ? new Date(reverseString(element.batchDate)) : new Date()
                };
            }),
            isTaxInvoice: false,
            isEWayBill: true,
            isPackingList: false,
            isCOATC: false
        };
        // console.log("GRN createdObj", JSON.stringify(createdObj));
        const GRN = await GRNRepository.createDoc(createdObj);
        // console.log("GRN", GRN);
        GRNArray.push(GRN._id);
        await createMRN(GRN, element, itemDetails);
        return;
    } catch (e) {
        console.error("create GoodsReceiptNote", e);
    }
};
const createMRN = async (GRN, element, itemDetails) => {
    try {
        let createdObj = {
            company: GRN.company,
            createdBy: GRN.createdBy,
            updatedBy: GRN.updatedBy,
            MRNNumber: "0000000",
            GRNNumber: GRN._id,
            supplier: GRN.supplier,
            supplierName: GRN.supplierName,
            supplierInvoice: element.supplierInvoice ?? "-",
            supplierDate: element.GRNDate ? new Date(reverseString(element.GRNDate)) : new Date(),
            MRNStatus: "Closed",
            deliveryLocation: GRN.deliveryLocation,
            MRNDetails: GRN.GRNDetails.map((ele, idx) => {
                return {
                    MRNLineNumber: idx + 1,
                    GRNLineNumber: ele.GRNLineNumber,
                    item: ele.item,
                    UOM: ele.UOM,
                    primaryToSecondaryConversion: ele.primaryToSecondaryConversion,
                    secondaryToPrimaryConversion: ele.secondaryToPrimaryConversion,
                    primaryUnit: ele.primaryUnit,
                    secondaryUnit: ele.secondaryUnit,
                    conversionOfUnits: ele.conversionOfUnits,
                    GRNQty: ele.GRNQty,
                    balancedQty: 0,
                    standardRate: ele.standardRate,
                    batchNo: "-",
                    purchaseRate: ele.purchaseRate,
                    rejectedQty: 0,
                    releasedQty: ele.GRNQty,
                    batchDate: element.batchDate ? new Date(reverseString(element.batchDate)) : new Date()
                };
            })
        };
        // console.log("MRN createdObj", JSON.stringify(createdObj));
        const MRN = await MRNRepository.createDoc(createdObj);
        // console.log("MRN", MRN);
        MRNArray.push(MRN._id);
        await createGIN(MRN, element, itemDetails);
        return;
    } catch (e) {
        console.error("create MRN", e);
    }
};
const createGIN = async (MRN, element, itemDetails) => {
    try {
        let createdObj = {
            company: MRN.company,
            createdBy: MRN.createdBy,
            updatedBy: MRN.updatedBy,
            GINDate: element.PODate ? new Date(reverseString(element.PODate)) : new Date(),
            GINNumber: "0000000",
            sourceDoc: SOURCE_DOCUMENT.MRN,
            docNo: MRN?.MRNNumber,
            MRNDate: MRN?.MRNDate,
            MRNNumber: MRN._id,
            refMRN: "MRN",
            purchaseCategory: element.purchaseCategory,
            supplier: MRN.supplier,
            supplierName: MRN.supplierName,
            supplierInvoice: element.supplierInvoice ?? "-",
            supplierInvoiceDate: element.supplierInvoiceRefDate
                ? new Date(reverseString(element.supplierInvoiceRefDate))
                : new Date(),
            currency: element.currency,
            deliveryLocation: MRN.deliveryLocation,
            GINDetails: MRN.MRNDetails.map((ele, idx) => {
                return {
                    item: ele.item,
                    GINLineNumber: idx + 1,
                    mrnLineNumber: ele.MRNLineNumber,
                    itemSubCategory: itemDetails.find(c => String(c._id) == String(ele.item))?.itemSubCategory,
                    itemType: itemDetails.find(c => String(c._id) == String(ele.item))?.itemType,
                    UOM: ele.UOM,
                    primaryToSecondaryConversion: ele.primaryToSecondaryConversion,
                    secondaryToPrimaryConversion: ele.secondaryToPrimaryConversion,
                    primaryUnit: ele.primaryUnit,
                    secondaryUnit: ele.secondaryUnit,
                    conversionOfUnits: ele.conversionOfUnits,
                    GINQty: ele.releasedQty,
                    standardRate: ele.standardRate,
                    purchaseRate: ele.purchaseRate,
                    purchaseRateUSD: ele.purchaseRate,
                    purchaseRatINR: ele.purchaseRate,
                    lineValueINR: ele.releasedQty * ele.purchaseRate,
                    batchDate: element.batchDate ? new Date(reverseString(element.batchDate)) : new Date(),
                    balancedQty: 0,
                    rejectedQty: 0,
                    releasedQty: ele.releasedQty ?? 0,
                    MRNNumber: MRN?.MRNNumber,
                    invZoneName: "Main Store",
                    inventoryZoneId: "66ee25dbbadf15f481a1f25b",
                    deliveryLocation: element?.deliveryLocation ?? MRN.deliveryLocation,
                    subLocation: element?.subLocation,
                    rowNo: element?.rowNo,
                    rackNo: element?.rackNo,
                    binNo: element?.binNo,
                    otherId: element?.otherId
                };
            })
        };
        // console.log("GIN createdObj", JSON.stringify(createdObj));
        const GIN = await GINRepository.createDoc(createdObj);
        GINArray.push(GIN._id);
        // console.log("GIN", GIN);
        if (element.PPIC) {
            await insertPPICInventory(GIN._id, GIN.MRNNumber.valueOf(), {
                company: GIN.company,
                sub: GIN.createdBy,
                sub: GIN.updatedBy,
                ...element
            });
        } else {
            await insertInventory(GIN._id, GIN.MRNNumber.valueOf(), {
                company: GIN.company,
                sub: GIN.createdBy,
                sub: GIN.updatedBy
            });
        }
        // let icArr = GIN.GINDetails.map((ele, i) => {
        //     return {
        //         company: GIN.company,
        //         createdBy: GIN.createdBy,
        //         updatedBy: GIN.updatedBy,
        //         GINDate: GIN.GINDate,
        //         GIN: GIN._id,
        //         MRN: GIN.MRNNumber,
        //         ICStatus: "IC Created",
        //         GINLineNumber: ele.GINLineNumber,
        //         UOM: ele.UOM,
        //         primaryToSecondaryConversion: ele.primaryToSecondaryConversion,
        //         secondaryToPrimaryConversion: ele.secondaryToPrimaryConversion,
        //         primaryUnit: ele.primaryUnit,
        //         secondaryUnit: ele.secondaryUnit,
        //         item: ele.item,
        //         itemType: ele.itemType,
        //         itemSubCategory: ele.itemSubCategory,
        //         // openIRQty: ele.GINQty,
        //         updatedQty: 0,
        //         closedIRQty: ele.GINQty,
        //         standardRate: ele.standardRate,
        //         purchaseRate: ele.purchaseRate,
        //         purchaseRateUSD: ele.purchaseRateUSD,
        //         purchaseRatINR: ele.purchaseRatINR,
        //         lineValueINR: ele.lineValueINR,
        //         releasedQty: ele.releasedQty,
        //         rejectedQty: ele.rejectedQty,
        //         batchDate: ele.batchDate,
        //         deliveryLocation: GIN.deliveryLocation
        //     };
        // });
        // console.log("icArr created", JSON.stringify(icArr));

        // const ICCreate = await ICModel.insertMany(icArr);
        // console.log("ICCreate", ICCreate);
        // InventoryArray.push(ICCreate.map(x => x._id));
        return;
    } catch (e) {
        console.error("create Goods Inward Entry", e);
    }
};
function reverseString(str) {
    if (str.includes(".")) {
        return str ? str.split(".").reverse().join("-") : "";
    }
    return str ? str.split("-").reverse().join("-") : "";
}

exports.PPICInventoryUpload = async excelData => {
    console.log("excelData", excelData);
    let supplierOptions = await SupplierRepository.filteredSupplierList([
        {$match: {isSupplierActive: "A"}},
        {
            $project: {
                _id: 1,
                supplierCode: 1,
                supplierPurchaseType: 1,
                supplierCurrency: 1,
                company: 1,
                createdBy: 1,
                updatedBy: 1,
                supplierName: 1
            }
        }
    ]);
    let itemOptions = await ItemRepository.filteredItemList([
        {$match: {isActive: "A"}},
        {
            $unwind: "$supplierDetails"
        },
        {
            $lookup: {
                from: "Supplier",
                localField: "supplierDetails.supplierId",
                foreignField: "_id",
                pipeline: [{$project: {supplierCode: 1}}],
                as: "supplierId"
            }
        },
        {$unwind: "$supplierId"},
        {
            $project: {
                _id: 1,
                itemCode: 1,
                itemName: 1,
                itemDescription: 1,
                orderInfoUOM: 1,
                hsn: 1,
                company: 1,
                createdBy: 1,
                updatedBy: 1,
                itemSubCategory: 1,
                itemType: 1,
                QCLevels: 1,
                primaryToSecondaryConversion: 1,
                secondaryToPrimaryConversion: 1,
                primaryUnit: 1,
                secondaryUnit: 1,
                conversionOfUnits: 1,
                supplierCode: "$supplierId.supplierCode",
                supplierId: "$supplierDetails.supplierId",
                supplierName: "$supplierDetails.supplierName",
                stdCostUom1: "$supplierDetails.stdCostUom1",
                stdCostUom2: "$supplierDetails.stdCostUom2",
                uom1: "$supplierDetails.uom1",
                uom2: "$supplierDetails.uom2"
            }
        }
    ]);
    const HSNCodesOptions = await filteredHSNList([
        {$match: {isActive: "Y"}},
        {
            $project: {
                hsnCode: 1,
                gstRate: 1,
                igstRate: 1,
                cgstRate: 1,
                sgstRate: 1,
                ugstRate: 1
            }
        }
    ]);
    for await (const excel of excelData.jsonData) {
        let supplierObj = supplierOptions.find(supp => supp.supplierCode == excel.supplierCode);
        if (!supplierObj) {
            notFoundSupplier.push(supplierCode);
            continue;
        }
        company = supplierObj.company;
        // items details bt item code

        // console.log(supplierCode, "itemDetails", JSON.stringify(itemDetails));
        let itemDetails = itemOptions.filter(
            item => item.supplierCode == excel.supplierCode && item.itemCode == excel.itemCode
        );
        if (!itemDetails.length) {
            notFoundItems.push(excel.itemCode);
        }
        let PODetails = [];
        let index = 0;
        for await (const item of itemDetails) {
            let stdCostUom1 = 0;
            if (String(item.supplierId) === String(supplierObj._id)) {
                stdCostUom1 = item.uom1 == excel.primaryUnit ? item.stdCostUom1 : item.stdCostUom2;
            }
            const hsn = await HSNCodesOptions.find(hsn => hsn.hsnCode == item.hsn);
            if (!hsn) {
                notFoundHSN.push(item.hsn);
            }
            if (!!!excel.conversionOfUnits) {
                if (excel.primaryToSecondaryConversion) {
                    excel.conversionOfUnits = `1 ${excel.primaryUnit ?? "Unit"} - ${
                        excel.primaryToSecondaryConversion ?? 1
                    } ${excel.secondaryUnit ?? "Unit"}`;
                }
            }
            // console.log("hsn", hsn);
            PODetails.push({
                item: item._id,
                POLineNumber: index + 1,
                UOM: excel.UOM,
                primaryToSecondaryConversion: excel.primaryToSecondaryConversion || 1,
                secondaryToPrimaryConversion: excel.secondaryToPrimaryConversion,
                primaryUnit: excel.primaryUnit || "unit",
                secondaryUnit: excel.secondaryUnit || "unit",
                unitConversion: excel.conversionOfUnits ?? "1 unit - 1 unit",
                POQty: excel.POQty,
                balancedQty: 0,
                standardRate: stdCostUom1,
                purchaseRate: stdCostUom1,
                lineValue: +stdCostUom1 * +excel.POQty,
                linePPV: 0,
                deliveryDate: excel.deliveryDate ? new Date(reverseString(excel.deliveryDate)) : new Date(),
                gst: hsn?.gstRate,
                igst: hsn?.igstRate,
                cgst: hsn?.cgstRate,
                sgst: hsn?.sgstRate,
                ugst: hsn?.ugstRate
            });
            index++;
        }
        excel.PPIC = true;
        // console.log("PODetails", JSON.stringify(PODetails));
        await createPurchaseOrder(supplierObj, PODetails, excel, itemDetails);
    }
    console.log("PurchaseArray", PurchaseArray);
    // try {
    //     const modulePrefix = await findAppParameterValue("PURCHASE_ORDER_MODULE_PREFIX", company);
    //     let autoIncrementNo = getAutoIncrementNumber(modulePrefix, "", 0, 7);
    //     let updatedCode = await PurchaseModel.updateMany(
    //         {_id: {$in: PurchaseArray}},
    //         {$set: {PONumber: autoIncrementNo}}
    //     );
    //     // console.log("updatedCode PO", updatedCode);
    // } catch (e) {
    //     console.log(e);
    // }
    console.log("GRNArray", GRNArray);
    // try {
    //     const modulePrefix = await findAppParameterValue("GRN_MODULE_PREFIX", company);
    //     let autoIncrementNo = getAutoIncrementNumber(modulePrefix, "", 0, 7);
    //     let updatedCode = await GRNModel.updateMany({_id: {$in: GRNArray}}, {$set: {GRNNumber: autoIncrementNo}});
    //     // console.log("updatedCode GRN", updatedCode);
    // } catch (e) {
    //     console.log(e);
    // }
    console.log("MRNArray", MRNArray);
    // try {
    //     const modulePrefix = await findAppParameterValue("MRN_MODULE_PREFIX", company);
    //     let autoIncrementNo = getAutoIncrementNumber(modulePrefix, "", 0, 4);
    //     let updatedCode = await MRNModel.updateMany({_id: {$in: MRNArray}}, {$set: {MRNNumber: autoIncrementNo}});
    //     // console.log("updatedCode MRN", updatedCode);
    // } catch (e) {
    //     console.log(e);
    // }
    console.log("GINArray", GINArray);
    // try {
    //     const modulePrefix = await findAppParameterValue("GOODS_INWARD_ENTRY_MODULE_PREFIX", company);
    //     let autoIncrementNo = getAutoIncrementNumber(modulePrefix, "", 0, 4);
    //     let updatedCode = await GINModel.updateMany({_id: {$in: GINArray}}, {$set: {GINNumber: autoIncrementNo}});
    //     // console.log("updatedCode GIN", updatedCode);
    // } catch (e) {
    //     console.log(e);
    // }
    console.log("InventoryArray", InventoryArray);
    return {notFoundSupplier, notFoundItems, notFoundHSN};
};

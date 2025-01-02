const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllDeliveryChallanAttributes,
    getAllDeliveryChallanReportsAttributes
} = require("../../../../models/purchase/helpers/deliveryChallanHelper");
const DeliveryChallanRepository = require("../../../../models/purchase/repository/deliveryChallanRepository");
const {getAllDCLocations} = require("../../settings/deliveryChallanLoc/deliveryChallanLoc");
const {filteredCompanyList} = require("../../../../models/settings/repository/companyRepository");
const {filteredInventoryCorrectionList} = require("../../../../models/stores/repository/inventoryCorrectionRepository");
const {GOODS_TRANSFER_REQUEST_DEPT, E_WAY_BILL} = require("../../../../mocks/constantData");
const {getAllTransporter} = require("../../sales/transporter/transporter");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getEndDateTime, getStartDateTime, getSubtractedDate} = require("../../../../helpers/dateTime");
const {getIncrementNumWithPrefix, setConversion, appendFile} = require("../../../../helpers/utility");
const {CONSTANTS} = require("../../../../../config/config");
const {purchaseUOMPipe} = require("../../settings/UOMUnitMaster/UOMUnitMaster");
const InventoryRepository = require("../../../../models/stores/repository/inventoryCorrectionRepository");
const axiosHandler = require("../../../../utilities/axiosHandler");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllDeliveryChallanAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$nin: [OPTIONS.defaultStatus.REPORT_GENERATED, OPTIONS.defaultStatus.CLOSED]}
                }
            }
        ];
        let rows = await DeliveryChallanRepository.getAllPaginate({
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
        const itemDetails = await DeliveryChallanRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Delivery Challan")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Delivery Challan", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let existing = await DeliveryChallanRepository.getDocById(req.params.id);
        if (!existing) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        existing.updatedBy = req.user.sub;
        existing = await DeliveryChallanRepository.updateDoc(existing, req.body);
        if (existing.status === OPTIONS.defaultStatus.APPROVED) {
            const itemsOutOfStock = await updateInventoryLocation(existing);
            if (itemsOutOfStock?.length) {
                return res.success(itemsOutOfStock.join(", "));
            }
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Delivery Challan has been")
        });
    } catch (e) {
        console.error("update Delivery Challan", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const updateInventoryLocation = async DCId => {
    try {
        let existing = await DeliveryChallanRepository.getDocById(DCId);
        let bulkInventory = [];
        let itemsOutOfStock = [];
        for await (const ele of existing?.itemDetails) {
            const invObj = await InventoryRepository.getDocById(ele?.IC);
            // const newInventoryDoc = JSON.parse(JSON.stringify(invObj));
            // console.log("itemsInvForTransfer111111111111111", itemsInv);
            if (invObj) {
                if (+invObj?.closedIRQty < +ele?.qtyTransfer) {
                    itemsOutOfStock.push(ele?.itemCode);
                }
            } else {
                itemsOutOfStock.push(ele?.itemCode);
            }
            invObj.closedIRQty = invObj.closedIRQty - ele?.qtyTransfer;
            bulkInventory.push({
                updateOne: {
                    filter: {_id: ele?.IC},
                    update: {
                        $set: {closedIRQty: invObj.closedIRQty}
                    }
                }
            });
            //  New Inv Doc
            // delete newInventoryDoc._id;
            // delete newInventoryDoc.previousDebitRejQty;
            // delete newInventoryDoc.previousRecoQty;
            // delete newInventoryDoc.recoHistory;
            // delete newInventoryDoc.recoQtyPlusMinus;
            // newInventoryDoc.closedIRQty = ele?.qtyTransfer;
            // newInventoryDoc.deliveryLocation = existing.nameOfConsignee;
            // bulkInventory.push({
            //     insertOne: {
            //         document: newInventoryDoc
            //     }
            // });
        }
        // console.log("itemsOutOfStock", itemsOutOfStock);
        if (itemsOutOfStock?.length) {
            return itemsOutOfStock;
        }
        await InventoryRepository.bulkWriteDoc(bulkInventory);
    } catch (error) {
        console.error("update Inv On DC", error);
    }
};
// const updateInventoryLocation = async existing => {
//     try {
//         let itemsOutOfStock = [];
//         let invItemsGroupedData = [];
//         for await (const ele of existing?.itemDetails) {
//             const itemsInv = await InventoryRepository.filteredInventoryCorrectionList([
//                 {
//                     $match: {
//                         item: ObjectId(ele?.item),
//                         closedIRQty: {$gt: 0}
//                     }
//                 },
//                 {
//                     $sort: {createdAt: 1}
//                 },
//                 {
//                     $addFields: {
//                         convertedClosedIRQty: {
//                             $cond: [
//                                 {
//                                     $and: [{$eq: ["$UOM", "$primaryUnit"]}]
//                                 },
//                                 "$closedIRQty",
//                                 {
//                                     $cond: [
//                                         {
//                                             $not: ["$primaryToSecondaryConversion"]
//                                         },
//                                         {
//                                             $cond: [
//                                                 {
//                                                     $or: [
//                                                         {$not: ["$secondaryToPrimaryConversion"]},
//                                                         {$eq: ["$secondaryUnit", "-"]}
//                                                     ]
//                                                 },
//                                                 "$closedIRQty",
//                                                 {
//                                                     $divide: ["$closedIRQty", "$secondaryToPrimaryConversion"]
//                                                 }
//                                             ]
//                                         },
//                                         {
//                                             $multiply: ["$closedIRQty", "$primaryToSecondaryConversion"]
//                                         }
//                                     ]
//                                 }
//                             ]
//                         },
//                         qtyTransfer: ele?.qtyTransfer
//                     }
//                 },
//                 {
//                     $group: {
//                         _id: {item: "$item", deliveryLocation: "$deliveryLocation"},
//                         invIdArray: {$addToSet: "$_id"},
//                         closedIRQty: {$sum: "$convertedClosedIRQty"},
//                         itemCode: {$first: "$itemCode"},
//                         qtyTransfer: {$first: "$qtyTransfer"}
//                     }
//                 }
//             ]);
//             // console.log("itemsInvForTransfer111111111111111", itemsInv);
//             if (itemsInv?.length) {
//                 if (+itemsInv[0]?.closedIRQty < +ele?.qtyTransfer) {
//                     itemsOutOfStock.push(ele?.itemCode);
//                 }
//                 invItemsGroupedData.push(...itemsInv);
//             } else {
//                 itemsOutOfStock.push(ele?.itemCode);
//             }
//         }
//         // console.log("itemsOutOfStock", itemsOutOfStock);
//         if (itemsOutOfStock?.length) {
//             return itemsOutOfStock;
//         }
//         for await (const ele of invItemsGroupedData) {
//             const itemsInvForTransfer = await InventoryRepository.filteredInventoryCorrectionList([
//                 {
//                     $match: {
//                         $expr: {
//                             $in: ["$_id", ele?.invIdArray]
//                         }
//                     }
//                 },
//                 {
//                     $sort: {createdAt: 1}
//                 },
//                 {
//                     $addFields: {
//                         convertedClosedIRQty: {
//                             $cond: [
//                                 {
//                                     $and: [{$eq: ["$UOM", "$primaryUnit"]}]
//                                 },
//                                 "$closedIRQty",
//                                 {
//                                     $cond: [
//                                         {
//                                             $not: ["$primaryToSecondaryConversion"]
//                                         },
//                                         {
//                                             $cond: [
//                                                 {
//                                                     $or: [
//                                                         {$not: ["$secondaryToPrimaryConversion"]},
//                                                         {$eq: ["$secondaryUnit", "-"]}
//                                                     ]
//                                                 },
//                                                 "$closedIRQty",
//                                                 {
//                                                     $divide: ["$closedIRQty", "$secondaryToPrimaryConversion"]
//                                                 }
//                                             ]
//                                         },
//                                         {
//                                             $multiply: ["$closedIRQty", "$primaryToSecondaryConversion"]
//                                         }
//                                     ]
//                                 }
//                             ]
//                         }
//                     }
//                 },
//                 {
//                     $project: {
//                         _id: 1,
//                         item: "$item",
//                         convertedClosedIRQty: "$convertedClosedIRQty"
//                     }
//                 }
//             ]);
//             // console.log("itemsInvForTransfer111111111111111", itemsInvForTransfer);
//             for await (const item of itemsInvForTransfer) {
//                 const invObj = await InventoryRepository.getDocById(item._id);
//                 const newInventoryDoc = JSON.parse(JSON.stringify(invObj));
//                 // console.log("qtyTransfer before2222222222222", ele?.qtyTransfer);
//                 if (ele?.qtyTransfer > item?.convertedClosedIRQty) {
//                     ele.qtyTransfer = ele?.qtyTransfer - item?.convertedClosedIRQty;
//                     invObj.closedIRQty = 0;
//                     newInventoryDoc.closedIRQty = item?.convertedClosedIRQty;
//                 } else {
//                     invObj.closedIRQty = item?.convertedClosedIRQty - ele?.qtyTransfer;
//                     newInventoryDoc.closedIRQty = ele?.qtyTransfer;
//                     ele.qtyTransfer = 0;
//                     let invUOMConvertData = {
//                         UOM: invObj?.UOM,
//                         quantity: invObj.closedIRQty,
//                         primaryUnit: invObj.primaryUnit,
//                         secondaryUnit: invObj.secondaryUnit,
//                         primaryToSecondaryConversion: invObj.primaryToSecondaryConversion,
//                         secondaryToPrimaryConversion: invObj.secondaryToPrimaryConversion
//                     };
//                     if (ele?.UOM != invObj?.UOM) {
//                         invObj.closedIRQty = setConversion(invUOMConvertData);
//                     }
//                 }

//                 // console.log("invObj===============", invObj);
//                 await invObj.save();
//                 delete newInventoryDoc._id;
//                 delete newInventoryDoc.previousDebitRejQty;
//                 delete newInventoryDoc.recoHistory;
//                 delete newInventoryDoc.recoQtyPlusMinus;
//                 newInventoryDoc.deliveryLocation = existing.nameOfConsignee;
//                 // console.log("newInventoryDoc", newInventoryDoc);
//                 await InventoryRepository.createDoc(newInventoryDoc);
//                 if (ele.qtyTransfer == 0) {
//                     break;
//                 }
//             }
//         }
//     } catch (error) {
//         console.error("update Inv On DC", error);
//     }
// };

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await DeliveryChallanRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Delivery Challan")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Delivery Challan");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Delivery Challan", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await DeliveryChallanRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Delivery Challan");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Delivery Challan", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getByIdForPDF = asyncHandler(async (req, res) => {
    try {
        let existing = await DeliveryChallanRepository.filteredDeliveryChallanList([
            {
                $match: {
                    _id: ObjectId(req.params.id)
                }
            },
            {
                $lookup: {
                    from: "Company",
                    let: {location: "$nameOfConsignor"},
                    localField: "company",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $unwind: "$placesOfBusiness"
                        },
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$placesOfBusiness.locationID", "$$location"]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                companyName: 1,
                                DCSignatureUrl: {
                                    $concat: [`${CONSTANTS.domainUrl}company/`, "$placesOfBusiness.DCSignature"]
                                }
                            }
                        }
                    ],
                    as: "company"
                }
            },
            {$unwind: "$company"},
            {
                $lookup: {
                    from: "Transporter",
                    localField: "transporter",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                licenseNumber: 1
                            }
                        }
                    ],
                    as: "transporter"
                }
            },
            {
                $unwind: {
                    path: "$transporter",
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);
        if (!existing?.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Delivery Challan");
            return res.unprocessableEntity(errors);
        } else {
            existing = await getPDFData(existing[0]);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Delivery Challan", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const getPDFData = async existing => {
    try {
        existing = JSON.parse(JSON.stringify(existing));
        let GSTCondition = false;
        GSTCondition =
            existing?.consignorAddress?.GSTINForAdditionalPlace?.substring(0, 2) !=
            existing?.consigneeAddress?.GSTINForAdditionalPlace?.substring(0, 2);
        for (const ele of existing.itemDetails) {
            ele.UOM = await purchaseUOMPipe(ele.UOM, existing.company._id);
            ele.lineValueWithTax = 0;
            if (GSTCondition) {
                ele.IGSTAmt = +((+ele.igst * +ele.taxableAmt) / 100).toFixed(2);
                ele.lineValueWithTax = +(+ele.taxableAmt + +ele.IGSTAmt).toFixed(2);
                ele.CGSTAmt = 0;
                ele.SGSTAmt = 0;
            } else {
                ele.IGSTAmt = 0;
                ele.CGSTAmt = +((+ele.cgst * +ele.taxableAmt) / 100).toFixed(2);
                ele.SGSTAmt = +((+ele.sgst * +ele.taxableAmt) / 100).toFixed(2);
                ele.lineValueWithTax = +(+ele.taxableAmt + +ele.CGSTAmt + +ele.SGSTAmt).toFixed(2);
            }
        }
        existing.totalCGSTAmt = Math.round(
            existing?.itemDetails?.reduce((total, item) => total + (+item.CGSTAmt || 0), 0) || 0
        );
        existing.totalIGSTAmt = Math.round(
            existing?.itemDetails?.reduce((total, item) => total + (+item.IGSTAmt || 0), 0) || 0
        );
        existing.totalSGSTAmt = Math.round(
            existing?.itemDetails?.reduce((total, item) => total + (+item.SGSTAmt || 0), 0) || 0
        );
        existing.totalAmtWithTax = Math.round(
            existing?.itemDetails?.reduce((total, item) => total + (+item.lineValueWithTax || 0), 0) || 0
        );
        let hsnArr = [...new Set(existing?.itemDetails?.map(x => +x.hsn))];
        existing.GSTDetails = [];
        for (let i = 0; i < hsnArr.length; i++) {
            const element = hsnArr[i];
            let arr = existing?.itemDetails?.filter(m => m.hsn == element);
            let lineValue = Number(arr.map(y => +y.taxableAmt).reduce((a, c) => a + c, 0)).toFixed(2);
            let igstRate = 0;
            let igstAmount = 0;
            let cgstRate = 0;
            let cgstAmount = 0;
            let sgstRate = 0;
            let sgstAmount = 0;
            let ugstRate = 0;
            let ugstAmount = 0;
            if (GSTCondition) {
                igstRate = arr[0].igst;
                igstAmount = (+igstRate * +lineValue) / 100;
            } else {
                cgstRate = arr[0].cgst;
                cgstAmount = (+cgstRate * +lineValue) / 100;
                sgstRate = arr[0].sgst;
                sgstAmount = (+sgstRate * +lineValue) / 100;
            }
            existing.GSTDetails.push({
                hsn: arr[0].hsn,
                taxableValue: +lineValue,
                igstRate: igstRate,
                igstAmount: igstAmount,
                cgstRate: cgstRate,
                cgstAmount: cgstAmount,
                sgstRate: sgstRate,
                sgstAmount: sgstAmount,
                ugstRate: ugstRate,
                ugstAmount: ugstAmount,
                totalTaxableValue: Number(+cgstAmount + +igstAmount + +sgstAmount + +ugstAmount).toFixed(2)
            });
        }
        return existing;
    } catch (error) {
        console.error("getPDFData Delivery Challan", error);
    }
};
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let locationOptions = await getAllDCLocations(req.user.company);
        let autoIncValues = {};
        if (locationOptions.length > 0) {
            for (const ele of locationOptions) {
                autoIncValues[ele?.location] = getIncrementNumWithPrefix({
                    modulePrefix: ele?.prefix,
                    autoIncrementValue: ele?.nextAutoIncrement,
                    digit: ele?.digit
                });
            }
        }
        const consigneeLocOptions = await filteredCompanyList([
            {
                $match: {
                    _id: ObjectId(req.user.company)
                }
            },
            {
                $project: {
                    placesOfBusiness: 1
                }
            },
            {$unwind: "$placesOfBusiness"},
            {
                $project: {
                    _id: "$placesOfBusiness._id",
                    locationID: "$placesOfBusiness.locationID",
                    GSTINForAdditionalPlace: "$placesOfBusiness.GSTINForAdditionalPlace",
                    country: "$placesOfBusiness.pinCode",
                    state: "$placesOfBusiness.state",
                    city: "$placesOfBusiness.city",
                    pinCode: "$placesOfBusiness.pinCode",
                    address: {
                        addressLine1: "$placesOfBusiness.addressLine1",
                        addressLine2: "$placesOfBusiness.addressLine2",
                        addressLine3: "$placesOfBusiness.addressLine3",
                        addressLine4: "$placesOfBusiness.addressLine4",
                        state: "$placesOfBusiness.state",
                        city: "$placesOfBusiness.city",
                        pinCode: "$placesOfBusiness.pinCode",
                        country: "$placesOfBusiness.country",
                        GSTINForAdditionalPlace: "$placesOfBusiness.GSTINForAdditionalPlace"
                    }
                }
            }
        ]);
        const transporterOptions = await getAllTransporter(
            {
                company: ObjectId(req.user.company)
            },
            {label: "$name", value: "$name", _id: 1}
        );
        const modeOfTransportOptions = await getAllModuleMaster(req.user.company, "MODE_OF_TRANSPORT");
        return res.success({autoIncValues, consigneeLocOptions, transporterOptions, modeOfTransportOptions});
    } catch (error) {
        console.error("getAllMasterData Delivery Challan", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getDCItems = asyncHandler(async (req, res) => {
    try {
        const {location = null} = req.query;
        let itemsList = await filteredInventoryCorrectionList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    department: GOODS_TRANSFER_REQUEST_DEPT.STORES,
                    closedIRQty: {$gt: 0},
                    ...(!!location && {
                        deliveryLocation: location
                    })
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, hsn: 1, gst: 1, igst: 1, cgst: 1, sgst: 1, ugst: 1}}],
                    as: "itemInfo"
                }
            },
            {
                $lookup: {
                    from: "ProductionItem",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, hsn: "$HSNCode", gst: 1, igst: 1, cgst: 1, sgst: 1, ugst: 1}}],
                    as: "prodItemInfo"
                }
            },
            {
                $addFields: {
                    items: {$concatArrays: ["$itemInfo", "$prodItemInfo"]}
                }
            },
            {
                $unwind: "$items"
            },
            {
                $project: {
                    _id: 0,
                    IC: "$_id",
                    item: "$item",
                    referenceModel: 1,
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    hsn: "$items.hsn",
                    gst: "$items.gst",
                    igst: "$items.igst",
                    cgst: "$items.cgst",
                    sgst: "$items.sgst",
                    ugst: "$items.ugst",
                    UOM: 1,
                    IRQty: {$round: ["$closedIRQty", 2]},
                    batchDate: "$batchDate",
                    unitRate: "$purchaseRatINR",
                    qtyTransfer: {$literal: 0},
                    taxableAmt: {$literal: 0}
                }
            },
            {
                $sort: {
                    itemCode: 1
                }
            }
        ]);
        return res.success(itemsList);
    } catch (error) {
        console.error("getAllMasterData Delivery Challan", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {toDate = null, fromDate = null} = req.query;
        let project = getAllDeliveryChallanReportsAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED, OPTIONS.defaultStatus.CLOSED]},
                    ...(!!toDate &&
                        !!fromDate && {
                            DCDate: {
                                $lte: getEndDateTime(toDate),
                                $gte: getStartDateTime(fromDate)
                            }
                        })
                }
            }
        ];
        let rows = await DeliveryChallanRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllForEwayBill = asyncHandler(async (req, res) => {
    try {
        const {type = null} = req.query;
        let query = {
            DCDate: {
                $gte: new Date(getSubtractedDate(2, "d"))
            },
            company: ObjectId(req.user.company),
            ...(type == "EwayBill" && {
                ewayBillNo: {$exists: false}
            }),
            ...(type == "EInvoice" && {
                Irn: {$exists: false}
            })
        };
        let rows = await DeliveryChallanRepository.filteredDeliveryChallanList([
            {
                $match: query
            },
            {
                $lookup: {
                    from: "Company",
                    localField: "company",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                companyName: 1,
                                _id: 0
                            }
                        }
                    ],
                    as: "company"
                }
            },
            {$unwind: "$company"},
            {
                $project: {
                    DCNo: 1,
                    consigneeAddress: 1,
                    lookupName: "$company.companyName",
                    lookupGSTNo: "$consigneeAddress.GSTINForAdditionalPlace"
                }
            },
            {
                $sort: {createdAt: -1}
            }
        ]);
        return res.success(rows);
    } catch (e) {
        console.error("getAllForEwayBill", e);
    }
});

exports.eWayBillGenerate = asyncHandler(async (req, res) => {
    try {
        let response = await axiosHandler.put(E_WAY_BILL.URL, req.body, {
            "Content-Type": "application/json",
            Token: CONSTANTS.eWayToken,
            gstin: req.body.fromGstin
        });
        console.info("response", response.status);
        console.info("response", response.data);
        if (response.data.ewayBillNo) {
            await DeliveryChallanRepository.findAndUpdateDoc(
                {_id: req.body.challanId},
                {
                    validUpto: response.data.validUpto,
                    ewayBillNo: response.data.ewayBillNo,
                    ewayBillDate: response.data.ewayBillDate,
                    EWayBillPdfUrl: response.data.EWayBillPdfUrl,
                    EWayBillQrCodeUrl: response.data.EWayBillQrCodeUrl,
                    eWayBillStatus: response.data.eWayBillStatus
                }
            );
        }
        res.success({
            message: response.data.message
        });
    } catch (e) {
        console.error("Generate E-Way", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

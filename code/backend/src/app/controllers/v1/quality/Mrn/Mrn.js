const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/quality/mrnModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getMonthlyGeneratedGRNVolume, getGRNDetailsByGRNId} = require("../../stores/goodsReceiptNote/goodsReceiptNote");
const {default: mongoose} = require("mongoose");
const {
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFiscalMonthsName
} = require("../../../../utilities/utility");
const {CONSTANTS} = require("../../../../../config/config");
const {dateToAnyFormat} = require("../../../../helpers/dateTime");
const {getAllRMSpecificationByItemId} = require("../rm-specification/rm-specification");
const {getAllMRNAttributes} = require("../../../../models/quality/helpers/mrnHelper");
// const {getMRNMailConfig} = require("./MrnMail");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {MATERIAL_RECEIPT_NOTE} = require("../../../../mocks/schemasConstant/qualityConstant");
const {filteredSupplierList} = require("../../../../models/purchase/repository/supplierRepository");
const MRNRepository = require("../../../../models/quality/repository/mrnRepository");

const ItemCategorySpecificationsRepository = require("../../../../models/quality/repository/itemCategorySpecificationsRepository");
const ObjectId = mongoose.Types.ObjectId;
const MailTriggerRepository = require("../../../../models/settings/repository/mailTriggerRepository");
const {QUALITY_MAIL_CONST} = require("../../../../mocks/mailTriggerConstants");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {filteredCompanyList} = require("../../../../models/settings/repository/companyRepository");
const CompanyRepository = require("../../../../models/settings/repository/companyRepository");
const GRNRepository = require("../../../../models/stores/repository/GRNRepository");
const RejectedMRNRepository = require("../../../../models/quality/repository/rejectedMRNRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllMRNAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    MRNStatus: {
                        $in: [
                            "Rejected",
                            "Partially Released",
                            "Released",
                            OPTIONS.defaultStatus.AWAITING_APPROVAL,
                            OPTIONS.defaultStatus.APPROVED
                        ]
                    }
                }
            },
            {
                $addFields: {
                    createdAT: {$dateToString: {format: "%d-%m-%Y", date: "$createdAt"}}
                }
            },
            {
                $lookup: {
                    from: "GRN",
                    localField: "GRNNumber",
                    foreignField: "_id",
                    pipeline: [{$project: {GRNNumber: 1, _id: 1, GRNDate: 1}}],
                    as: "GRNNumber"
                }
            },
            {$unwind: "$GRNNumber"},
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1, _id: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"}
        ];

        let rows = await MRNRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllMRN", e);
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
        const itemDetails = await MRNRepository.createDoc(createdObj);
        if (itemDetails) {
            await updateBalanceGRNQtyCreate(itemDetails.GRNNumber, itemDetails.MRNDetails);
            await checkForClosingGRN(itemDetails.GRNNumber);
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("MRN")
            });
            let mailTriggerCreateObj = {
                subModuleId: itemDetails._id,
                action: "created",
                company: req.user.company,
                mailAction: itemDetails.MRNStatus,
                collectionName: MATERIAL_RECEIPT_NOTE.COLLECTION_NAME,
                message: `Material Release Note Created - ${itemDetails.MRNNumber}`,
                module: QUALITY_MAIL_CONST.MRN.MODULE,
                subModule: QUALITY_MAIL_CONST.MRN.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        }
    } catch (e) {
        console.error("create MRN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const updateBalanceGRNQtyCreate = async (GRNId, details) => {
    try {
        for await (const ele of details) {
            let GRNData = await GRNRepository.findOneDoc({_id: GRNId, "GRNDetails.item": ele.item});
            for (const GRN of GRNData?.GRNDetails) {
                if (String(GRN.item) == String(ele.item)) {
                    GRN.balancedMRNQty = GRN.balancedMRNQty - ele.releasedQty - ele.rejectedQty;
                    GRN.previousMRNQty = ele.releasedQty + ele.rejectedQty;
                }
            }
            await GRNData.save();
        }
    } catch (error) {
        console.error("error", error);
    }
};
const updateBalanceGRNQtyUpdate = async (GRNId, details, status) => {
    try {
        for await (const ele of details) {
            let GRNData = await GRNRepository.findOneDoc({_id: GRNId, "GRNDetails.item": ele.item});
            for (const GRN of GRNData?.GRNDetails) {
                if (String(GRN.item) == String(ele.item)) {
                    if (status == OPTIONS.defaultStatus.REJECTED) {
                        GRN.balancedMRNQty = ele.releasedQty + ele.rejectedQty;
                        GRN.previousMRNQty = 0;
                    } else {
                        GRN.balancedMRNQty =
                            GRN.previousMRNQty + GRN.balancedMRNQty - ele.releasedQty - ele.rejectedQty;
                        GRN.previousMRNQty = ele.releasedQty + ele.rejectedQty;
                    }
                }
            }
            await GRNData.save();
        }
        if (status == OPTIONS.defaultStatus.REJECTED) {
            await GRNRepository.findAndUpdateDoc({_id: GRNId}, {GRNStatus: OPTIONS.defaultStatus.REPORT_GENERATED});
        }
    } catch (error) {
        console.error("error", error);
    }
};
const checkForClosingGRN = async GRNId => {
    try {
        let GRNData = await GRNRepository.findOneDoc({_id: GRNId});
        if (GRNData?.GRNDetails?.every(ele => ele?.balancedMRNQty == 0)) {
            GRNData.GRNStatus = OPTIONS.defaultStatus.CLOSED;
            await GRNData.save();
        }
    } catch (error) {
        console.error("error", error);
    }
};
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await MRNRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await MRNRepository.updateDoc(itemDetails, req.body);
        await updateBalanceGRNQtyUpdate(itemDetails.GRNNumber, itemDetails.MRNDetails, itemDetails.MRNStatus);
        if (itemDetails.MRNStatus == OPTIONS.defaultStatus.REPORT_GENERATED) {
            await checkForClosingGRN(itemDetails.GRNNumber);
        }
        if (itemDetails.MRNStatus == OPTIONS.defaultStatus.APPROVED) {
            for await (const ele of itemDetails.MRNDetails) {
                if (ele?.rejectedQty > 0) {
                    const rejMRNObj = {
                        company: itemDetails?.company,
                        createdBy: itemDetails?.createdBy,
                        updatedBy: itemDetails?.updatedBy,
                        MRN: itemDetails?._id,
                        MRNNumber: itemDetails?.MRNNumber,
                        supplier: itemDetails?.supplier,
                        supplierRef: itemDetails?.referenceModel,
                        supplierName: itemDetails?.supplierName,
                        deliveryLocation: itemDetails?.deliveryLocation,
                        item: ele?.item,
                        referenceModel: ele?.referenceModel,
                        itemType: ele?.itemType,
                        primaryToSecondaryConversion: ele?.primaryToSecondaryConversion,
                        secondaryToPrimaryConversion: ele?.secondaryToPrimaryConversion,
                        primaryUnit: ele?.primaryUnit,
                        secondaryUnit: ele?.secondaryUnit,
                        conversionOfUnits: ele?.conversionOfUnits,
                        UOM: ele?.UOM,
                        standardRate: ele?.standardRate,
                        purchaseRate: ele?.purchaseRate,
                        QRTQty: ele?.rejectedQty,
                        batchDate: ele?.batchDate,
                        QCLevels: ele?.QCLevels,
                        status: OPTIONS.defaultStatus.CREATED
                    };
                    await RejectedMRNRepository.createDoc(rejMRNObj);
                }
            }
        }
        if (itemDetails) {
            res.success({
                message: `MRN has been ${
                    itemDetails.MRNStatus == "Created" ? "updated" : itemDetails.MRNStatus.toLowerCase()
                } successfully`
            });
            let mailTriggerCreateObj = {
                subModuleId: itemDetails._id,
                action: itemDetails.MRNStatus,
                company: req.user.company,
                mailAction: itemDetails.MRNStatus,
                collectionName: MATERIAL_RECEIPT_NOTE.COLLECTION_NAME,
                message: `Material Release Note ${itemDetails.MRNStatus} - ${itemDetails.MRNNumber}`,
                module: QUALITY_MAIL_CONST.MRN.MODULE,
                subModule: QUALITY_MAIL_CONST.MRN.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        }
    } catch (e) {
        console.error("update MRN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @route   PUT /quality/inventoryCorrection/delete/:id
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await MRNRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("MRN")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("MRN");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById MRN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @route   GET /quality/inventoryCorrection/getById/:id
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await MRNRepository.filteredMRNList([
            {
                $match: {
                    _id: ObjectId(req.params.id)
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "MRNDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {$project: {_id: 1, itemCode: 1, itemName: 1, itemDescription: 1, conversionOfUnits: 1}}
                    ],
                    as: "itemInfo"
                }
            },
            {
                $lookup: {
                    from: "ProductionItem",
                    localField: "MRNDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {$project: {_id: 1, itemCode: 1, itemName: 1, itemDescription: 1, conversionOfUnits: 1}}
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
                $addFields: {
                    MRNDetails: {
                        $map: {
                            input: "$MRNDetails",
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
                                                        as: "item",
                                                        cond: {$eq: ["$$item._id", "$$detail.item"]}
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "GRN",
                    localField: "GRNNumber",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, GRNNumber: 1}}],
                    as: "GRNNumber"
                }
            },
            {$unwind: "$GRNNumber"},
            {
                $project: {
                    itemInfo: 0,
                    prodItemInfo: 0
                }
            }
        ]);
        if (!existing.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("MRN");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing[0]);
    } catch (e) {
        console.error("getById MRN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getMRNDetailsByGRNId = asyncHandler(async (req, res) => {
    try {
        let MRNDetails = {};
        let existing = await getGRNDetailsByGRNId(req.params.id);
        MRNDetails["supplier"] = existing.supplier;
        MRNDetails["referenceModel"] = existing?.referenceModel;
        MRNDetails["supplierName"] = existing?.supplierName;
        MRNDetails["supplierInvoice"] = existing.supplierInvoiceRef;
        MRNDetails["GRNRemarks"] = existing.remarks;
        MRNDetails["deliveryLocation"] = existing.deliveryLocation;
        MRNDetails["supplierDate"] = dateToAnyFormat(existing.supplierInvoiceRefDate, "YYYY-MM-DD");
        MRNDetails.MRNDetailsArray = existing.GRNDetails.filter(x => x.balancedMRNQty > 0).map((ele, idx) => {
            return {
                MRNLineNumber: idx + 1,
                item: ele.item._id,
                GRNLineNumber: ele.GRNLineNumber,
                POLineNumber: ele.POLineNumber,
                itemCode: ele.item.itemCode,
                itemName: ele.item.itemName,
                itemType: ele.item.itemType,
                shelfLife: ele.item.shelfLife,
                itemDescription: ele.item.itemDescription,
                conversionOfUnits: ele.item.conversionOfUnits,
                QCLevels: ele.QCLevels,
                QCLevelsDetails: [],
                primaryUnit: ele?.primaryUnit,
                secondaryUnit: ele?.secondaryUnit,
                primaryToSecondaryConversion: ele?.primaryToSecondaryConversion,
                secondaryToPrimaryConversion: ele?.secondaryToPrimaryConversion,
                batchNo: null,
                batchDate: dateToAnyFormat(ele.batchDate, "YYYY-MM-DD"),
                UOM: ele.UOM,
                GRNQty: ele.balancedMRNQty ?? 0,
                balancedQty: ele.balancedQty,
                standardRate: ele.standardRate,
                purchaseRate: ele.purchaseRate,
                rejectedQty: ele.rejectedQty,
                releasedQty: ele.releasedQty
            };
        });
        if (!MRNDetails) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("MRN");
            return res.unprocessableEntity(errors);
        }
        return res.success(MRNDetails);
    } catch (e) {
        console.error("getById MRN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getMRNDetailsById = asyncHandler(async (req, res) => {
    try {
        let existing = await MRNRepository.filteredMRNList([
            {
                $match: {
                    _id: ObjectId(req.params.id)
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "MRNDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {$project: {_id: 1, itemCode: 1, itemName: 1, itemDescription: 1, conversionOfUnits: 1}}
                    ],
                    as: "itemInfo"
                }
            },
            {
                $lookup: {
                    from: "ProductionItem",
                    localField: "MRNDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {$project: {_id: 1, itemCode: 1, itemName: 1, itemDescription: 1, conversionOfUnits: 1}}
                    ],
                    as: "prodItemInfo"
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
            },
            {
                $addFields: {
                    itemInfo: {$concatArrays: ["$itemInfo", "$prodItemInfo"]},
                    supplierName: {$ifNull: ["$supplierName", "$supplier.supplierName"]}
                }
            },
            {
                $addFields: {
                    MRNDetails: {
                        $map: {
                            input: "$MRNDetails",
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
                                                        as: "item",
                                                        cond: {$eq: ["$$item._id", "$$detail.item"]}
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "GRN",
                    localField: "GRNNumber",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, GRNNumber: 1}}],
                    as: "GRNNumber"
                }
            },
            {$unwind: "$GRNNumber"},
            {
                $lookup: {
                    from: "User",
                    localField: "createdBy",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, name: 1}}],
                    as: "createdBy"
                }
            },
            {$unwind: "$createdBy"},
            {
                $project: {
                    itemInfo: 0,
                    prodItemInfo: 0
                }
            }
        ]);
        if (!existing.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("MRN");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing[0]);
    } catch (e) {
        console.error("getById MRN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @route   GET /quality/inventoryCorrection/getAllMasterData
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...MATERIAL_RECEIPT_NOTE.AUTO_INCREMENT_DATA()},
            req.user.company
        );

        const grnList = await GRNRepository.filteredGRNList([
            {
                $match: {
                    GRNStatus: {
                        $in: [OPTIONS.defaultStatus.REPORT_GENERATED]
                    },
                    company: ObjectId(req.user.company)
                }
            },
            {
                $project: {
                    _id: 1,
                    GRNNumber: 1
                }
            }
        ]);
        const suppliersOptions = await filteredSupplierList([
            {$match: {company: ObjectId(req.user.company), isSupplierActive: "A"}},
            {$sort: {supplierName: 1}},
            {
                $project: {
                    supplierName: 1,
                    _id: 1
                }
            }
        ]);
        const locationOptions = await filteredCompanyList([
            {
                $match: {
                    _id: ObjectId(req.user.company)
                }
            },
            {$unwind: "$placesOfBusiness"},
            {$group: {_id: null, locationIDs: {$addToSet: "$placesOfBusiness.locationID"}}},
            {
                $unwind: "$locationIDs"
            },
            {$project: {_id: 0, label: "$locationIDs", value: "$locationIDs"}}
        ]);
        const QCLevelsOptions = await getAllModuleMaster(req.user.company, "QUALITY_CONTROL_LEVEL");
        return res.success({
            autoIncrementNo,
            suppliersOptions,
            grnList,
            QCLevelsOptions,
            locationOptions: locationOptions
        });
    } catch (error) {
        console.error("getAllMasterData MRN", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.updateMRNStatusOnGIN = async mrnId => {
    try {
        let MRN = await Model.findById(mrnId);
        if (MRN) {
            MRN.MRNStatus = "Closed";
            await MRN.save();
        }
        return {MRNNumber: MRN?.MRNNumber ?? null, MRNDate: MRN?.MRNDate ?? null};
    } catch (error) {
        console.error("updateMRNStatusOnGIN::::: Error ", error);
    }
};

// RejectQtyModel
// async function rejectQtyUpdate(itemDetails) {
//     try {
//         for (let i = 0; i < itemDetails.MRNDetails.length; i++) {
//             const ele = itemDetails.MRNDetails[i];
//             // if (ele.rejectedQty > 0) {
//             let obj = {
//                 company: itemDetails.company,
//                 createdBy: itemDetails.createdBy,
//                 updatedBy: itemDetails.updatedBy,
//                 supplier: itemDetails.supplier,
//                 item: ele.item,
//                 UOM: ele.UOM,
//                 standardRate: ele.standardRate,
//                 purchaseRate: ele.purchaseRate,
//                 MRNRejectedQty: ele.rejectedQty
//             };
//             let rejectedQtyObj = await RejectQtyModel.findOne({
//                 supplier: itemDetails.supplier,
//                 item: ele.item
//             });
//             if (rejectedQtyObj && Object.keys(rejectedQtyObj).length) {
//                 rejectedQtyObj.MRNRejectedQty += +ele.rejectedQty;
//                 await rejectedQtyObj.save();
//             } else {
//                 new RejectQtyModel(obj).save();
//             }
//             // }
//         }
//     } catch (error) {
//         console.error(error);
//     }
// }
exports.getAllMRNCounts = async company => {
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}}
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
                _id: null,
                rejectCount: {$sum: {$cond: [{$eq: ["$MRNStatus", "Rejected"]}, 1, 0]}},
                partiallyReleaseCount: {$sum: {$cond: [{$eq: ["$MRNStatus", "Partially Released"]}, 1, 0]}},
                releasedCount: {$sum: {$cond: [{$eq: ["$MRNStatus", "Released"]}, 1, 0]}},
                generatedCount: {$sum: {$cond: [{$eq: ["$MRNStatus", "Report Generated"]}, 1, 0]}},
                closedCount: {
                    $sum: {
                        $cond: [{$eq: ["$MRNStatus", "Closed"]}, 1, 0]
                    }
                }
            }
        },
        {
            $project: {
                MRNRejectedCount: "$rejectCount",
                MRNPartiallyReleaseCount: "$partiallyReleaseCount",
                MRNReleasedCount: "$releasedCount",
                MRNPendingForGINCount: "$generatedCount",
                allMRNCount: {$sum: ["$generatedCount", "$closedCount"]}
            }
        }
    ]);
    return rows.length > 0 ? rows[0] : [];
};
exports.getAllMonthlyMRNTrends = async company => {
    try {
        let generatedGRN = await getMonthlyGeneratedGRNVolume(company);
        const monthsArray = getFiscalMonthsName();
        let data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    MRNStatus: {$in: ["Report Generated", "Closed"]},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$createdAt", 0, 7]}},
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {"_id.year_month": 1}
            },
            {
                $project: {
                    _id: 0,
                    count: 1,
                    month_year: {
                        $concat: [
                            {
                                $arrayElemAt: [
                                    monthsArray,
                                    {
                                        $subtract: [{$toInt: {$substrCP: ["$_id.year_month", 5, 2]}}, 4]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    data: {$push: {k: "$month_year", v: "$count"}}
                }
            },
            {
                $project: {
                    data: {$arrayToObject: "$data"},
                    _id: 0
                }
            }
        ]);
        if (result.length > 0) {
            const propertyNames = Object.keys(result[0].data);
            const propertyValues = Object.values(result[0].data);
            let n = 0;
            propertyNames.forEach(elem => {
                let index = monthsArray.indexOf(elem);
                data[index] = propertyValues[n];
                n++;
            });
            monthlyMRNTrend = {months: monthsArray, orders: data};
        } else {
            monthlyMRNTrend = {months: monthsArray, orders: []};
        }
        return {monthlyMRNTrend, generatedGRN};
    } catch (error) {
        console.error(error);
    }
};

exports.getRMSpecificationByItemId = asyncHandler(async (req, res) => {
    try {
        let RMSpecification = await getAllRMSpecificationByItemId(req.user.company, req.query.itemId);
        if (!RMSpecification) {
            RMSpecification = await ItemCategorySpecificationsRepository.findOneDoc(
                {
                    company: ObjectId(req.user.company),
                    itemCategory: req.query.itemCategory
                },
                {
                    specificationInfo: 1
                }
            );
        }
        return res.success(RMSpecification);
    } catch (e) {
        console.error("getAllMasterData Pre Dispatch Inspection", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getByMRNIdForRMInspection = asyncHandler(async (req, res) => {
    try {
        const MRNData = await Model.aggregate([
            {
                $match: {_id: ObjectId(req.query.MRNId)}
            },
            {
                $lookup: {
                    from: "GRN",
                    localField: "GRNNumber",
                    foreignField: "_id",
                    pipeline: [{$project: {GRNNumber: 1, GRNDate: 1, _id: 1}}],
                    as: "GRNNumber"
                }
            },
            {$unwind: "$GRNNumber"},
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1, id: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"},
            {
                $lookup: {
                    from: "User",
                    localField: "updatedBy",
                    foreignField: "_id",
                    pipeline: [{$project: {name: 1, id: 1}}],
                    as: "updatedBy"
                }
            },
            {$unwind: "$updatedBy"},
            {$unwind: "$MRNDetails"},
            {
                $match: {
                    "MRNDetails.QCLevels": "L3"
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "MRNDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                itemName: 1,
                                itemCode: 1,
                                UOM: 1,
                                itemDescription: 1,
                                batchDate: 1,
                                batchNo: 1,
                                GRNQty: 1
                            }
                        }
                    ],
                    as: "MRNDetails.item"
                }
            },
            {$unwind: "$MRNDetails.item"},
            {
                $project: {
                    itemCode: "$MRNDetails.item.itemCode",
                    itemName: "$MRNDetails.item.itemName",
                    itemDescription: "$MRNDetails.item.itemDescription",
                    MRNNumber: 1,
                    MRNDate: {$dateToString: {format: "%d-%m-%Y", date: "$MRNDate"}},
                    supplierName: "$supplier.supplierName",
                    GRNNumber: "$GRNNumber.GRNNumber",
                    MRNStatus: 1,
                    GRNDate: {$dateToString: {format: "%d-%m-%Y", date: "$GRNNumber.GRNDate"}},
                    GRNQty: "$MRNDetails.GRNQty",
                    supplierInvoice: 1,
                    supplierDate: {$dateToString: {format: "%d-%m-%Y", date: "$supplierDate"}},
                    batchNo: "$MRNDetails.batchNo",
                    batchDate: {$dateToString: {format: "%d-%m-%Y", date: "$MRNDetails.batchDate"}},
                    UOM: "$MRNDetails.UOM",
                    QCLevels: "$MRNDetails.QCLevels",
                    // QCLevelsDetails: "$MRNDetails.QCLevelsDetails",
                    QCLevelsDetails: {
                        $map: {
                            input: "$MRNDetails.QCLevelsDetails",
                            as: "qcLevel",
                            in: {
                                $mergeObjects: [
                                    "$$qcLevel",
                                    {
                                        observationsCommaSeparated: {
                                            $reduce: {
                                                input: "$$qcLevel.testResults",
                                                initialValue: "",
                                                in: {
                                                    $cond: {
                                                        if: {$eq: [{$ifNull: ["$$value", ""]}, ""]},
                                                        then: "$$this.observation",
                                                        else: {$concat: ["$$value", ", ", "$$this.observation"]}
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    status: "$MRNDetails.status",
                    deviationApprovedBy: "$MRNDetails.deviationApprovedBy",
                    MRNRemarks: 1,
                    MRNReleasedBy: "$updatedBy.name"
                }
            }
        ]);
        const companyData = await CompanyRepository.getDocById(req.user.company, {
            logo: {$concat: [`${CONSTANTS.domainUrl}company/`, "$logo"]}
        });
        return res.success({MRNData, companyData});
    } catch (e) {
        console.error("getByMRNIdForRMInspection==>", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getTotalNoOfMRNPerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$MRNDate"}}
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
                MRNCreated: {$sum: {$cond: [{$eq: ["$MRNStatus", "Created"]}, 1, 0]}},
                MRNReleased: {$sum: {$cond: [{$eq: ["$MRNStatus", "Released"]}, 1, 0]}},
                MRNRejected: {$sum: {$cond: [{$eq: ["$MRNStatus", "Rejected"]}, 1, 0]}}
            }
        },
        {
            $project: {
                _id: 0,
                MRNCreated: 1,
                MRNReleased: 1,
                MRNRejected: 1
            }
        }
    ]);
    return rows.length > 0 ? rows[0] : [];
};
exports.createDirectMRN = async GRN => {
    try {
        let createdObj = {
            company: GRN.company,
            createdBy: GRN.createdBy,
            updatedBy: GRN.updatedBy,
            MRNNumber: GRN?.MRNNumber ?? "MRS/0000",
            GRNNumber: GRN._id,
            supplier: GRN.supplier,
            referenceModel: GRN.referenceModel,
            supplierName: GRN.supplierName,
            currency: GRN.currency,
            supplierInvoice: GRN.supplierInvoiceRef ?? "-",
            supplierDate: GRN.supplierInvoiceRefDate ? new Date(GRN.supplierInvoiceRefDate) : new Date(),
            MRNStatus: "Closed",
            deliveryLocation: GRN.deliveryLocation,
            MRNDetails: GRN.GRNDetails.map((ele, idx) => {
                return {
                    MRNLineNumber: idx + 1,
                    GRNLineNumber: ele.GRNLineNumber,
                    item: ele.item,
                    referenceModel: ele?.referenceModel ?? "Items",
                    itemType: ele.itemType,
                    UOM: ele.UOM,
                    primaryToSecondaryConversion: ele.primaryToSecondaryConversion,
                    secondaryToPrimaryConversion: ele.secondaryToPrimaryConversion,
                    primaryUnit: ele.primaryUnit,
                    secondaryUnit: ele.secondaryUnit,
                    conversionOfUnits: ele.conversionOfUnits,
                    GRNQty: ele.GRNQty,
                    balancedQty: 0,
                    standardRate: ele.standardRate,
                    purchaseRate: ele.purchaseRate,
                    invoiceRate: ele.invoiceRate,
                    QCLevels: ele.QCLevels,
                    rejectedQty: 0,
                    releasedQty: ele.GRNQty,
                    batchNo: ele.batchNo,
                    batchDate: new Date()
                };
            })
        };
        // console.log("MRN createdObj", JSON.stringify(createdObj));
        const MRN = await MRNRepository.createDoc(createdObj);
        // console.log("MRN", MRN);
        await checkForClosingGRN(GRN._id);
        return JSON.parse(JSON.stringify(MRN));
    } catch (e) {
        console.error("create MRN", e);
    }
};

exports.migrateMRNData = async () => {
    try {
        let bulkJSON = await MRNRepository.filteredMRNList([
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
            console.log("MRN Migration ongoing...");
            if (obj) {
                let existing = await MRNRepository.getDocById(obj._id);
                if (existing) {
                    existing.referenceModel = "Supplier";
                    existing.supplierName = obj.supplier.supplierName;
                    existing.currency = obj.supplier.supplierCurrency;
                    existing.MRNDetails = existing.MRNDetails.map(x => {
                        x.invoiceRate = x.purchaseRate;
                        return x;
                    });
                }
                await existing.save();
            }
        }
        console.log("MRN Migration SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};

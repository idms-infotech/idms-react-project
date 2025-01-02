const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllJobWorkChallanAttributes,
    getAllJobWorkChallanReportsAttributes,
    getAllJobWorkChallanTableItemsAttributes
} = require("../../../../models/purchase/helpers/jobWorkChallanHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {JOB_WORK_CHALLAN} = require("../../../../mocks/schemasConstant/purchaseConstant");
const JobWorkChallanRepository = require("../../../../models/purchase/repository/jobWorkChallanRepository");
const {getAllTransporter} = require("../../sales/transporter/transporter");
const {filteredSACMasterList} = require("../../../../models/purchase/repository/sacRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {CONSTANTS} = require("../../../../../config/config");
const {getStartDateTime, getEndDateTime, getSubtractedDate} = require("../../../../helpers/dateTime");
const {getAllCheckedItemCategoriesList} = require("../itemCategoryMaster/itemCategoryMaster");
const {purchaseUOMPipe} = require("../../settings/UOMUnitMaster/UOMUnitMaster");
const {filteredSupplierList} = require("../../../../models/purchase/repository/supplierRepository");
const {getAllCheckedSupplierCategoriesList} = require("../../settings/supplierCategory/supplierCategory");
const {GOODS_TRANSFER_REQUEST_DEPT, SALES_CATEGORY, E_WAY_BILL} = require("../../../../mocks/constantData");
const InventoryRepository = require("../../../../models/stores/repository/inventoryCorrectionRepository");
const {setConversion} = require("../../../../helpers/utility");
const {filteredLogisticsProviderList} = require("../../../../models/planning/repository/logisticsProviderRepository");
const ItemRepository = require("../../../../models/purchase/repository/itemRepository");
const {filteredJobWorkItemMasterList} = require("../../../../models/purchase/repository/jobWorkItemMasterRepository");
const BOMOfJobWorkItemRepository = require("../../../../models/planning/repository/BOMOfJobWorkItemRepository");
const axiosHandler = require("../../../../utilities/axiosHandler");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllJobWorkChallanAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), status: {$nin: [OPTIONS.defaultStatus.REPORT_GENERATED]}}}
        ];
        let rows = await JobWorkChallanRepository.getAllPaginate({
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
        const itemDetails = await JobWorkChallanRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Job Work Challan")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Job Work Challan", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await JobWorkChallanRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await JobWorkChallanRepository.updateDoc(itemDetails, req.body);
        if (itemDetails.status == OPTIONS.defaultStatus.REPORT_GENERATED) {
            await updateInventoryOnChallan(itemDetails.JWChallanDetails);
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Job Work Challan has been")
        });
    } catch (e) {
        console.error("update Job Work Challan", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const updateInventoryOnChallan = async challanDetails => {
    for await (const ele of challanDetails) {
        let challanQty = ele.quantity;
        let challanUOM = ele.UOM;
        let inventoryItems = await InventoryRepository.filteredInventoryCorrectionList([
            {
                $match: {
                    item: ObjectId(ele.item),
                    department: GOODS_TRANSFER_REQUEST_DEPT.STORES,
                    closedIRQty: {$gt: 0}
                }
            },
            {
                $sort: {createdAt: 1}
            },
            {
                $project: {
                    _id: 1
                }
            }
        ]);
        for (const inv of inventoryItems) {
            let inventoryData = await InventoryRepository.getDocById(inv._id);
            let challanUOMConvertData = {
                UOM: challanUOM,
                quantity: challanQty,
                primaryUnit: inventoryData.primaryUnit,
                secondaryUnit: inventoryData.secondaryUnit,
                primaryToSecondaryConversion: inventoryData.primaryToSecondaryConversion,
                secondaryToPrimaryConversion: inventoryData.secondaryToPrimaryConversion
            };
            if (inventoryData.UOM != challanUOM) {
                challanQty = setConversion(challanUOMConvertData);
                challanUOM =
                    inventoryData.primaryUnit == challanUOM ? inventoryData.secondaryUnit : inventoryData.primaryUnit;
            }
            if (challanQty > inventoryData.closedIRQty) {
                challanQty = challanQty - inventoryData.closedIRQty;
                inventoryData.closedIRQty = 0;
            } else {
                inventoryData.closedIRQty = inventoryData.closedIRQty - challanQty;
                challanQty = 0;
            }

            await inventoryData.save();
        }
    }
};
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await JobWorkChallanRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Job Work Challan")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Job Work Challan");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Job Work Challan", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await JobWorkChallanRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Job Work Challan");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Job Work Challan", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getByIdForPDF = asyncHandler(async (req, res) => {
    try {
        let existing = await JobWorkChallanRepository.filteredJobWorkChallanList([
            {
                $match: {
                    _id: ObjectId(req.params.id)
                }
            },
            {
                $lookup: {
                    from: "Company",
                    localField: "company",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                contactInfo: 1,
                                companyName: 1,
                                placesOfBusiness: 1,
                                companyBillingAddress: 1,
                                GSTIN: 1,
                                companySignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companySignature"]}
                            }
                        }
                    ],
                    as: "company"
                }
            },
            {$unwind: "$company"}
        ]);
        if (!existing.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Job Work Challan");
            return res.unprocessableEntity(errors);
        } else {
            existing = await getPDFData(existing[0]);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Job Work Challan", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const getPDFData = async JWChallanData => {
    try {
        JWChallanData = JSON.parse(JSON.stringify(JWChallanData));
        let GSTCondition = false;
        GSTCondition = JWChallanData?.company?.GSTIN.substring(0, 2) != JWChallanData?.GSTINNo?.substring(0, 2);
        for (const ele of JWChallanData.JWChallanDetails) {
            ele.UOM = await purchaseUOMPipe(ele.UOM, JWChallanData.company._id);
            ele.lineValueWithTax = 0;
            if (GSTCondition) {
                ele.IGSTAmt = +((+ele.igst * +ele.taxableAmt) / 100).toFixed(2);
                ele.lineValueWithTax = +ele.taxableAmt + +ele.IGSTAmt;
                ele.CGSTAmt = 0;
                ele.SGSTAmt = 0;
            } else {
                ele.IGSTAmt = 0;
                ele.CGSTAmt = +((+ele.cgst * +ele.taxableAmt) / 100).toFixed(2);
                ele.SGSTAmt = +((+ele.sgst * +ele.taxableAmt) / 100).toFixed(2);
                ele.lineValueWithTax = +ele.taxableAmt + +ele.CGSTAmt + +ele.SGSTAmt;
            }
        }
        JWChallanData.totalCGSTAmt = Math.round(
            JWChallanData?.JWChallanDetails?.reduce((total, item) => total + (+item.CGSTAmt || 0), 0) || 0
        );
        JWChallanData.totalIGSTAmt = Math.round(
            JWChallanData?.JWChallanDetails?.reduce((total, item) => total + (+item.IGSTAmt || 0), 0) || 0
        );
        JWChallanData.totalSGSTAmt = Math.round(
            JWChallanData?.JWChallanDetails?.reduce((total, item) => total + (+item.SGSTAmt || 0), 0) || 0
        );
        JWChallanData.totalAmtWithTax = Math.round(
            JWChallanData?.JWChallanDetails?.reduce((total, item) => total + (+item.lineValueWithTax || 0), 0) || 0
        );
        return JWChallanData;
    } catch (error) {
        console.error("getPDFData Job Work Challan", error);
    }
};
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            JOB_WORK_CHALLAN.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        let supplierCategoryList = await getAllCheckedSupplierCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            jobWorker: true
        });
        if (supplierCategoryList.length) {
            supplierCategoryList = supplierCategoryList.map(x => x.category);
        }
        const jobWorkerOptions = await filteredSupplierList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isSupplierActive: "A",
                    supplierPurchaseType: {$in: supplierCategoryList}
                }
            },
            {$sort: {supplierName: 1}},
            {
                $addFields: {
                    supplierBillingAddress: {$first: "$supplierBillingAddress"},
                    additionalPlacesOfBusiness: {
                        $map: {
                            input: "$supplierShippingAddress",
                            as: "details",
                            in: {
                                $mergeObjects: [
                                    "$$details",
                                    {
                                        addressType: {
                                            $concat: [
                                                "A",
                                                {
                                                    $toString: {
                                                        $add: [
                                                            {
                                                                $indexOfArray: ["$supplierShippingAddress", "$$details"]
                                                            },
                                                            2
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    "primaryAddress.addressType": "Primary Address"
                }
            },
            {
                $project: {
                    jobWorkerCode: "$supplierCode",
                    jobWorker: "$_id",
                    jobWorkerName: "$supplierName",
                    currency: "$supplierCurrency",
                    primaryAddress: "$supplierBillingAddress",
                    GSTINNo: "$supplierGST",
                    additionalPlacesOfBusiness: {
                        $concatArrays: [["$supplierBillingAddress"], "$additionalPlacesOfBusiness"]
                    },
                    state: "$supplierBillingAddress.state",
                    cityOrDistrict: "$supplierBillingAddress.city",
                    pinCode: "$supplierBillingAddress.pinCode"
                }
            }
        ]);
        const transporterOptions = await getAllTransporter(
            {
                company: ObjectId(req.user.company)
            },
            {label: "$name", value: "$name", _id: 0}
        );
        const logisticOptions = await filteredLogisticsProviderList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $lookup: {
                    from: "LSPCategory",
                    localField: "LSPCategory",
                    foreignField: "category",
                    pipeline: [
                        {
                            $match: {
                                transporterCategory: true
                            }
                        },
                        {
                            $project: {
                                _id: 1
                            }
                        }
                    ],
                    as: "LSPCategory"
                }
            },
            {$unwind: "$LSPCategory"},
            {
                $project: {label: "$LSPName", value: "$LSPName", _id: 0}
            }
        ]);
        const SACOptions = await filteredSACMasterList([
            {$match: {company: ObjectId(req.user.company), isActive: "Y"}},
            {$sort: {sacMasterEntryNo: -1}},
            {
                $project: {
                    SAC: "$_id",
                    SACCode: "$sacCode",
                    gst: "$gstRate",
                    igst: "$igstRate",
                    cgst: "$sgstRate",
                    sgst: "$cgstRate",
                    ugst: "$ugstRate",
                    descriptionOfService: "$serviceDescription"
                }
            }
        ]);
        const freightTermsOptions = await getAllModuleMaster(req.user.company, "FREIGHT_TERMS");
        const modeOfTransportOptions = await getAllModuleMaster(req.user.company, "MODE_OF_TRANSPORT");
        const JWItemsOptions = await filteredJobWorkItemMasterList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {
                    jobWorkItemCode: 1,
                    jobWorkItemName: 1,
                    jobWorkItemDescription: 1,
                    orderInfoUOM: 1
                }
            },
            {$sort: {jobWorkItemCode: 1}}
        ]);
        return res.success({
            autoIncrementNo,
            jobWorkerOptions,
            transporterOptions: [...logisticOptions, ...transporterOptions],
            SACOptions,
            freightTermsOptions,
            modeOfTransportOptions,
            JWItemsOptions
        });
    } catch (error) {
        console.error("getAllMasterData Job Work Challan", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllJobWorkerItemsOptions = asyncHandler(async (req, res) => {
    try {
        const {jobWorkItem = null} = req.query;
        let BOMOfJWItems = await BOMOfJobWorkItemRepository.filteredBOMOfJobWorkItemList([
            {
                $match: {
                    jobWorkItem: ObjectId(jobWorkItem)
                }
            },
            {
                $unwind: "$BOMOfJobWorkItemInfo"
            },
            {
                $project: {
                    _id: 0,
                    item: "$BOMOfJobWorkItemInfo.item",
                    referenceModel: "$BOMOfJobWorkItemInfo.referenceModel"
                }
            }
        ]);

        BOMOfJWItems = BOMOfJWItems?.length ? BOMOfJWItems.map(x => ObjectId(x?.item)) : null;
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            BOM: true
        });
        itemCategoriesList = itemCategoriesList?.map(x => x?.category);
        let project = getAllJobWorkChallanTableItemsAttributes();
        const pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isActive: "A",
                    itemType: {$in: itemCategoriesList},
                    ...(!!BOMOfJWItems && {
                        _id: {$in: BOMOfJWItems}
                    })
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
                $addFields: {
                    "supplierDetails.purchaseRateCommon": {$first: "$supplierDetails.purchaseRateCommon"}
                }
            },
            {
                $lookup: {
                    from: "InventoryCorrection",
                    localField: "_id",
                    foreignField: "item",
                    pipeline: [
                        {
                            $match: {
                                department: GOODS_TRANSFER_REQUEST_DEPT.STORES
                            }
                        },
                        {
                            $project: {
                                item: 1,
                                UOM: 1,
                                closedIRQty: {
                                    $switch: {
                                        branches: [
                                            {
                                                case: [{$eq: ["$UOM", "$primaryUnit"]}],
                                                then: "$closedIRQty"
                                            },
                                            {
                                                case: {
                                                    $and: [
                                                        {$ne: ["$UOM", "$primaryUnit"]},
                                                        "$primaryToSecondaryConversion"
                                                    ]
                                                },
                                                then: {$multiply: ["$closedIRQty", "$primaryToSecondaryConversion"]}
                                            },
                                            {
                                                case: {
                                                    $and: [
                                                        {$ne: ["$UOM", "$primaryUnit"]},
                                                        "$secondaryToPrimaryConversion"
                                                    ]
                                                },
                                                then: {$divide: ["$closedIRQty", "$secondaryToPrimaryConversion"]}
                                            }
                                        ],
                                        default: 0
                                    }
                                }
                            }
                        },
                        {
                            $group: {
                                _id: {itemId: "$item"},
                                closedIRQty: {$sum: "$closedIRQty"},
                                UOM: {$first: "$UOM"}
                            }
                        },
                        {
                            $project: {
                                closedIRQty: 1,
                                UOM: 1
                            }
                        }
                    ],
                    as: "inventory"
                }
            },
            {
                $unwind: {
                    path: "$inventory",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    JWLChallanLineNo: {$literal: 0},
                    item: "$_id",
                    referenceModel: "Items",
                    itemCode: "$itemCode",
                    itemName: "$itemName",
                    itemDescription: "$itemDescription",
                    UOM: {$ifNull: ["$inventory.UOM", "$orderInfoUOM"]},
                    primaryToSecondaryConversion: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    conversionOfUnits: 1,
                    currency: "$supplierDetails.supplierCurrency",
                    HSNCode: "$hsn",
                    gst: 1,
                    igst: 1,
                    cgst: 1,
                    sgst: 1,
                    ugst: 1,
                    "supplierDetails.purchaseRateCommon": 1,
                    unitRate: "$supplierDetails.purchaseRateCommon.rate1",
                    stdCostUom1: "$supplierDetails.purchaseRateCommon.rate1",
                    stdCostUom2: "$supplierDetails.purchaseRateCommon.rate2",
                    quantity: {$literal: 0},
                    taxableAmt: {$literal: 0},
                    closedIRQty: {$ifNull: ["$inventory.closedIRQty", 0]},
                    purchaseRateType: 1,
                    purchaseRateCommon: 1
                }
            },
            {
                $unionWith: {
                    coll: "ProductionItem",
                    pipeline: [
                        {
                            $match: {
                                company: ObjectId(req.user.company),
                                status: OPTIONS.defaultStatus.ACTIVE,
                                ...(!!BOMOfJWItems && {
                                    _id: {$in: BOMOfJWItems}
                                })
                            }
                        },
                        {
                            $lookup: {
                                from: "HSN",
                                localField: "HSN",
                                foreignField: "_id",
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                            gstRate: 1,
                                            igstRate: 1,
                                            sgstRate: 1,
                                            cgstRate: 1,
                                            ugstRate: 1
                                        }
                                    }
                                ],
                                as: "HSN"
                            }
                        },
                        {
                            $unwind: {
                                path: "$HSN",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: "BOMOfProdItem",
                                localField: "_id",
                                foreignField: "item",
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 0,
                                            materialCostPerUnit: 1
                                        }
                                    }
                                ],
                                as: "BOMOfProdItem"
                            }
                        },
                        {
                            $unwind: {
                                path: "$BOMOfProdItem",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: "InventoryCorrection",
                                localField: "_id",
                                foreignField: "item",
                                pipeline: [
                                    {
                                        $match: {
                                            department: GOODS_TRANSFER_REQUEST_DEPT.PRODUCTION
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: {itemId: "$item", UOM: "$UOM"},
                                            closedIRQty: {$sum: "$closedIRQty"}
                                        }
                                    },
                                    {
                                        $project: {
                                            closedIRQty: 1
                                        }
                                    }
                                ],
                                as: "inventory"
                            }
                        },
                        {
                            $unwind: {
                                path: "$inventory",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                JWLChallanLineNo: {$literal: 0},
                                item: "$_id",
                                referenceModel: "ProductionItem",
                                itemCode: "$itemCode",
                                itemName: "$itemName",
                                itemDescription: "$itemDescription",
                                UOM: "$unitOfMeasurement",
                                primaryToSecondaryConversion: 1,
                                primaryUnit: 1,
                                secondaryUnit: 1,
                                conversionOfUnits: 1,
                                currency: {$literal: null},
                                HSNCode: "$HSNCode",
                                gst: {$ifNull: ["$HSN.gstRate", 0]},
                                igst: {$ifNull: ["$HSN.igstRate", 0]},
                                cgst: {$ifNull: ["$HSN.sgstRate", 0]},
                                sgst: {$ifNull: ["$HSN.cgstRate", 0]},
                                ugst: {$ifNull: ["$HSN.ugstRate", 0]},
                                unitRate: {$ifNull: ["$BOMOfProdItem.materialCostPerUnit", 0]},
                                stdCostUom1: {$ifNull: ["$BOMOfProdItem.materialCostPerUnit", 0]},
                                stdCostUom2: {$literal: 0},
                                quantity: {$literal: 0},
                                taxableAmt: {$literal: 0},
                                closedIRQty: {$ifNull: ["$inventory.closedIRQty", 0]}
                            }
                        },
                        {$sort: {itemCode: 1}}
                    ]
                }
            }
        ];
        let mergedItems = await ItemRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(mergedItems);
    } catch (error) {
        console.error("getAllMasterData Job Work Challan", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {jobWorker = null, toDate = null, fromDate = null} = req.query;
        let supplierCategoryList = await getAllCheckedSupplierCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            jobWorker: true
        });
        if (supplierCategoryList.length) {
            supplierCategoryList = supplierCategoryList.map(x => x.category);
        } else {
            supplierCategoryList = [];
        }
        let jobWorkerOptions = await filteredSupplierList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isSupplierActive: "A",
                    supplierPurchaseType: {$in: supplierCategoryList}
                }
            },
            {$sort: {supplierName: 1}},
            {
                $project: {
                    label: "$supplierName",
                    value: "$_id"
                }
            }
        ]);
        let query = {
            company: ObjectId(req.user.company),
            status: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED]},
            ...(!!jobWorker && {
                jobWorker: ObjectId(jobWorker)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    JWChallanDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = getAllJobWorkChallanReportsAttributes();
        let pipeline = [
            {
                $match: query
            }
        ];
        let rows = await JobWorkChallanRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({...rows, jobWorkerOptions});
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllChallanEwayBillList = asyncHandler(async (req, res) => {
    try {
        const {category = null} = req.query;
        let query = {
            JWChallanDate: {
                $gte: new Date(getSubtractedDate(2, "d"))
            },
            company: ObjectId(req.user.company)
            // ...(type == "EwayBill" && {
            //     ewayBillNo: {$exists: false}
            // }),
            // ...(type == "EInvoice" && {
            //     Irn: {$exists: false}
            // })
        };
        let rows = await JobWorkChallanRepository.filteredJobWorkChallanList([
            {
                $match: query
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "jobWorker",
                    foreignField: "_id",
                    pipeline: [{$project: {categoryType: 1}}],
                    as: "jobWorker"
                }
            },
            {$unwind: "$jobWorker"},
            {
                $match: {
                    ...(!!category && category == "Exports"
                        ? {"jobWorker.categoryType": {$regex: SALES_CATEGORY.EXPORTS_REGEX}}
                        : {
                              $or: [
                                  {"jobWorker.categoryType": {$exists: false}},
                                  {"jobWorker.categoryType": {$regex: SALES_CATEGORY.DOMESTIC_REGEX}}
                              ]
                          })
                }
            },
            {
                $addFields: {
                    lookupName: "$jobWorkerName",
                    lookupGSTNo: "$GSTINNo"
                }
            },
            {
                $sort: {createdAt: -1}
            }
        ]);
        return res.success(rows);
    } catch (e) {
        console.error("getAllChallanEwayBillList", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
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
            await JobWorkChallanRepository.findAndUpdateDoc(
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
        return res.success({
            message: response.data.message
        });
    } catch (e) {
        console.error("Generate E-Way", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

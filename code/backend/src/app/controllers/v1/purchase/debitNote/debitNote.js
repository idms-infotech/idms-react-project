const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/purchase/debitNoteModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getAllSuppliers} = require("../suppliers/suppliers");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {
    getFirstDateOfMonth,
    getLastDateOfMonth,
    getFirstDayOfFiscalYear,
    getLastDayOfFiscalYear
} = require("../../../../utilities/utility");
const {CONSTANTS} = require("../../../../../config/config");
const {getEndDateTime, getStartDateTime, dateToAnyFormat} = require("../../../../helpers/dateTime");
const {
    getAllDebitNoteAttributes,
    getAllDebitNoteReportsAttributes
} = require("../../../../models/purchase/helpers/debitNoteHelper");
// const {getDNMailConfig} = require("./debitNoteMail");
const {LAKH} = require("../../../../mocks/number.constant");
const {DEBIT_NOTE} = require("../../../../mocks/schemasConstant/purchaseConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {filteredSupplierList} = require("../../../../models/purchase/repository/supplierRepository");
const DebitNoteRepository = require("../../../../models/purchase/repository/debitNoteRepository");
const ObjectId = mongoose.Types.ObjectId;
const MailTriggerRepository = require("../../../../models/settings/repository/mailTriggerRepository");
const {PURCHASE_MAIL_CONST} = require("../../../../mocks/mailTriggerConstants");
const {COMPANY_DEPARTMENTS, GOODS_TRANSFER_REQUEST_DEPT, SALES_CATEGORY} = require("../../../../mocks/constantData");
const {filteredItemList} = require("../../../../models/purchase/repository/itemRepository");
const InventoryRepository = require("../../../../models/stores/repository/inventoryCorrectionRepository");
const {getAllSupplierCategory} = require("../../settings/supplierCategory/supplierCategory");
const {getIncrementNumWithPrefix, checkDomesticCustomer} = require("../../../../helpers/utility");

const {getAllModuleMaster} = require("../../settings/module-master/module-master");
// @route   GET /purchase/Debit Note/getAll
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllDebitNoteAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), DNStatus: {$in: ["Awaiting Approval", "Approved"]}}},
            {
                $addFields: {
                    netDNValue: {$toString: "$netDNValue"},
                    DNDateS: {$dateToString: {format: "%d-%m-%Y", date: "$DNDate"}},
                    invoiceDateS: {$dateToString: {format: "%d-%m-%Y", date: "$invoiceDate"}}
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"}
        ];
        let rows = await DebitNoteRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllDN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @route   POST /purchase/Debit Note/create
exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await DebitNoteRepository.createDoc(createdObj);
        await updateInventoryOnDebit(itemDetails, "create");
        // await updateRejectQtyModel(itemDetails, "created");
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Debit Note")
            });
            // let mailCreateObj = {
            //     id: itemDetails._id,
            //     action: "created",
            //     company: req.user.company,
            //     mailAction: "Create"
            // };
            // getDNMailConfig(mailCreateObj);
            let mailTriggerCreateObj = {
                subModuleId: itemDetails._id,
                action: "created",
                company: req.user.company,
                mailAction: "Create",
                collectionName: DEBIT_NOTE.COLLECTION_NAME,
                message: `Debit Note created - ${itemDetails.DNNumber}`,
                module: PURCHASE_MAIL_CONST.DEBIT_NOTE.MODULE,
                subModule: PURCHASE_MAIL_CONST.DEBIT_NOTE.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Debit note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @route   PUT /purchase/Debit Note/update/:id
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await DebitNoteRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await DebitNoteRepository.updateDoc(itemDetails, req.body);
        // if (itemDetails.DNStatus == "Rejected" || itemDetails.DNStatus == "Awaiting Approval") {
        //     await updateRejectQtyModel(itemDetails, "updated");
        // }
        await updateInventoryOnDebit(itemDetails, "update");
        if (itemDetails) {
            res.success({
                message: `Debit Note has been ${
                    itemDetails.DNStatus == "Awaiting Approval" ? "updated" : itemDetails.DNStatus.toLowerCase()
                } successfully`
            });
            // let mailUpdateObj = {
            //     id: itemDetails._id,
            //     action: "modified",
            //     company: req.user.company,
            //     mailAction: itemDetails.DNStatus
            // };
            // getDNMailConfig(mailUpdateObj);
            if (
                [OPTIONS.defaultStatus.AWAITING_APPROVAL, OPTIONS.defaultStatus.REPORT_GENERATED].includes(
                    itemDetails.DNStatus
                )
            ) {
                let actions = {
                    "Awaiting Approval": "Modified",
                    "Report Generated": "Report Generated"
                };
                let mailTriggerCreateObj = {
                    subModuleId: itemDetails._id,
                    action: actions[itemDetails.DNStatus],
                    company: req.user.company,
                    mailAction: actions[itemDetails.DNStatus],
                    collectionName: DEBIT_NOTE.COLLECTION_NAME,
                    message: `Debit Note ${actions[itemDetails.DNStatus]} - ${itemDetails.DNNumber}`,
                    module: PURCHASE_MAIL_CONST.DEBIT_NOTE.MODULE,
                    subModule: PURCHASE_MAIL_CONST.DEBIT_NOTE.SUB_MODULE,
                    isSent: false
                };
                await MailTriggerRepository.createDoc(mailTriggerCreateObj);
            }
        }
    } catch (e) {
        console.error("update Debit Note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const updateInventoryOnDebit = async (itemDetails, flag) => {
    try {
        for await (const detail of itemDetails.DNDetails) {
            for (const FIFO of detail.FIFO) {
                if (FIFO.rejQty > 0) {
                    let inventoryObj = await InventoryRepository.getDocById(FIFO.IC);
                    if (flag == "create") {
                        inventoryObj.closedIRQty = FIFO.IRQty - FIFO.rejQty;
                        inventoryObj.previousDebitRejQty = FIFO.rejQty;
                    } else {
                        inventoryObj.closedIRQty =
                            inventoryObj.previousDebitRejQty + inventoryObj.closedIRQty - FIFO.rejQty;
                        inventoryObj.previousDebitRejQty = FIFO.rejQty;
                    }
                    await inventoryObj.save();
                }
            }
        }
    } catch (error) {
        console.error("error", error);
    }
};
// @route   PUT /purchase/Debit Note/delete/:id
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await DebitNoteRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Debit Note")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Debit Note");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Debit Note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @route   GET /purchase/Debit Note/getById/:id
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id)
            .populate("supplier")
            .populate("DNDetails.item")
            .populate({
                path: "company",
                model: "Company",
                select: {
                    companyName: 1,
                    GSTIN: 1,
                    companyBillingAddress: 1,
                    contactInfo: 1,
                    swiftCode: 1,
                    companyBankMICRCode: 1,
                    intermediaryBank: 1,
                    companyBefName: 1,
                    companyBankName: 1,
                    companyAccountNumber: 1,
                    companyBankIFSCCode: 1,
                    companyBankBranch: 1,
                    intermediaryBankSwiftCode: 1,
                    companySignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companySignature"]},
                    companyPdfHeaderUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companyPdfHeader"]}
                }
            })
            .populate("DNDetails.item", "_id itemCode itemName itemDescription")
            .lean();
        existing = await getDataPDF(existing);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Debit Note");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Debit Note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getDNDetailsById = asyncHandler(async (req, res) => {
    try {
        let existing = await DebitNoteRepository.filteredDebitNoteList([
            {
                $match: {
                    _id: ObjectId(req.params.id)
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
                                supplierCode: 1,
                                supplierName: 1,
                                supplierGST: 1,
                                supplierBillingAddress: 1,
                                supplierShippingAddress: 1,
                                supplierContactMatrix: 1
                            }
                        }
                    ],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"},
            {
                $lookup: {
                    from: "Items",
                    localField: "DNDetails.item",
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
                    as: "itemInfo"
                }
            },
            {
                $addFields: {
                    DNDetails: {
                        $map: {
                            input: "$DNDetails",
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
                    from: "Company",
                    localField: "company",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $addFields: {
                                contactInfo: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$contactInfo",
                                                as: "info",
                                                cond: {$eq: ["$$info.department", COMPANY_DEPARTMENTS.PURCHASE]}
                                            }
                                        },
                                        0
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                companyBankName: 1,
                                companyAccountNumber: 1,
                                companyBankIFSCCode: 1,
                                companyName: 1,
                                GSTIN: 1,
                                companyBankBranch: 1,
                                companyBankMICRCode: 1,
                                companyBefName: 1,
                                companyBillingAddress: 1,
                                contactInfo: 1,
                                companyContactPersonNumber: "$contactInfo.companyContactPersonNumber",
                                companyContactPersonEmail: "$contactInfo.companyContactPersonEmail",
                                companySignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companySignature"]},
                                companyPdfHeaderUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companyPdfHeader"]}
                            }
                        }
                    ],
                    as: "company"
                }
            },
            {$unwind: "$company"}
        ]);
        if (!existing.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Debit Note");
            return res.unprocessableEntity(errors);
        } else {
            existing = await getDataPDF(existing[0]);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Debit Note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @route   GET /purchase/Debit Note/getAllMasterData
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo({...DEBIT_NOTE.AUTO_INCREMENT_DATA()}, req.user.company);
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
                    supplierCode: 1,
                    label: "$supplierName",
                    value: "$_id",
                    supplierPurchaseType: 1,
                    supplierCurrency: 1,
                    categoryType: 1,
                    supplierBillingState: "$supplierBillingAddress.state",
                    supplierBillingCity: "$supplierBillingAddress.city",
                    supplierBillingPinCode: "$supplierBillingAddress.pinCode"
                }
            }
        ]);
        let purchaseTypes = await getAllSupplierCategory(req.user.company);
        if (purchaseTypes.length > 0) {
            purchaseTypes = purchaseTypes.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            });
        } else {
            const purchaseTypesOptions = await getAllModuleMaster(req.user.company, "PURCHASE_TYPE");
            purchaseTypes = purchaseTypesOptions?.map(x => x.label);
            purchaseTypes = await Promise.all(
                purchaseTypes.map(async ele => {
                    const isDomestic = await checkDomesticCustomer(ele);
                    return {
                        category: ele,
                        categoryType: isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.IMPORTS
                    };
                })
            );
        }

        return res.success({
            autoIncrementNo,
            suppliersOptions,
            purchaseTypesOptions: purchaseTypes
        });
    } catch (error) {
        console.error("getAllMasterData Debit Note", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @route   GET /purchase/Debit Note/getById/:id
exports.getAllDebitNoteBySupplierId = asyncHandler(async (req, res) => {
    try {
        let rows = await filteredItemList([
            {
                $unwind: "$supplierDetails"
            },
            {
                $match: {
                    company: ObjectId(req.user.company),
                    "supplierDetails.supplierId": ObjectId(req.params.id)
                }
            },
            {
                $project: {
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    hsn: 1,
                    gst: 1,
                    igst: 1,
                    sgst: 1,
                    cgst: 1,
                    ugst: 1,
                    orderInfoUOM: 1,
                    shelfLife: 1,
                    supplier: "$supplierDetails.supplierId",
                    standardRate: "$supplierDetails.stdCostUom1"
                }
            },
            {
                $lookup: {
                    from: "InventoryCorrection",
                    let: {date: "$shelfLife"},
                    localField: "_id",
                    foreignField: "item",
                    pipeline: [
                        {
                            $match: {
                                department: GOODS_TRANSFER_REQUEST_DEPT.STORES,
                                closedIRQty: {$gt: 0}
                            }
                        },

                        {
                            $project: {
                                _id: 0,
                                GINDate: 1,
                                IC: "$_id",
                                GIN: 1,
                                MRN: 1,
                                MRNNo: "$MRNNumber",
                                MRNDate: {$ifNull: ["$MRNDate", null]},
                                expiryDate: {
                                    $cond: [
                                        {$not: ["$shelfLife"]},
                                        null,
                                        {
                                            $dateAdd: {
                                                startDate: "$$date",
                                                unit: "month",
                                                amount: "$shelfLife"
                                            }
                                        }
                                    ]
                                },
                                aging: {
                                    $cond: {
                                        if: {
                                            $or: [
                                                {$eq: ["$item.expiryDate", null]},
                                                {
                                                    $gte: [
                                                        "$item.expiryDate",
                                                        {$add: [new Date(), 30 * 24 * 60 * 60 * 1000]}
                                                    ]
                                                }
                                            ]
                                        },
                                        then: "green",
                                        else: {
                                            $cond: {
                                                if: {
                                                    $gt: ["$item.expiryDate", new Date()]
                                                },
                                                then: "yellow",
                                                else: "red"
                                            }
                                        }
                                    }
                                },
                                UOM: 1,
                                IRQty: "$closedIRQty",
                                rejQty: {$literal: 0}
                            }
                        },
                        {
                            $group: {
                                _id: {MRN: "$MRN", UOM: "$UOM"},
                                GINDate: {$first: "$GINDate"},
                                IC: {$first: "$IC"},
                                GIN: {$first: "$GIN"},
                                MRN: {$first: "$MRN"},
                                MRNNo: {$first: "$MRNNo"},
                                MRNDate: {$first: "$MRNDate"},
                                expiryDate: {$first: "$expiryDate"},
                                aging: {$first: "$aging"},
                                UOM: {$first: "$UOM"},
                                IRQty: {$sum: "$IRQty"},
                                rejQty: {$first: "$rejQty"}
                            }
                        },
                        {
                            $project: {
                                _id: 0
                            }
                        },
                        {
                            $sort: {
                                MRNDate: 1
                            }
                        }
                    ],
                    as: "inventory"
                }
            },
            {
                $project: {
                    item: "$_id",
                    itemCode: "$itemCode",
                    itemName: "$itemName",
                    itemDescription: "$itemDescription",
                    hsn: "$hsn",
                    gst: "$gst",
                    igst: "$igst",
                    cgst: "$cgst",
                    sgst: "$sgst",
                    ugst: "$ugst",
                    MRNRejectedQty: {$literal: 0},
                    supplier: 1,
                    UOM: "$orderInfoUOM",
                    standardRate: 1,
                    purchaseRate: "$standardRate",
                    returnQty: {$literal: 0},
                    lineValue: {$literal: 0},
                    FIFO: "$inventory"
                }
            }
        ]);
        return res.success(rows);
    } catch (e) {
        console.error("getById Debit Note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        let suppliers = await getAllSuppliers(req.user.company, {supplierName: 1});
        const {supplier = null, fromDate = null, toDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            DNStatus: {$in: ["Report Generated"]},
            ...(!!supplier && {
                supplier: {$eq: ObjectId(supplier)}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    DNDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = getAllDebitNoteReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    DNDateS: {$dateToString: {format: "%d-%m-%Y", date: "$DNDate"}},
                    invoiceDateS: {$dateToString: {format: "%d-%m-%Y", date: "$invoiceDate"}}
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"}
        ];
        let rows = await DebitNoteRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        netDNValue: {$sum: {$toDouble: "$netDNValue"}}
                    }
                },
                {
                    $project: {
                        netDNValue: {$round: ["$netDNValue", 2]},
                        _id: 0
                    }
                }
            ]
        });
        return res.success({
            suppliers,
            ...rows
        });
    } catch (e) {
        console.error("getAllDN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getNetDebitNote = async company => {
    const rows = await Model.aggregate([
        {
            $match: {
                company: ObjectId(company),
                DNStatus: {$nin: ["Awaiting Approval", "Rejected"]},
                purchaseCategory: {$regex: /Domestic/i}
            }
        },
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$DNDate"}}
            }
        },
        {
            $facet: {
                MTDNetDebitNoteDomestic: [
                    {
                        $match: {
                            matchDate: {
                                $gte: dateToAnyFormat(getFirstDateOfMonth(), "YYYY-MM-DD"),
                                $lte: dateToAnyFormat(getLastDateOfMonth(), "YYYY-MM-DD")
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            amount: {$sum: "$netDNValue"}
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            amount: {$round: [{$divide: ["$amount", LAKH]}, 2]}
                        }
                    }
                ],
                YTDNetDebitNoteDomestic: [
                    {
                        $match: {
                            matchDate: {
                                $gte: dateToAnyFormat(getFirstDayOfFiscalYear(), "YYYY-MM-DD"),
                                $lte: dateToAnyFormat(getLastDayOfFiscalYear(), "YYYY-MM-DD")
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            amount: {$sum: "$netDNValue"}
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            amount: {$round: [{$divide: ["$amount", LAKH]}, 2]}
                        }
                    }
                ]
            }
        }
    ]);
    let obj = {
        MTDNetDebitNoteDomestic: rows[0]?.MTDNetDebitNoteDomestic[0]?.amount || 0,
        YTDNetDebitNoteDomestic: rows[0]?.YTDNetDebitNoteDomestic[0]?.amount || 0
    };
    return obj;
};

async function getDataPDF(existing) {
    try {
        if (existing?.supplier?.supplierContactMatrix?.length) {
            existing.supplier.supplierContactMatrix = existing.supplier.supplierContactMatrix[0];
        }
        if (existing?.supplier?.supplierBillingAddress?.length) {
            existing.supplier.supplierBillingAddress = existing.supplier.supplierBillingAddress[0];
        }
        if (existing?.supplier?.supplierShippingAddress?.length) {
            existing.supplier.supplierShippingAddress = existing.supplier.supplierShippingAddress[0];
        }

        let hsnArr = [...new Set(existing?.DNDetails?.map(x => x.hsn))];
        existing.GSTDetails = [];
        let condition = existing.supplier?.supplierGST.substring(0, 2) != existing.company.GSTIN.substring(0, 2);
        for (let i = 0; i < hsnArr.length; i++) {
            const element = hsnArr[i];
            let arr = existing?.DNDetails?.filter(m => m.hsn == element);
            let lineValue = Number(arr.map(y => +y.lineValue).reduce((a, c) => a + c, 0)).toFixed(2);
            let igstRate = 0;
            let igstAmount = 0;
            let cgstRate = 0;
            let cgstAmount = 0;
            let sgstRate = 0;
            let sgstAmount = 0;
            let ugstRate = 0;
            let ugstAmount = 0;

            if (condition) {
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
                totalTaxableValue: Number(+lineValue + +cgstAmount + +igstAmount + +sgstAmount + +ugstAmount).toFixed(2)
            });
        }
        if (existing.otherCharges && existing.otherCharges.totalAmount) {
            let lineValue = +existing?.otherCharges?.totalAmount;
            let igstRate = 0;
            let igstAmount = 0;
            let cgstRate = 0;
            let cgstAmount = 0;
            let sgstRate = 0;
            let sgstAmount = 0;
            let ugstRate = 0;
            let ugstAmount = 0;
            if (condition) {
                igstRate = 18;
                igstAmount = (+igstRate * +lineValue) / 100;
            } else {
                cgstRate = 9;
                sgstRate = 9;
                cgstAmount = (+cgstRate * +lineValue) / 100;
                sgstAmount = (+sgstRate * +lineValue) / 100;
            }
            existing.GSTDetails.push({
                hsn: "996511",
                taxableValue: +lineValue,
                igstRate: igstRate,
                igstAmount: igstAmount,
                cgstRate: cgstRate,
                cgstAmount: cgstAmount,
                sgstRate: sgstRate,
                sgstAmount: sgstAmount,
                ugstRate: ugstRate,
                ugstAmount: ugstAmount,
                totalTaxableValue: Number(+lineValue + +cgstAmount + +igstAmount + +sgstAmount + +ugstAmount).toFixed(2)
            });
        }

        existing.totalCGSTAmount = existing?.GSTDetails.map(y => +y.cgstAmount).reduce((a, c) => a + c, 0);
        existing.totalSGSTAmount = existing?.GSTDetails.map(y => +y.sgstAmount).reduce((a, c) => a + c, 0);
        existing.totalIGSTAmount = existing?.GSTDetails.map(y => +y.igstAmount).reduce((a, c) => a + c, 0);
        existing.totalUGSTAmount = existing?.GSTDetails.map(y => +y.ugstAmount).reduce((a, c) => a + c, 0);
        existing.totalTaxAmount =
            +existing.totalCGSTAmount +
            +existing.totalSGSTAmount +
            +existing.totalIGSTAmount +
            +existing.totalUGSTAmount;

        existing.totalAmount = existing?.GSTDetails.map(y => +y.taxableValue).reduce((a, c) => a + c, 0);
        existing.totalAmountWithTax = existing?.GSTDetails.map(y => +y.totalTaxableValue).reduce((a, c) => a + c, 0);
        existing.roundedOff = 0;
        existing.roundedOff += Math.round(existing.totalAmountWithTax) - +existing.totalAmountWithTax;
        existing.totalAmountWithTax = Math.round(+existing.totalAmountWithTax);
        return existing;
    } catch (error) {
        console.error(error);
    }
}
// async function updateRejectQtyModel(itemDetails, action) {
//     for await (const ele of itemDetails.DNDetails) {
//         let rejectedQtyObj = await RejectQtyModel.findOne({
//             supplier: itemDetails.supplier,
//             item: ele.item
//         });
//         if (ele.MRNRejectedQty != 0 && rejectedQtyObj && Object.keys(rejectedQtyObj).length) {
//             if (action == "created") {
//                 rejectedQtyObj.MRNRejectedQty -= +ele.returnQty;
//                 rejectedQtyObj.previousRejectedQty = +ele.returnQty;
//             } else {
//                 if (itemDetails.DNStatus == "Rejected") {
//                     rejectedQtyObj.MRNRejectedQty += +rejectedQtyObj.previousRejectedQty;
//                     rejectedQtyObj.previousRejectedQty = 0;
//                 }
//                 if (itemDetails.DNStatus == "Awaiting Approval") {
//                     rejectedQtyObj.MRNRejectedQty += +rejectedQtyObj.previousRejectedQty - +ele.returnQty;
//                     rejectedQtyObj.previousRejectedQty = +ele.returnQty;
//                 }
//             }
//             await rejectedQtyObj.save();
//         }
//     }
// }
exports.getAllDNSummaryReports = asyncHandler(async (req, res) => {
    try {
        const suppliers = await getAllSuppliers(req.user.company, {supplierName: 1});
        const {supplier = null, fromDate = null, toDate = null, DNStatus = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!supplier && {
                supplier: {$eq: ObjectId(supplier)}
            }),
            ...(!!DNStatus && {
                DNStatus: {$eq: DNStatus}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    DNDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = {
            supplierName: "$supplier.supplierName",
            totalDebitNotes: 1,
            totalAmountDebited: "$totalAmountDebited",
            DNStatus: 1
        };
        let pipeline = [
            {
                $match: query
            },
            {
                $group: {
                    _id: "$supplier",
                    totalDebitNotes: {
                        $sum: 1
                    },
                    totalAmountDebited: {
                        $sum: "$netDNValue"
                    }
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "_id",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, supplierName: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"}
        ];
        let rows = await DebitNoteRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        totalAmountDebited: {$sum: {$toDouble: "$totalAmountDebited"}}
                    }
                },
                {
                    $project: {
                        totalAmountDebited: {$round: ["$totalAmountDebited", 2]},
                        _id: 0
                    }
                }
            ]
        });
        return res.success({
            suppliers,
            statusOptions: ["Awaiting Approval", "Approved", "Rejected", "Report Generated", "Closed"],
            ...rows
        });
    } catch (e) {
        console.error("getAllDNSummaryReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getTotalNoOfDebitNotePerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$DNDate"}}
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
                totalDebitNote: {$sum: 1},
                totalDebitNoteValue: {$sum: "$netDNValue"}
            }
        },
        {
            $project: {
                _id: 0,
                totalDebitNote: 1,
                totalDebitNoteValue: {$round: ["$totalDebitNoteValue", 2]}
            }
        }
    ]);
    let obj = {
        totalDebitNote: rows[0]?.totalDebitNote || 0,
        totalDebitNoteValue: rows[0]?.totalDebitNoteValue || 0
    };
    return obj;
};

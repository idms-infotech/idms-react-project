const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const Model = require("../../../../models/purchase/purchaseIndentModel");
const {getAllPurchaseIndentAttributes} = require("../../../../models/purchase/helpers/purchaseIndentHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {PURCHASE_INDENT} = require("../../../../mocks/schemasConstant/purchaseConstant");
const PurchaseIndentRepository = require("../../../../models/purchase/repository/purchaseIndentRepository");
const {filteredChannelPartnerList} = require("../../../../models/purchase/repository/channelPartnerRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {filteredItemList} = require("../../../../models/purchase/repository/itemRepository");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const purchaseIndentHelper = require("../../../../models/purchase/helpers/purchaseIndentHelper");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {CONSTANTS} = require("../../../../../config/config");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllPurchaseIndentAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), status: {$ne: OPTIONS.defaultStatus.REPORT_GENERATED}}}
        ];
        let rows = await PurchaseIndentRepository.getAllPaginate({
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
        const itemDetails = await PurchaseIndentRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Purchase Indent")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Purchase Indent", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await PurchaseIndentRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await PurchaseIndentRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Purchase Indent has been")
        });
    } catch (e) {
        console.error("update Purchase Indent", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await PurchaseIndentRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Purchase Indent")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Purchase Indent");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Purchase Indent", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await PurchaseIndentRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Purchase Indent");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Purchase Indent", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            PURCHASE_INDENT.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );

        purchaseCategoryOptions = await getAllModuleMaster( req.user.company,"PURCHASE_TYPE",);
       

        return res.success({autoIncrementNo, purchaseCategoryOptions});
    } catch (error) {
        console.error("getAllMasterData Purchase Indent", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getChannelsByCategory = asyncHandler(async (req, res) => {
    try {
        let channelList = await filteredChannelPartnerList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isCPActive: OPTIONS.defaultStatus.ACTIVE,
                    channelPartnerCategory: req.query.category
                }
            },
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
        return res.success(channelList);
    } catch (error) {
        console.error("getSupplierByCategory", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllItemsForChannels = asyncHandler(async (req, res) => {
    try {
        let itemsList = await filteredItemList([
            {
                $match: {
                    isActive: "A",
                    company: ObjectId(req.user.company)
                }
            },
            {
                $unwind: {
                    path: "$channelDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    "channelDetails.channelId": ObjectId(req.query.channelId)
                }
            },
            {
                $lookup: {
                    from: "ChannelPartner",
                    localField: "channelDetails.channelId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                currency: 1
                            }
                        }
                    ],
                    as: "channelDetails.channelId"
                }
            },
            {$unwind: "$channelDetails.channelId"},
            {
                $project: {
                    unitConversion: "$conversionOfUnits",
                    primaryToSecondaryConversion: 1,
                    secondaryToPrimaryConversion: 1,
                    item: "$_id",
                    itemCode: 1,
                    itemName: "$itemName",
                    itemDescription: "$itemDescription",
                    UOM: {$ifNull: ["$orderInfoUOM", "$primaryUnit"]},
                    POQty: 1,
                    balancedQty: 1,
                    currency: "$channelDetails.channelId.currency",
                    standardRate: "$channelDetails.stdCostUom1",
                    purchaseRate: "$channelDetails.stdCostUom1",
                    stdCostUom1: "$channelDetails.stdCostUom1",
                    stdCostUom2: "$channelDetails.stdCostUom2",
                    primaryUnit: "$channelDetails.uom1",
                    secondaryUnit: "$channelDetails.uom2",
                    IOQty: {$literal: 0},
                    lineValue: {$literal: 0},
                    deliverySchedule: [
                        {
                            scheduleNo: null,
                            quantity: {$literal: 0},
                            deliveryDate: null
                        }
                    ],
                    _id: 0
                }
            }
        ]);
        return res.success(itemsList);
    } catch (error) {
        console.error("getAllItemsForSupplier", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        let channelPartnerOptions = await filteredChannelPartnerList(
            [
                {
                    $match: {
                        company: ObjectId(req.user.company),
                        isCPActive: OPTIONS.defaultStatus.ACTIVE
                    }
                }
            ],
            {channelPartnerName: 1}
        );
        const {channelPartner = null, toDate = null, fromDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            status: OPTIONS.defaultStatus.REPORT_GENERATED,
            ...(!!channelPartner && {
                channelPartner: ObjectId(channelPartner)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    indentOrderDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = purchaseIndentHelper.getAllPurchaseIndentReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    indentOrderDates: {$dateToString: {format: "%d-%m-%Y", date: "$indentOrderDate"}}
                }
            },
            {
                $lookup: {
                    from: "ChannelPartner",
                    localField: "channelPartner",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, channelPartnerName: 1}}],
                    as: "channelPartner"
                }
            },
            {$unwind: "$channelPartner"}
        ];
        let rows = await PurchaseIndentRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        netPIValue: {$sum: {$toDouble: "$netPIValue"}}
                    }
                },
                {
                    $project: {
                        netPIValue: {$round: ["$netPIValue", 2]}
                    }
                }
            ]
        });
        return res.success({
            channelPartnerOptions,
            ...rows
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getPIndentDetailsById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id)
            .populate(
                "channelPartner",
                " CPCode channelPartnerName currency GSTIN  paymentTerms contactMatrix billingAddress shippingAddress"
            )
            .populate(
                "indentDetails.item",
                "itemCode itemName itemDescription itemPacking spin hsn gst igst sgst cgst ugst channelDetails primaryUnit primaryToSecondaryConversion secondaryUnit secondaryToPrimaryConversion"
            )
            .populate({
                path: "company",
                model: "Company",
                select: {
                    companyName: 1,
                    GSTIN: 1,
                    placesOfBusiness: 1,
                    contactInfo: 1,
                    companyBillingAddress: 1,
                    companyContactPersonAltNum: 1,
                    PODomesticTemplates: 1,
                    POImportsTemplates: 1,
                    logoUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$logo"]},
                    companySignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companySignature"]},
                    companyPdfHeaderUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companyPdfHeader"]}
                }
            })
            .lean();
        existing = await getDataPDF(existing);
        // if (existing.changedPaymentTerms) {
        //     existing.channelPartner.supplierPaymentTerms = existing.changedPaymentTerms;
        // }
        existing.indentDetails = existing.indentDetails.map(x => {
            x.item.channelPartNo =
                x.item.channelDetails.find(y => String(y.channelId) == String(existing.channelPartner._id))?.spin ?? "";

            return x;
        });
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Purchase Indent");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Purchase Indent", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

async function getDataPDF(existing) {
    try {
        if (existing.channelPartner.contactMatrix.length) {
            existing.channelPartner.contactMatrix = existing.channelPartner.contactMatrix[0];
        }
        if (existing.channelPartner.shippingAddress.length) {
            existing.channelPartner.shippingAddress = existing.channelPartner.shippingAddress[0];
        }
        if (existing.channelPartner.billingAddress.length) {
            existing.channelPartner.billingAddress = existing.channelPartner.billingAddress[0];
        }
        return existing;
    } catch (error) {
        console.error(error);
    }
}

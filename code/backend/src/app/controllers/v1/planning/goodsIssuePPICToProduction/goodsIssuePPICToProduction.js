const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllGoodsIssuePPICToProductionAttributes
} = require("../../../../models/planning/helpers/goodsIssuePPICToProductionHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {GOODS_ISSUE_PPIC_TO_PRODUCTION} = require("../../../../mocks/schemasConstant/planningConstant");
const GoodsIssuePPICToProductionRepository = require("../../../../models/planning/repository/goodsIssuePPICToProductionRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {OPTIONS} = require("../../../../helpers/global.options");
const WIPInventoryRepository = require("../../../../models/planning/repository/WIPInventoryRepository");
const {filteredJobCardList} = require("../../../../models/planning/repository/jobCardRepository");
const SFGStockRepository = require("../../../../models/planning/repository/SFGStockRepository");
const {getCompanyById} = require("../../settings/company/company");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllGoodsIssuePPICToProductionAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await GoodsIssuePPICToProductionRepository.getAllPaginate({
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
        const itemDetails = await GoodsIssuePPICToProductionRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Goods Issue PPIC To Production")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Goods Issue PPIC To Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await GoodsIssuePPICToProductionRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        if (req.body.status == OPTIONS.defaultStatus.APPROVED) {
            for (const ele of req.body.MRNDetails) {
                if (ele.WIP) {
                    let WIPObj = await WIPInventoryRepository.getDocById(ele.WIP);
                    if (WIPObj) {
                        if (WIPObj.UOM == ele.UOM) {
                            WIPObj.PPICQty = WIPObj.PPICQty - ele.issueQty;
                        } else {
                            if (ele.UOM == ele.secondaryUnit) {
                                if (ele.primaryToSecondaryConversion) {
                                    WIPObj.PPICQty = WIPObj.PPICQty - +ele.issueQty / +ele.primaryToSecondaryConversion;
                                }
                                if (ele.secondaryToPrimaryConversion) {
                                    WIPObj.PPICQty = WIPObj.PPICQty - +ele.issueQty * +ele.secondaryToPrimaryConversion;
                                }
                            } else {
                                if (ele.primaryToSecondaryConversion) {
                                    WIPObj.PPICQty = WIPObj.PPICQty - +ele.issueQty * +ele.primaryToSecondaryConversion;
                                }
                                if (ele.secondaryToPrimaryConversion) {
                                    WIPObj.PPICQty = WIPObj.PPICQty - +ele.issueQty / +ele.secondaryToPrimaryConversion;
                                }
                            }
                        }
                        await WIPObj.save();
                    }
                }
                if (ele.SFG) {
                    let SFGObj = await SFGStockRepository.getDocById(ele.SFG);
                    if (SFGObj) {
                        if (SFGObj.UOM == ele.UOM) {
                            SFGObj.PPICQty = SFGObj.PPICQty - ele.issueQty;
                        } else {
                            if (ele.UOM == ele.secondaryUnit) {
                                if (ele.primaryToSecondaryConversion) {
                                    SFGObj.PPICQty = SFGObj.PPICQty - +ele.issueQty / +ele.primaryToSecondaryConversion;
                                }
                                if (ele.secondaryToPrimaryConversion) {
                                    SFGObj.PPICQty = SFGObj.PPICQty - +ele.issueQty * +ele.secondaryToPrimaryConversion;
                                }
                            } else {
                                if (ele.primaryToSecondaryConversion) {
                                    SFGObj.PPICQty = SFGObj.PPICQty - +ele.issueQty * +ele.primaryToSecondaryConversion;
                                }
                                if (ele.secondaryToPrimaryConversion) {
                                    SFGObj.PPICQty = SFGObj.PPICQty - +ele.issueQty / +ele.secondaryToPrimaryConversion;
                                }
                            }
                        }
                        await SFGObj.save();
                    }
                }
            }
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await GoodsIssuePPICToProductionRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Goods Issue PPIC To Production has been")
        });
    } catch (e) {
        console.error("update Goods Issue PPIC To Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await GoodsIssuePPICToProductionRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Goods Issue PPIC To Production")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Goods Issue PPIC To Production");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Goods Issue PPIC To Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await GoodsIssuePPICToProductionRepository.filteredGoodsIssuePPICToProductionList([
            {
                $match: {
                    _id: ObjectId(req.params.id)
                }
            },
            {
                $addFields: {
                    MRNDetails: {
                        $map: {
                            input: "$MRNDetails",
                            as: "details",
                            in: {
                                $mergeObjects: [
                                    "$$details",
                                    {
                                        aging: {
                                            $cond: {
                                                if: {
                                                    $or: [
                                                        {$eq: ["$$details.expiryDate", null]},
                                                        {
                                                            $gte: [
                                                                "$$details.expiryDate",
                                                                {$add: [new Date(), 30 * 24 * 60 * 60 * 1000]}
                                                            ]
                                                        }
                                                    ]
                                                },
                                                then: "green",
                                                else: {
                                                    $cond: {
                                                        if: {
                                                            $gt: ["$$details.expiryDate", new Date()]
                                                        },
                                                        then: "orange",
                                                        else: "red"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        ]);
        if (existing.length == 0) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Goods Issue PPIC To Production");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing[0]);
    } catch (e) {
        console.error("getById Goods Issue PPIC To Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            GOODS_ISSUE_PPIC_TO_PRODUCTION.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        const goodsIssueToOptions = await getAllModuleMaster(req.user.company, "GOODS_ISSUE_PPIC");
        const companyData = await getCompanyById(req.user.company, {companyType: 1});
        let JCLookup = {};
        if (companyData.companyType == "Control Panel") {
            JCLookup = {
                $lookup: {
                    from: "JCEntry",
                    localField: "_id",
                    foreignField: "jobCard",
                    pipeline: [{$project: {_id: 1}}],
                    as: "jobCardEntry"
                }
            };
        } else {
            JCLookup = {
                $lookup: {
                    from: "JobCardEntry",
                    localField: "_id",
                    foreignField: "jobCard",
                    pipeline: [{$project: {_id: 1}}],
                    as: "jobCardEntry"
                }
            };
        }
        const JCOptions = await filteredJobCardList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED]}
                }
            },
            JCLookup,
            {
                $match: {
                    jobCardEntry: {$size: 0}
                }
            },
            {
                $addFields: {
                    JCDetails: {
                        $concatArrays: [
                            "$SKUDetails",
                            {
                                $map: {
                                    input: "$DSKUDetails",
                                    as: "details",
                                    in: {
                                        SKU: "$$details.DSKU",
                                        SKUNo: "$$details.DSKUNo",
                                        SKUName: "$$details.DSKUName",
                                        SKUDescription: "$$details.DSKUDescription",
                                        UOM: "$$details.UOM",
                                        batchQty: "$$details.batchQty"
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            {
                $unwind: {
                    path: "$JCDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: {jobCard: "$_id", SKU: "$JCDetails.SKU"},
                    jobCardNo: {$first: "$jobCardNo"},
                    SKUNo: {$first: "$JCDetails.SKUNo"},
                    SKUName: {$first: "$JCDetails.SKUName"},
                    SKUDescription: {$first: "$JCDetails.SKUDescription"},
                    UOM: {$first: "$JCDetails.UOM"},
                    batchQty: {$first: "$JCDetails.batchQty"}
                }
            },
            {
                $project: {
                    _id: "$_id.jobCard",
                    jobCardNo: 1,
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    UOM: 1,
                    batchQty: 1
                }
            },
            {
                $sort: {jobCardNo: 1}
            }
        ]);
        const WIPList = await WIPInventoryRepository.filteredWIPInventoryList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    PPICQty: {$gt: 0}
                }
            },
            {
                $lookup: {
                    from: "MRN",
                    localField: "MRN",
                    foreignField: "_id",
                    pipeline: [{$project: {MRNDate: 1}}],
                    as: "MRN"
                }
            },
            {$unwind: "$MRN"},
            {
                $addFields: {
                    shelfLife: {$cond: [{$ne: ["$shelfLife", null]}, {$toDouble: "$shelfLife"}, false]},
                    expiryDate: {
                        $dateAdd: {
                            startDate: "$GINDate",
                            unit: "month",
                            amount: "$shelfLife"
                        }
                    }
                }
            },
            {
                $project: {
                    type: "WIPInventory",
                    WIP: "$_id",
                    _id: 0,
                    MRNNumber: 1,
                    MRNDate: "$MRN.MRNDate",
                    MRN: "$MRN._id",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: 1,
                    item: "$item",
                    referenceModel: "Items",
                    conversionOfUnits: "$unitConversion",
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    primaryToSecondaryConversion: 1,
                    secondaryToPrimaryConversion: 1,
                    PPICQty: "$PPICQty",
                    aging: {
                        $cond: {
                            if: {
                                $or: [
                                    {$eq: ["$expiryDate", null]},
                                    {$gte: ["$expiryDate", {$add: [new Date(), 30 * 24 * 60 * 60 * 1000]}]}
                                ]
                            },
                            then: "green",
                            else: {
                                $cond: {
                                    if: {
                                        $gt: ["$expiryDate", new Date()]
                                    },
                                    then: "orange",
                                    else: "red"
                                }
                            }
                        }
                    },
                    expiryDate: 1,
                    issueQty: {$literal: 0}
                }
            }
        ]);
        const SFGList = await SFGStockRepository.filteredSFGStockList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    PPICQty: {$gt: 0}
                }
            },
            {
                $lookup: {
                    from: "MRN",
                    localField: "MRN",
                    foreignField: "_id",
                    pipeline: [{$project: {MRNDate: 1}}],
                    as: "MRN"
                }
            },
            {$unwind: "$MRN"},
            {
                $lookup: {
                    from: "Items",
                    let: {fieldId: "$item"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$fieldId"]
                                }
                            }
                        },
                        {
                            $project: {
                                primaryUnit: 1,
                                secondaryUnit: 1,
                                primaryToSecondaryConversion: 1,
                                secondaryToPrimaryConversion: 1,
                                conversionOfUnits: 1,
                                unitConversionFlag: 1
                            }
                        }
                    ],
                    as: "itemInfo"
                }
            },
            {
                $lookup: {
                    from: "ProductionItem",
                    let: {fieldId: "$item"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$fieldId"]
                                }
                            }
                        },
                        {
                            $project: {
                                primaryUnit: 1,
                                secondaryUnit: 1,
                                primaryToSecondaryConversion: 1,
                                secondaryToPrimaryConversion: 1,
                                conversionOfUnits: 1,
                                unitConversionFlag: 1
                            }
                        }
                    ],
                    as: "childItemInfo"
                }
            },
            {
                $addFields: {
                    item: {$concatArrays: ["$itemInfo", "$childItemInfo"]},
                    shelfLife: {$cond: [{$ne: ["$shelfLife", null]}, {$toDouble: "$shelfLife"}, false]},
                    expiryDate: {
                        $dateAdd: {
                            startDate: "$GINDate",
                            unit: "month",
                            amount: "$shelfLife"
                        }
                    }
                }
            },
            {
                $unwind: {
                    path: "$item",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    type: "SFGStock",
                    SFG: "$_id",
                    _id: 0,
                    MRNNumber: 1,
                    MRNDate: "$MRN.MRNDate",
                    MRN: "$MRN._id",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: 1,
                    item: "$item._id",
                    referenceModel: 1,
                    conversionOfUnits: "$item.conversionOfUnits",
                    primaryUnit: "$item.primaryUnit",
                    secondaryUnit: "$item.secondaryUnit",
                    primaryToSecondaryConversion: {
                        $cond: [{$eq: ["$item.unitConversionFlag", 1]}, "$item.primaryToSecondaryConversion", null]
                    },
                    secondaryToPrimaryConversion: {
                        $cond: [{$eq: ["$item.unitConversionFlag", 2]}, "$item.secondaryToPrimaryConversion", null]
                    },
                    PPICQty: "$PPICQty",
                    aging: {
                        $cond: {
                            if: {
                                $or: [
                                    {$eq: ["$expiryDate", null]},
                                    {$gte: ["$expiryDate", {$add: [new Date(), 30 * 24 * 60 * 60 * 1000]}]}
                                ]
                            },
                            then: "green",
                            else: {
                                $cond: {
                                    if: {
                                        $gt: ["$expiryDate", new Date()]
                                    },
                                    then: "orange",
                                    else: "red"
                                }
                            }
                        }
                    },
                    expiryDate: 1,
                    issueQty: {$literal: 0}
                }
            }
        ]);
        return res.success({autoIncrementNo, goodsIssueToOptions, mergeList: [...WIPList, ...SFGList], JCOptions});
    } catch (error) {
        console.error("getAllMasterData Goods Issue PPIC To Production", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

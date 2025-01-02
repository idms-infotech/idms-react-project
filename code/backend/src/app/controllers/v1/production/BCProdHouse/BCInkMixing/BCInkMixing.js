const {ObjectId} = require("../../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../../helpers/messages.options");
const {
    getAllBCInkMixingAttributes
} = require("../../../../../models/production/helpers/BCProdHouseHelper.js/BCInkMixingHelper");
const BCInkMixingRepository = require("../../../../../models/production/repository/BCProdHouseRepo/BCInkMixingRepository");
const {
    filteredBOMOfProdItemList
} = require("../../../../../models/planning/repository/BOMRepository/BOMOfProdItemRepository");
const {getAllModuleMaster} = require("../../../settings/module-master/module-master");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllBCInkMixingAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await BCInkMixingRepository.getAllPaginate({
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

exports.createOrUpdate = asyncHandler(async (req, res) => {
    try {
        let logExists = await BCInkMixingRepository.findOneDoc({
            prodProcessConfig: req.body.prodProcessConfig,
            batchCard: req.body.batchCard,
            item: req.body.item
        });
        if (logExists) {
            logExists.updatedBy = req.user.sub;
            logExists = await BCInkMixingRepository.updateDoc(logExists, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            await BCInkMixingRepository.createDoc(createdObj);
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Ink Mixing Log")
        });
    } catch (e) {
        console.error("create Ink Mixing Log", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const {batchCard = null, prodProcessConfig = null, item = null} = req.query;
        let BCInkData = await BCInkMixingRepository.filteredBCInkMixingList([
            {
                $match: {
                    batchCard: ObjectId(batchCard),
                    prodProcessConfig: ObjectId(prodProcessConfig),
                    item: ObjectId(item)
                }
            },
            {
                $addFields: {
                    logDetails: {
                        $map: {
                            input: "$logDetails",
                            as: "ele",
                            in: {
                                $mergeObjects: [
                                    "$$ele",
                                    {
                                        newBatch: {
                                            $map: {
                                                input: "$$ele.newBatch",
                                                as: "newB",
                                                in: {
                                                    $mergeObjects: [
                                                        "$$newB",
                                                        {
                                                            aging: {
                                                                $cond: {
                                                                    if: {
                                                                        $or: [
                                                                            {$eq: ["$$newB.expiryDate", null]},
                                                                            {
                                                                                $gte: [
                                                                                    "$$newB.expiryDate",
                                                                                    {
                                                                                        $add: [
                                                                                            new Date(),
                                                                                            30 * 24 * 60 * 60 * 1000
                                                                                        ]
                                                                                    }
                                                                                ]
                                                                            }
                                                                        ]
                                                                    },
                                                                    then: "green",
                                                                    else: {
                                                                        $cond: {
                                                                            if: {
                                                                                $gt: ["$$newB.expiryDate", new Date()]
                                                                            },
                                                                            then: "yellow",
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
                                ]
                            }
                        }
                    }
                }
            }
        ]);
        if (!BCInkData?.length) {
            BCInkData = [{logDetails: []}];
            BCInkData[0].logDetails = await filteredBOMOfProdItemList([
                {
                    $match: {
                        item: ObjectId(item)
                    }
                },
                {
                    $unwind: "$BOMOfProdItemDetails"
                },
                {
                    $sort: {"BOMOfProdItemDetails.itemCode": 1}
                },
                {
                    $project: {
                        reference: "$BOMOfProdItemDetails.reference",
                        referenceModel: "$BOMOfProdItemDetails.referenceModel",
                        itemCode: "$BOMOfProdItemDetails.itemCode",
                        itemName: "$BOMOfProdItemDetails.itemName",
                        itemDescription: "$BOMOfProdItemDetails.itemDescription",
                        UOM: "$BOMOfProdItemDetails.UOM",
                        MBQty: "$BOMOfProdItemDetails.totalQtyPerPC",
                        MF: {$literal: 0},
                        qty: {$literal: 0}
                    }
                }
            ]);
        }
        const shiftOptions = await getAllModuleMaster(req.user.company, "PRODUCTION_SHIFT");
        return res.success({inkMixingLog: BCInkData?.length ? BCInkData[0] : {}, shiftOptions});
    } catch (error) {
        console.error("getAllMasterData Screen Making Log", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

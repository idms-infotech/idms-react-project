const {ObjectId} = require("../../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../../helpers/messages.options");
const {
    getAllBCProdLogAttributes
} = require("../../../../../models/production/helpers/BCProdHouseHelper.js/BCProdLogHelper");
const BCProdLogRepository = require("../../../../../models/production/repository/BCProdLogRepository");
const {getAllModuleMaster} = require("../../../settings/module-master/module-master");
const {
    filteredBOMOfProdItemList
} = require("../../../../../models/planning/repository/BOMRepository/BOMOfProdItemRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllBCProdLogAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await BCProdLogRepository.getAllPaginate({
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
        let logExists = await BCProdLogRepository.findOneDoc({
            prodProcessConfig: req.body.prodProcessConfig,
            batchCard: req.body.batchCard,
            item: req.body.item
        });
        if (logExists) {
            logExists.updatedBy = req.user.sub;
            logExists = await BCProdLogRepository.updateDoc(logExists, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            await BCProdLogRepository.createDoc(createdObj);
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("BC Prod Log")
        });
    } catch (e) {
        console.error("create BC Prod Log", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const {batchCard = null, prodProcessConfig = null, item = null} = req.query;
        let BCStockData = await BCProdLogRepository.filteredBCProdLogList([
            {
                $match: {
                    batchCard: ObjectId(batchCard),
                    prodProcessConfig: ObjectId(prodProcessConfig),
                    item: ObjectId(item)
                }
            },
            {
                $addFields: {
                    prodDetails: {
                        $map: {
                            input: "$prodDetails",
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
        if (!BCStockData?.length) {
            BCStockData = [
                {
                    prodDetails: [],
                    prodLog: {
                        details: [
                            {
                                prodDate: null,
                                shift: null,
                                UOM: null,
                                prodQty: null,
                                shiftInCharge: null
                            }
                        ],
                        totalProdQty: null,
                        prodRemarks: null,
                        prodInCharge: null
                    }
                }
            ];
            BCStockData[0].prodDetails = await filteredBOMOfProdItemList([
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
                        MRQ: {$literal: 0}
                    }
                }
            ]);
        }
        const shiftOptions = await getAllModuleMaster(req.user.company, "PRODUCTION_SHIFT");
        return res.success({stockProdLog: BCStockData?.length ? BCStockData[0] : null, shiftOptions});
    } catch (error) {
        console.error("getAllMasterData BC Prod log", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

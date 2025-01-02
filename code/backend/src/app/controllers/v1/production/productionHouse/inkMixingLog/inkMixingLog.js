const {ObjectId} = require("../../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../../helpers/messages.options");
const {getAllInkMixingLogAttributes} = require("../../../../../models/production/helpers/inkMixingLogHelper");
const InkMixingLogRepository = require("../../../../../models/production/repository/prodHouseRepo/inkMixingLogRepository");
const {filteredSKUMasterList} = require("../../../../../models/sales/repository/SKUMasterRepository");
const {getAllModuleMaster} = require("../../../settings/module-master/module-master");
const {filteredBoMOfSKUList} = require("../../../../../models/planning/repository/BOMRepository/BoMOfSKURepository");
const {INK_MIXING_UOM} = require("../../../../../mocks/constantData");
const {filteredSKUProcessFlowList} = require("../../../../../models/businessLeads/repository/SKUProcessFlowRepository");
const {OPTIONS} = require("../../../../../helpers/global.options");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllInkMixingLogAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await InkMixingLogRepository.getAllPaginate({
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
        let logExists = await InkMixingLogRepository.findOneDoc({
            SKUProcessFlow: req.body.SKUProcessFlow,
            jobCard: req.body.jobCard,
            SKU: req.body.SKU
        });
        if (logExists) {
            logExists.updatedBy = req.user.sub;
            logExists = await InkMixingLogRepository.updateDoc(logExists, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            delete createdObj._id;
            await InkMixingLogRepository.createDoc(createdObj);
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
        let inkList = {};
        inkList = await InkMixingLogRepository.findOneDoc({
            jobCard: ObjectId(req.query.jobCard),
            SKU: ObjectId(req.query.SKU),
            SKUProcessFlow: ObjectId(req.query.SKUProcessFlow)
        });
        if (!inkList) {
            let SKUData = await filteredSKUMasterList([
                {
                    $match: {
                        _id: ObjectId(req.query.SKU)
                    }
                },
                {
                    $sort: {SKUNo: 1}
                },
                {
                    $project: {
                        jobCard: req.query.jobCard,
                        jobCardNo: req.query.jobCardNo,
                        SKU: "$_id",
                        SKUNo: 1,
                        SKUName: 1,
                        SKUDescription: 1,
                        UOM: "$primaryUnit",
                        SKUBatchQty: req.query.batchQty,
                        inkMixingLogDetails: {
                            $map: {
                                input: "$inkDetails",
                                as: "details",
                                in: {
                                    SN: "$$details.colSeq",
                                    ink: "$$details.inkId",
                                    colourCode: "$$details.itemCode",
                                    colourName: "$$details.itemName",
                                    colourDescription: "$$details.itemDescription",
                                    mesh: "$$details.mesh",
                                    UOM: "$$details.UoM",
                                    logDetails: {
                                        prodSource: null,
                                        prodDate: null,
                                        prodShift: null,
                                        operatingStaff: null,
                                        remarks: null,
                                        authorizedBy: null
                                    },
                                    processStatus: {$literal: false}
                                }
                            }
                        }
                    }
                }
            ]);

            let BOMOfSKUData = await filteredBoMOfSKUList([
                {
                    $match: {SKU: ObjectId(req.query.SKU)}
                },
                {
                    $project: {BOMOfSKUDetails: 1, partCount: 1}
                },
                {
                    $unwind: "$BOMOfSKUDetails"
                },
                {
                    $match: {
                        "BOMOfSKUDetails.referenceModel": "InkMaster"
                    }
                },
                {
                    $lookup: {
                        from: "InkMaster",
                        localField: "BOMOfSKUDetails.reference",
                        foreignField: "_id",
                        pipeline: [
                            {$project: {inkMasterDetails: 1, totalQtyPerGm: 1}},
                            {
                                $unwind: "$inkMasterDetails"
                            },
                            {
                                $match: {
                                    "inkMasterDetails.UoM": {$in: INK_MIXING_UOM.getInkMixingUOM()}
                                }
                            },
                            {
                                $project: {
                                    seq: "$inkMasterDetails.seq",
                                    item: "$inkMasterDetails.item",
                                    referenceModel: "$inkMasterDetails.referenceModel",
                                    itemCode: "$inkMasterDetails.itemCode",
                                    itemName: "$inkMasterDetails.itemName",
                                    itemDescription: "$inkMasterDetails.itemDescription",
                                    quantity1: "$inkMasterDetails.qtyPerKgFinal",
                                    UOM1: "$inkMasterDetails.UoM",
                                    totalQtyPerGm: "$totalQtyPerGm",
                                    _id: 1
                                }
                            }
                        ],
                        as: "ink"
                    }
                },
                {
                    $addFields: {
                        partCount: {
                            $cond: [
                                {
                                    $ne: ["$partCount", 0]
                                },
                                {$divide: ["$BOMOfSKUDetails.partCount", "$partCount"]},
                                "$BOMOfSKUDetails.partCount"
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        inkId: "$BOMOfSKUDetails.reference",
                        BOMQty: {$round: [{$multiply: ["$partCount", +req.query.batchQty]}, 3]},
                        MF: {$literal: 1},
                        inkBatchQty: {$round: ["$partCount", 3]},
                        newBatch: {
                            $map: {
                                input: "$ink",
                                as: "details",
                                in: {
                                    SN: "$$details.seq",
                                    item: "$$details.item",
                                    referenceModel: "$$details.referenceModel",
                                    itemCode: "$$details.itemCode",
                                    itemName: "$$details.itemName",
                                    itemDescription: "$$details.itemDescription",
                                    totalQtyPerGm: "$$details.totalQtyPerGm",
                                    quantity1: "$$details.quantity1",
                                    UOM1: "g",
                                    MF: {$literal: 1},
                                    quantity2: "$$details.quantity1",
                                    UOM2: "g"
                                }
                            }
                        }
                    }
                }
            ]);
            if (SKUData.length) {
                inkList = SKUData[0];
                inkList.inkMixingLogDetails = inkList?.inkMixingLogDetails?.map(x => {
                    let inkIdMatchData = BOMOfSKUData.find(ele => String(ele.inkId) == String(x.ink));
                    if (inkIdMatchData) {
                        delete inkIdMatchData.inkId;
                        return {...x, ...inkIdMatchData};
                    } else {
                        return x;
                    }
                });
            }
        }
        const SKUProcessData = await filteredSKUProcessFlowList([
            {
                $match: {
                    SKU: ObjectId(req.query.SKU)
                }
            },
            {
                $unwind: "$PFDetails"
            },
            {
                $lookup: {
                    from: "ProcessMaster",
                    localField: "PFDetails.process",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $match: {
                                status: OPTIONS.defaultStatus.ACTIVE,
                                processOriginalName: req.query.processName
                            }
                        },
                        {$project: {sourceOfManufacturing: 1}}
                    ],
                    as: "processMaster"
                }
            },
            {$unwind: "$processMaster"},
            {
                $project: {
                    sourceOfManufacturing: "$processMaster.sourceOfManufacturing"
                }
            }
        ]);
        const shiftOptions = await getAllModuleMaster(req.user.company, "PRODUCTION_SHIFT");
        return res.success({
            inkMixingLog: inkList,
            shiftOptions,
            SKUProcessData: SKUProcessData.length ? SKUProcessData[0] : {}
        });
    } catch (error) {
        console.error("getAllMasterData Screen Making Log", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

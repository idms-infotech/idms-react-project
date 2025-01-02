const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllBatchCardEntryAttributes} = require("../../../../models/production/helpers/batchCardEntryHelper");
const BatchCardEntryRepository = require("../../../../models/production/repository/batchCardEntryRepository");
const {filteredBatchCardList} = require("../../../../models/planning/repository/batchCardRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {BATCH_CARD_ENTRY} = require("../../../../mocks/schemasConstant/productionConstant");
const {filteredProdProcessFlowList} = require("../../../../models/planning/repository/prodProcessFlowRepository");
const BatchCardRepository = require("../../../../models/planning/repository/batchCardRepository");
const {getCompanyLocations} = require("../../settings/company/company");
// const {createOnBCEntry} = require("../interProdStore/interProdStore");
const {filteredInvZoneConfigList} = require("../../../../models/planning/repository/invZoneConfigRepository");
const {createInvOnBCEntry} = require("../../stores/Inventory/Inventory");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllBatchCardEntryAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await BatchCardEntryRepository.getAllPaginate({
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
        let existing = await BatchCardEntryRepository.findOneDoc({
            batchCard: req.body.batchCard
        });
        if (existing) {
            existing.updatedBy = req.user.sub;
            existing = await BatchCardEntryRepository.updateDoc(existing, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            existing = await BatchCardEntryRepository.createDoc(createdObj);
        }
        if (existing.generateReport.checkoutStatus == OPTIONS.defaultStatus.MARK_AS_COMPLETED) {
            // await BatchCardRepository.findAndUpdateDoc(
            //     {
            //         _id: existing.batchCard
            //     },
            //     {
            //         $inc: {
            //             SOH: +existing.generateReport?.batchOutputQty
            //         }
            //     }
            // );
            await BatchCardRepository.updateManyDoc(
                {item: req.body.item, status: OPTIONS.defaultStatus.APPROVED},
                {
                    $set: {
                        batchQty: 0
                    }
                }
            );
            await createInvOnBCEntry(existing);
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Batch Card Entry")
        });
    } catch (e) {
        console.error("Batch Card Entry Log", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const {prodUnitConfig = null} = req.query;
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            BATCH_CARD_ENTRY.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        const batchCardOptions = await filteredBatchCardList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    batchQty: {$gt: 0},
                    status: OPTIONS.defaultStatus.APPROVED,
                    ...(!!prodUnitConfig && {
                        prodUnitConfig: ObjectId(prodUnitConfig)
                    })
                }
            },
            {
                $group: {
                    _id: "$item",
                    batchCardNo: {$last: "$batchCardNo"},
                    batchCard: {$last: "$_id"},
                    batchCardDate: {$last: "$batchCardDate"},
                    productionUnit: {$last: "$productionUnit"},
                    prodUnitConfig: {$last: "$prodUnitConfig"},
                    itemCode: {$last: "$itemCode"},
                    itemName: {$last: "$itemName"},
                    itemDescription: {$last: "$itemDescription"},
                    UOM: {$last: "$UOM"},
                    item: {$last: "$item"},
                    batchCode: {$last: "$batchCode"},
                    MF: {$last: "$MF"},
                    batchQty: {$sum: "$batchQty"}
                }
            },
            {
                $lookup: {
                    from: "ProductionItem",
                    localField: "_id",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, inwardTo: 1, invZone: 1}}],
                    as: "itemInfo"
                }
            },
            {
                $unwind: {
                    path: "$itemInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    batchCardNo: 1,
                    batchCard: 1,
                    batchCardDate: 1,
                    productionUnit: 1,
                    prodUnitConfig: 1,
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: 1,
                    item: "$_id",
                    batchQty: 1,
                    MF: 1,
                    batchCode: 1,
                    inventoryZone: "$itemInfo.inwardTo",
                    invZone: "$itemInfo.invZone"
                }
            },
            {
                $sort: {batchCardNo: 1}
            }
        ]);
        const billFromLocationOptions = await getCompanyLocations(req.user.company);
        const invZoneOptions = await filteredInvZoneConfigList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $sort: {
                    srNo: 1
                }
            },
            {
                $project: {
                    _id: 0,
                    invZone: "$_id",
                    invZoneName: 1,
                    label: {$concat: ["$invZoneCode", " - ", "$invZoneName"]}
                }
            }
        ]);
        return res.success({
            batchCardOptions,
            autoIncrementNo,
            billFromLocationOptions: billFromLocationOptions?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            }),
            invZoneOptions
        });
    } catch (error) {
        console.error("getAllMasterData Batch Card Entry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getProcessListByChildItemId = asyncHandler(async (req, res) => {
    try {
        const {prodUnitConfigId = null, itemId = null, batchCard = null} = req.query;
        let batchCardEntryData = [];
        batchCardEntryData = await BatchCardEntryRepository.filteredBatchCardEntryList([
            {
                $match: {
                    batchCard: ObjectId(batchCard)
                }
            }
        ]);
        if (batchCardEntryData.length == 0) {
            batchCardEntryData = await filteredBatchCardList([
                {
                    $match: {
                        company: ObjectId(req.user.company),
                        // _id: ObjectId(batchCard),
                        item: ObjectId(itemId),
                        status: {$in: [OPTIONS.defaultStatus.APPROVED]}
                    }
                },
                {
                    $group: {
                        _id: "$item",
                        batchQty: {$sum: "$batchQty"}
                    }
                },
                {
                    $project: {
                        _id: 0,
                        generateReport: {
                            batchInputQty: "$batchQty",
                            batchOutputQty: {$literal: 0},
                            batchRejQty: {$literal: 0},
                            jobCardClosureDate: {$literal: null},
                            checkoutStatus: {$literal: null}
                        }
                    }
                }
            ]);
        }
        const processList = await filteredProdProcessFlowList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    prodUnitConfig: ObjectId(prodUnitConfigId),
                    item: ObjectId(itemId)
                }
            },
            {$project: {processDetails: 1}},
            {
                $unwind: "$processDetails"
            },
            {
                $lookup: {
                    from: "ProdProcessConfig",
                    localField: "processDetails.processUnitId",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, processOriginalName: 1, qualityOriginalName: 1}}],
                    as: "mapProcess"
                }
            },
            {
                $unwind: {
                    path: "$mapProcess",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    srNo: "$processDetails.srNo",
                    processUnitId: "$processDetails.processUnitId",
                    processName: "$processDetails.processName",
                    source: "$processDetails.source",
                    processOriginalName: "$mapProcess.processOriginalName",
                    qualityOriginalName: "$mapProcess.qualityOriginalName"
                }
            },
            {
                $sort: {srNo: 1}
            }
        ]);
        return res.success({
            batchCardEntryData: batchCardEntryData?.length ? batchCardEntryData[0] : null,
            processList
        });
    } catch (error) {
        console.error("getProcessList Batch Card Entry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

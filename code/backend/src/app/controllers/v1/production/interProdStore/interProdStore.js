const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllInterProdStoreAttributes,
    getAllInterProdStoreReportsAttributes
} = require("../../../../models/production/helpers/interProdStoreHelper");
const InterProdStoreRepository = require("../../../../models/production/repository/interProdStoreRepository");
const {filteredProdItemList} = require("../../../../models/planning/repository/prodItemRepository");
const {filteredInvZoneConfigList} = require("../../../../models/planning/repository/invZoneConfigRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {filteredCompanyList} = require("../../../../models/settings/repository/companyRepository");
const {getEndDateTime} = require("../../../../helpers/dateTime");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllInterProdStoreAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await InterProdStoreRepository.getAllPaginate({
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
        const itemDetails = await InterProdStoreRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Inter Prod Store")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Inter Prod Store", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await InterProdStoreRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await InterProdStoreRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Inter Prod Store has been")
        });
    } catch (e) {
        console.error("update Inter Prod Store", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await InterProdStoreRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Inter Prod Store")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Inter Prod Store");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Inter Prod Store", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await InterProdStoreRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Inter Prod Store");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Inter Prod Store", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        return res.success({});
    } catch (error) {
        console.error("getAllMasterData Inter Prod Store", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.createOnBCEntry = async batch => {
    try {
        let itemInfo = await filteredProdItemList([
            {
                $match: {
                    _id: ObjectId(batch?.item)
                }
            },
            {
                $project: {
                    _id: 1,
                    expiryDate: {
                        $dateAdd: {
                            startDate: new Date(batch?.generateReport?.batchCardClosureDate),
                            unit: "month",
                            amount: "$shelfLife"
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "ProdItemStdCost",
                    localField: "_id",
                    foreignField: "item",
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                prodItemCost: {
                                    $reduce: {
                                        input: "$prodUnitDetails",
                                        initialValue: 0,
                                        in: {$add: ["$$value", "$$this.prodItemCost"]}
                                    }
                                }
                            }
                        }
                    ],
                    as: "itemCostInfo"
                }
            },
            {
                $unwind: {
                    path: "$itemCostInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    prodItemCost: {$ifNull: ["$itemCostInfo.prodItemCost", 0]},
                    expiryDate: 1
                }
            }
        ]);
        itemInfo = itemInfo?.length ? itemInfo[0] : {};
        let createObj = {
            company: batch?.company,
            createdBy: batch?.createdBy,
            updatedBy: batch?.updatedBy,
            item: batch?.item,
            batchCardEntry: batch?._id,
            prodUnitId: batch?.prodUnitConfig,
            invZone: batch?.invZone,
            invZoneName: batch?.inventoryZone,
            itemCode: batch?.itemCode,
            itemName: batch?.itemName,
            itemDescription: batch?.itemDescription,
            UOM: batch?.UOM,
            qty: batch?.generateReport?.batchOutputQty,
            unitRate: itemInfo?.prodItemCost,
            value: +batch?.generateReport?.batchOutputQty * +itemInfo?.prodItemCost,
            batchDate: batch?.generateReport?.batchCardClosureDate,
            expiryDate: itemInfo?.expiryDate,
            location: batch?.generateReport?.location
        };
        await InterProdStoreRepository.createDoc(createObj);
    } catch (error) {
        console.error("getAllMasterData Inter Prod Store", error);
    }
};

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
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
        const {toDate = null, invZone = null, location = null, prodUnitConfig = null} = req.query;
        let project = getAllInterProdStoreReportsAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    qty: {$gt: 0},
                    ...(!!invZone && {
                        invZone: ObjectId(invZone)
                    }),
                    ...(!!prodUnitConfig && {
                        prodUnitId: ObjectId(prodUnitConfig)
                    }),
                    ...(!!location && {
                        location: location
                    }),
                    ...(!!toDate && {
                        batchDate: {
                            $lte: getEndDateTime(toDate)
                        }
                    })
                }
            }
        ];
        let rows = await InterProdStoreRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        totalValue: {$sum: "$value"}
                    }
                }
            ]
        });
        return res.success({
            invZoneOptions,
            locationOptions,
            ...rows
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

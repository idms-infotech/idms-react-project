const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllProdProcessFlowAttributes} = require("../../../../models/planning/helpers/prodProcessFlowHelper");
const ProdProcessFlowRepository = require("../../../../models/planning/repository/prodProcessFlowRepository");
const ProdItemRepository = require("../../../../models/planning/repository/prodItemRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {filteredProdProcessConfigList} = require("../../../../models/planning/repository/prodProcessConfigRepository");
const {getAllProdItemCategory} = require("../../settings/prodItemCategory/prodItemCategory");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {filterBy = null, filterByCategory = null, prodUnitConfig = null} = req.query;
        const itemCategories = await getAllProdItemCategory([
            {
                $match: {
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ]);
        let project = getAllProdProcessFlowAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    prodUnitId: ObjectId(prodUnitConfig),
                    status: OPTIONS.defaultStatus.ACTIVE,
                    ...(!!filterByCategory && {
                        prodItemCategory: filterByCategory
                    })
                }
            },
            {
                $lookup: {
                    from: "ProdProcessFlow",
                    localField: "_id",
                    foreignField: "item",
                    pipeline: [
                        {$project: {revisionHistory: 1}},
                        {
                            $unwind: "$revisionHistory"
                        },
                        {$replaceRoot: {newRoot: "$revisionHistory"}}
                    ],
                    as: "revisionHistory"
                }
            },
            {
                $addFields: {
                    PFStatus: {
                        $cond: [
                            {$gt: [{$size: "$revisionHistory"}, 0]},
                            OPTIONS.defaultStatus.ACTIVE,
                            OPTIONS.defaultStatus.INACTIVE
                        ]
                    }
                }
            },
            {
                $match: {
                    ...(!!filterBy && {
                        PFStatus: filterBy
                    })
                }
            },
            {
                $sort: {itemCode: 1}
            }
        ];
        let rows = await ProdItemRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        activeItems: {$sum: 1},
                        itemLinkedData: {$sum: {$cond: [{$eq: ["$PFStatus", OPTIONS.defaultStatus.ACTIVE]}, 1, 0]}},
                        itemUnlinkedData: {$sum: {$cond: [{$eq: ["$PFStatus", OPTIONS.defaultStatus.INACTIVE]}, 1, 0]}}
                    }
                },
                {
                    $project: {
                        _id: 0
                    }
                }
            ]
        });
        return res.success({
            ...rows,
            statusArray: [
                {label: "Active Item Process Count", count: rows?.totalAmounts?.activeItems ?? 0},
                {label: "Total Item with Process Count", count: rows?.totalAmounts?.itemLinkedData ?? 0},
                {label: "Total Item without Process Count", count: rows?.totalAmounts?.itemUnlinkedData ?? 0}
            ],
            categoryOptions: itemCategories?.map(x => x?.category),
            statusOptions: [
                {label: "Summary by Item Category", value: ""},
                {label: "Summary by Status - Red", value: OPTIONS.defaultStatus.INACTIVE},
                {label: "Summary by Status - Green", value: OPTIONS.defaultStatus.ACTIVE}
            ]
        });
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
        const itemDetails = await ProdProcessFlowRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Prod Process Flow")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Prod Process Flow", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ProdProcessFlowRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await ProdProcessFlowRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Prod Process Flow has been")
        });
    } catch (e) {
        console.error("update Prod Process Flow", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await ProdProcessFlowRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Prod Process Flow")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Prod Process Flow");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Prod Process Flow", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await ProdProcessFlowRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Prod Process Flow");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Prod Process Flow", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const {itemId, prodUnitConfig} = req.query;
        let processFlow = await ProdProcessFlowRepository.findOneDoc({item: itemId, prodUnitConfig: prodUnitConfig});
        let procDetails = await filteredProdProcessConfigList([
            {
                $match: {
                    prodUnitConfigId: ObjectId(prodUnitConfig)
                }
            },
            {
                $sort: {
                    srNo: 1
                }
            },
            {
                $group: {
                    _id: "$prodUnitConfigId",
                    processDetails: {
                        $push: {srNo: null, processUnitId: "$_id", processName: "$prodProcessName", source: "$source"}
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    processDetails: 1
                }
            },
            {
                $unwind: "$processDetails"
            },
            {$replaceRoot: {newRoot: "$processDetails"}}
        ]);
        if (!processFlow) {
            let childItemObj = await ProdItemRepository.getDocById(itemId, {
                prodItemCategory: 1,
                itemCode: 1,
                itemName: 1,
                itemDescription: 1,
                unitOfMeasurement: 1,
                _id: 1
            });
            processFlow = {
                prodUnitConfig: prodUnitConfig,
                itemCategory: childItemObj?.prodItemCategory,
                itemCode: childItemObj?.itemCode,
                itemName: childItemObj?.itemName,
                itemDescription: childItemObj?.itemDescription,
                UOM: childItemObj?.unitOfMeasurement,
                item: childItemObj?._id,
                processDetails: procDetails,
                revisionInfo: {
                    revisionNo: null,
                    revisionDate: null,
                    reasonForRevision: null,
                    revisionProposedBy: null,
                    revisionApprovedBy: null
                }
            };
        }
        processFlow = JSON.parse(JSON.stringify(processFlow));
        processFlow.PROCESS_DETAILS = procDetails;
        return res.success(processFlow);
    } catch (error) {
        console.error("getAllMasterData Prod Process Flow", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllCopyFlowMasterData = asyncHandler(async (req, res) => {
    try {
        const {prodUnitConfig = null} = req.query;
        const prodItemList = await ProdItemRepository.filteredProdItemList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE,
                    prodUnitId: ObjectId(prodUnitConfig)
                }
            },
            {
                $lookup: {
                    from: "ProdProcessFlow",
                    localField: "_id",
                    foreignField: "item",
                    pipeline: [{$project: {_id: 1}}],
                    as: "prodProcessFlow"
                }
            },
            {
                $match: {
                    prodProcessFlow: {$size: 0}
                }
            },
            {
                $project: {
                    select: {$literal: false},
                    item: "$_id",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: "$unitOfMeasurement",
                    itemCategory: "$prodItemCategory"
                }
            }
        ]);
        const itemCategories = await getAllProdItemCategory([
            {
                $match: {
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {
                    _id: 0,
                    label: "$category",
                    value: "$category"
                }
            }
        ]);
        return res.success({itemCategoriesOptions: itemCategories, prodItemList});
    } catch (error) {
        console.error("getAllCopyFlowMasterData Process Flow", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.createCopy = asyncHandler(async (req, res) => {
    try {
        let existingData = await ProdProcessFlowRepository.findOneDoc({item: req.body.item});
        if (!existingData) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Process Flow");
            return res.unprocessableEntity(errors);
        }
        let PFArr = req.body.processArray.map(x => {
            return {
                company: existingData?.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                prodUnitConfig: existingData?.prodUnitConfig,
                item: x.item,
                itemCode: x.itemCode,
                itemName: x.itemName,
                itemDescription: x.itemDescription,
                UOM: x.UOM,
                itemCategory: x.itemCategory,
                processDetails: existingData?.processDetails,
                revisionInfo: req.body.revisionInfo,
                revisionHistory: [
                    {
                        prodUnitConfig: existingData?.prodUnitConfig,
                        item: x.item,
                        itemCode: x.itemCode,
                        itemName: x.itemName,
                        itemDescription: x.itemDescription,
                        UOM: x.UOM,
                        itemCategory: x.itemCategory,
                        processDetails: existingData?.processDetails,
                        revisionInfo: req.body.revisionInfo
                    }
                ]
            };
        });
        await ProdProcessFlowRepository.insertManyDoc(PFArr);
        return res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Process Flow")
        });
    } catch (e) {
        console.error("create Process Flow", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

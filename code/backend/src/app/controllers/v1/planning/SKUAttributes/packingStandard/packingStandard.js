const {ObjectId} = require("../../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../../helpers/messages.options");
const PackingStandardRepository = require("../../../../../models/planning/repository/SKUAttributesRepository/packingStandardRepository");
const SKURepository = require("../../../../../models/sales/repository/SKUMasterRepository");
const {OPTIONS} = require("../../../../../helpers/global.options");
const {getAllCheckedItemCategoriesList} = require("../../../purchase/itemCategoryMaster/itemCategoryMaster");
const {filteredItemList} = require("../../../../../models/purchase/repository/itemRepository");
const {getAllSKUCategory} = require("../../../settings/SKUCategoryMaster/SKUCategoryMaster");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const SKUCategoryOptions = await getAllSKUCategory(req.user.company, null, {
            _id: 0,
            SKUCategoryName: 1,
            displayProductCategoryName: 1
        });
        const {filterBy = null, filterByCategory = null} = req.query;
        let project = {
            SKUNo: 1,
            SKUName: 1,
            SKUDescription: 1,
            UOM: "$primaryUnit",
            productCategory: 1,
            SKUStage: 1,
            revisionHistory: "$packingStandardInfo.revisionHistory",
            status: 1
        };
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ...(!!filterByCategory && {
                        productCategory: filterByCategory
                    })
                }
            },
            {
                $lookup: {
                    from: "PackingStandard",
                    localField: "_id",
                    foreignField: "SKU",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                status: 1,
                                revisionHistory: "$revisionHistory"
                            }
                        }
                    ],
                    as: "packingStandardInfo"
                }
            },
            {
                $unwind: {
                    path: "$packingStandardInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    status: {$ifNull: ["$packingStandardInfo.status", OPTIONS.defaultStatus.INACTIVE]}
                }
            },
            {
                $match: {
                    ...(!!filterBy && {
                        status: filterBy
                    })
                }
            }
        ];
        let rows = await SKURepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        activeCount: {$sum: 1},
                        SKULinked: {
                            $sum: {
                                $cond: [
                                    {
                                        $in: ["$status", [OPTIONS.defaultStatus.ACTIVE]]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        SKUUnLinked: {
                            $sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.INACTIVE]}, 1, 0]}
                        }
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
            SKUCategoryOptions: SKUCategoryOptions?.map(x => x?.displayProductCategoryName),
            statusArray: [
                {label: "Active SKU Count", count: rows?.totalAmounts?.activeCount ?? 0},
                {label: "SKU Count - Packing STD Defined", count: rows?.totalAmounts?.SKULinked ?? 0},
                {label: "SKU Count - Packing STD Not Defined", count: rows?.totalAmounts?.SKUUnLinked ?? 0}
            ],
            statusOptions: [
                {label: "Summary by Category", value: ""},
                {label: "Report by Status - Green", value: OPTIONS.defaultStatus.ACTIVE},
                {label: "Report by Status - Red", value: OPTIONS.defaultStatus.INACTIVE}
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
        const itemDetails = await PackingStandardRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Packing Standard")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Packing Standard", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await PackingStandardRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await PackingStandardRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Packing Standard has been")
        });
    } catch (e) {
        console.error("update Packing Standard", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await PackingStandardRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Packing Standard")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Packing Standard");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Packing Standard", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await PackingStandardRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Packing Standard");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Packing Standard", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        return res.success({});
    } catch (error) {
        console.error("getAllMasterData Packing Standard", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getPackingDetailsBySKUId = asyncHandler(async (req, res) => {
    try {
        let existingData = await PackingStandardRepository.findOneDoc({SKU: ObjectId(req.params.id)});
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            packingStandard: true
        });
        itemCategoriesList = itemCategoriesList?.map(x => x?.category) || [];

        const itemsList = await filteredItemList([
            {
                $match: {
                    isActive: "A",
                    company: ObjectId(req.user.company),
                    itemType: {$in: itemCategoriesList}
                }
            },
            {
                $project: {
                    seq: null,
                    item: "$_id",
                    referenceModel: "Items",
                    itemCode: "$itemCode",
                    itemName: "$itemName",
                    itemDescription: "$itemDescription",
                    UOM: "$orderInfoUOM",
                    qtyPerPC: {$literal: 0},
                    remarks: null
                }
            }
        ]);
        if (!existingData) {
            let SKUData = await SKURepository.filteredSKUMasterList([
                {$match: {_id: ObjectId(req.params.id)}},
                {
                    $project: {
                        SKU: "$_id",
                        SKUNo: 1,
                        SKUName: 1,
                        SKUDescription: 1,
                        UOM: "$primaryUnit",
                        packCount: {$literal: 0},
                        masterCarterWeight: {$literal: 0}
                    }
                }
            ]);
            SKUData = SKUData?.length ? SKUData[0] : {};
            existingData = {
                SKU: SKUData?.SKU,
                SKUNo: SKUData?.SKUNo,
                SKUName: SKUData?.SKUName,
                SKUDescription: SKUData?.SKUDescription,
                UOM: SKUData?.UOM,
                packCount: SKUData?.packCount,
                masterCarterWeight: SKUData?.masterCarterWeight,
                details: itemsList,
                revisionInfo: {
                    revisionNo: null,
                    revisionDate: null,
                    reasonForRevision: null,
                    revisionProposedBy: null,
                    revisionApprovedBy: null
                }
            };
        }
        existingData = JSON.parse(JSON.stringify(existingData));
        existingData.ITEMS_LIST = itemsList;
        return res.success(existingData);
    } catch (e) {
        console.error("getPackingDetailsBySKUId", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllCopyFlowMasterData = asyncHandler(async (req, res) => {
    try {
        const SKUList = await SKURepository.filteredSKUMasterList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isActive: "A"
                }
            },
            {
                $project: {
                    select: {$literal: false},
                    SKU: "$_id",
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    UOM: "$primaryUnit",
                    productCategory: 1,
                    SKUStage: 1
                }
            },
            {
                $lookup: {
                    from: "PackingStandard",
                    localField: "SKU",
                    foreignField: "SKU",
                    pipeline: [{$project: {_id: 1}}],
                    as: "packingStdInfo"
                }
            },
            {
                $match: {
                    packingStdInfo: {$size: 0}
                }
            }
        ]);
        return res.success({SKUList});
    } catch (error) {
        console.error("getAllCopyFlowMasterData Packing Standard", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.createCopy = asyncHandler(async (req, res) => {
    try {
        let existingData = await PackingStandardRepository.findOneDoc({SKU: req.body.SKU});
        if (!existingData) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Packing Standard");
            return res.unprocessableEntity(errors);
        }
        let arr = req.body.SKUArray.map(x => {
            return {
                company: existingData?.company,
                createdBy: existingData?.createdBy,
                updatedBy: existingData?.updatedBy,
                SKU: x?.SKU,
                SKUNo: x?.SKUNo,
                SKUName: x?.SKUName,
                SKUDescription: x?.SKUDescription,
                status: OPTIONS.defaultStatus.ACTIVE,
                UOM: x?.UOM,
                packCount: existingData?.packCount,
                masterCarterWeight: existingData?.masterCarterWeight,
                details: existingData.details,
                revisionInfo: req.body.revisionInfo,
                revisionHistory: [
                    {
                        SKU: x?.SKU,
                        SKUNo: x?.SKUNo,
                        SKUName: x?.SKUName,
                        SKUDescription: x?.SKUDescription,
                        UOM: x?.UOM,
                        status: OPTIONS.defaultStatus.ACTIVE,
                        packCount: existingData?.packCount,
                        masterCarterWeight: existingData?.masterCarterWeight,
                        details: existingData.details,
                        revisionInfo: req.body.revisionInfo
                    }
                ]
            };
        });
        await PackingStandardRepository.insertManyDoc(arr);
        return res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Packing Standard")
        });
    } catch (e) {
        console.error("create Packing Standard", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

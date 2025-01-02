const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllMaterialRevalidationAttributes,
    getAllMaterialRevalidationReportsAttributes
} = require("../../../../models/quality/helpers/materialRevalidationHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {MATERIAL_REVALIDATION} = require("../../../../mocks/schemasConstant/qualityConstant");
const MaterialRevalidationRepository = require("../../../../models/quality/repository/materialRevalidationRepository");
const {filteredInvZoneConfigList} = require("../../../../models/planning/repository/invZoneConfigRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {filteredRejectedMRNList} = require("../../../../models/quality/repository/rejectedMRNRepository");
const RejectedMRNRepository = require("../../../../models/quality/repository/rejectedMRNRepository");
const {filteredSupplierList} = require("../../../../models/purchase/repository/supplierRepository");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllMaterialRevalidationAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    MRVStatus: {
                        $nin: [
                            OPTIONS.defaultStatus.REPORT_GENERATED,
                            OPTIONS.defaultStatus.REJECTED,
                            OPTIONS.defaultStatus.CLOSED
                        ]
                    }
                }
            }
        ];
        let rows = await MaterialRevalidationRepository.getAllPaginate({
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
        const itemDetails = await MaterialRevalidationRepository.createDoc(createdObj);
        await updateRejectedMRN(itemDetails.MRVDetails);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Material Revalidation")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Material Revalidation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const updateRejectedMRN = async details => {
    try {
        for await (const ele of details) {
            if (ele?.releasedQty > 0 || ele?.rejectedQty > 0) {
                await RejectedMRNRepository.findAndUpdateDoc(
                    {_id: ele?.rejectedMRN},
                    {status: OPTIONS.defaultStatus.CLOSED}
                );
            }
        }
    } catch (error) {
        console.error("error", error);
    }
};
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await MaterialRevalidationRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await MaterialRevalidationRepository.updateDoc(itemDetails, req.body);
        await updateRejectedMRNOnReject(itemDetails);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Material Revalidation has been")
        });
    } catch (e) {
        console.error("update Material Revalidation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const updateRejectedMRNOnReject = async details => {
    try {
        for await (const ele of details.MRVDetails) {
            if (details.MRVStatus == OPTIONS.defaultStatus.REJECTED) {
                await RejectedMRNRepository.findAndUpdateDoc(
                    {_id: ele?.rejectedMRN},
                    {status: OPTIONS.defaultStatus.CREATED}
                );
            }
        }
    } catch (error) {
        console.error("error", error);
    }
};
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await MaterialRevalidationRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Material Revalidation")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Material Revalidation");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Material Revalidation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await MaterialRevalidationRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Material Revalidation");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Material Revalidation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            MATERIAL_REVALIDATION.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
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
                    invZoneName: 1
                }
            }
        ]);
        return res.success({autoIncrementNo, invZoneOptions});
    } catch (error) {
        console.error("getAllMasterData Material Revalidation", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllRejectedMRNByLocation = asyncHandler(async (req, res) => {
    try {
        const {location = null} = req.query;
        const rejectedMRNList = await filteredRejectedMRNList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.CREATED,
                    deliveryLocation: location
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, itemCode: 1, itemName: 1, itemDescription: 1, itemType: 1}}],
                    as: "itemInfo"
                }
            },
            {
                $lookup: {
                    from: "ProductionItem",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                itemCode: 1,
                                itemName: 1,
                                itemDescription: 1,
                                itemType: "$prodItemCategory"
                            }
                        }
                    ],
                    as: "prodItemInfo"
                }
            },
            {
                $addFields: {
                    item: {$concatArrays: ["$itemInfo", "$prodItemInfo"]}
                }
            },
            {
                $unwind: "$item"
            },
            {
                $project: {
                    _id: 0,
                    rejectedMRN: "$_id",
                    MRN: 1,
                    MRNNumber: 1,
                    supplier: 1,
                    supplierRef: 1,
                    supplierName: 1,
                    item: "$item._id",
                    referenceModel: 1,
                    itemCode: "$item.itemCode",
                    itemName: "$item.itemName",
                    itemDescription: "$item.itemDescription",
                    itemType: "$item.itemType",
                    primaryToSecondaryConversion: 1,
                    secondaryToPrimaryConversion: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    conversionOfUnits: 1,
                    UOM: 1,
                    standardRate: 1,
                    purchaseRate: 1,
                    invoiceRate: 1,
                    batchDate: 1,
                    QCLevels: 1,
                    QRTQty: 1,
                    QCLevelsDetails: [],
                    releasedQty: {$literal: 0},
                    rejectedQty: {$literal: 0},
                    status: {$literal: null},
                    deviationApprovedBy: {$literal: null}
                }
            }
        ]);
        return res.success(rejectedMRNList);
    } catch (error) {
        console.error("getAllRejectedMRNByLocation Material Revalidation", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {supplierId = null, toDate = null, fromDate = null} = req.query;
        let project = getAllMaterialRevalidationReportsAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    MRVStatus: {
                        $in: [
                            OPTIONS.defaultStatus.REPORT_GENERATED,
                            OPTIONS.defaultStatus.REJECTED,
                            OPTIONS.defaultStatus.CLOSED
                        ]
                    },
                    ...(!!toDate &&
                        !!fromDate && {
                            MRVDate: {
                                $lte: getEndDateTime(toDate),
                                $gte: getStartDateTime(fromDate)
                            }
                        })
                }
            },
            {
                $unwind: "$MRVDetails"
            },
            {
                $match: {
                    ...(!!supplierId && {"MRVDetails.supplier": ObjectId(supplierId)})
                }
            }
        ];
        let rows = await MaterialRevalidationRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        const supplierOptions = await filteredSupplierList([
            {$match: {company: ObjectId(req.user.company), isSupplierActive: "A"}},
            {$sort: {supplierName: 1}},
            {
                $project: {
                    _id: 0,
                    supplierName: 1,
                    supplier: "$_id"
                }
            }
        ]);
        return res.success({...rows, supplierOptions});
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

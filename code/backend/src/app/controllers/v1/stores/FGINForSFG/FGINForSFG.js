const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllFGINForSFGAttributes} = require("../../../../models/stores/helpers/FGINForSFGHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {FGIN_FOR_SFG} = require("../../../../mocks/schemasConstant/storesConstant");
const FGINForSFGRepository = require("../../../../models/stores/repository/FGINForSFGRepository");
const {PROD_ITEM_CATEGORY_TYPE} = require("../../../../mocks/constantData");
const {OPTIONS} = require("../../../../helpers/global.options");
// const FGCorrectionRepository = require("../../../../models/production/repository/FGCorrectionRepository");
const {filteredProdItemList} = require("../../../../models/planning/repository/prodItemRepository");
const {getAllProdItemCategory} = require("../../settings/prodItemCategory/prodItemCategory");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllFGINForSFGAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await FGINForSFGRepository.getAllPaginate({
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

exports.bulkCreate = async (req, res) => {
    try {
        for await (const element of req.body.FGINEntry) {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                FGINNo: req.body.FGINNo,
                location: req.body.location,
                FGINDate: req.body.FGINDate,
                ...element,
                producedQty: element.FGINQuantity
            };
            await FGINForSFGRepository.createDoc(createdObj);
        }
        res.success({
            message: "Multiple FG Inventory created successfully"
        });
    } catch (e) {
        console.error("update FG Correction", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
exports.bulkUpdate = async (req, res) => {
    try {
        for await (const ele of req.body.FGINEntry) {
            let existing = await FGINForSFGRepository.getDocById(ele._id);
            if (existing) {
                existing.FGINQuantity = ele.FGINQuantity;
                existing.previousRecoQty = ele.previousRecoQty;
                existing.recoQtyPlusMinus = ele.recoQtyPlusMinus;
                existing.FGINDate = req.body.FGINDate;
                existing.entryAuthorizedBy = req.body.entryAuthorizedBy;
                existing.updatedBy = req.user.sub;
                await existing.save();
                // await FGCorrectionRepository.createDoc({
                //     company: req.user.company,
                //     createdBy: req.user.sub,
                //     updatedBy: req.user.sub,
                //     SKU: existing?.SKUId,
                //     SKUNo: existing?.SKUNo,
                //     SKUDescription: existing?.SKUDescription,
                //     correctionCategory: "Quantity Correction",
                //     sourceBatch: existing._id,
                //     transferQty: null,
                //     destinationBatch: null,
                //     correctedQty: ele?.recoQtyPlusMinus,
                //     availableSourceQty: ele?.previousRecoQty
                // });
            }
        }
        res.success({
            message: "Multiple FG Inventory Updated successfully"
        });
    } catch (e) {
        console.error("update FG Correction", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAllMasterData = async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...FGIN_FOR_SFG.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        const categoryOptions = await getAllProdItemCategory([
            {
                $match: {
                    type: PROD_ITEM_CATEGORY_TYPE.PRODUCTION_ITEM,
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
        return res.success({
            autoIncrementNo,
            categoryOptions: [
                {
                    label: "All",
                    value: ""
                },
                ...categoryOptions
            ]
        });
    } catch (error) {
        console.error("getAllMasterData   FGIN For SFG", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
exports.getSFGListByCategory = async (req, res) => {
    try {
        const {filterBy = null} = req.query;
        let SKUList = await filteredProdItemList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(req.user.company),
                    ...(!!filterBy && {prodItemCategory: filterBy})
                }
            },
            {
                $project: {
                    SKUId: "$_id",
                    _id: 0,
                    SKUNo: "$itemCode",
                    SKUName: "$itemName",
                    SKUDescription: "$itemDescription",
                    UOM: "$unitOfMeasurement",
                    DUC: "$conversionOfUnits",
                    shelfLife: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    batchNo: "",
                    jobCardNo: "-",
                    productCategory: "$prodItemCategory",
                    expiryDate: {
                        $cond: [
                            {$and: ["$shelfLife", {$gt: ["$shelfLife", 0]}]},
                            {
                                $dateAdd: {
                                    startDate: "$$NOW",
                                    unit: "day",
                                    amount: {$multiply: ["$shelfLife", 30]}
                                }
                            },
                            null
                        ]
                    }
                }
            },
            {
                $sort: {
                    SKUNo: 1
                }
            }
        ]);
        return res.success({
            SKUList
        });
    } catch (error) {
        console.error("getAllMasterData   FGIN For SFG", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getChildItemsForReco = async (req, res) => {
    try {
        const {filterBy = null} = req.query;
        let childItemsList = await FGINForSFGRepository.filteredFGINForSFGList([
            {
                $match: {company: ObjectId(req.user.company), FGINQuantity: {$gt: 0}}
            },
            {
                $lookup: {
                    from: "ProductionItem",
                    localField: "SKUId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $match: {
                                ...(!!filterBy && {prodItemCategory: filterBy})
                            }
                        }
                    ],
                    as: "childItemInfo"
                }
            },
            {$unwind: "$childItemInfo"},
            {
                $project: {
                    _id: 1,
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    UOM: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    DUC: 1,
                    manufacturingDate: {$dateToString: {format: "%d-%m-%Y", date: "$manufacturingDate"}},
                    previousRecoQty: "$FGINQuantity",
                    recoQtyPlusMinus: {$literal: 0},
                    recoQty: {$literal: 0},
                    FGINQuantity: 1,
                    batchNo: 1
                }
            },
            {
                $sort: {
                    SKUNo: 1
                }
            }
        ]);
        return res.success({
            childItemsList
        });
    } catch (error) {
        console.error("getAllMasterData   FGIN For Reco ", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

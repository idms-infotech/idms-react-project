const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/planning/SFGStockModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {dateToAnyFormat, getDateDiff} = require("../../../../helpers/dateTime");
const {
    getAllSFGStockAttributes,
    getAllSFGStockReportsAttributes
} = require("../../../../models/planning/helpers/SFGStockHelper");
const {SFG_STOCK} = require("../../../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const ProdItemRepository = require("../../../../models/planning/repository/prodItemRepository");
const SFGStockRepository = require("../../../../models/planning/repository/SFGStockRepository");
const InventoryCorrectionRepository = require("../../../../models/stores/repository/inventoryCorrectionRepository");
const {GOODS_TRANSFER_REQUEST_DEPT, STOCK_PREP_UOM} = require("../../../../mocks/constantData");
const {getAllCheckedItemCategoriesList} = require("../../purchase/itemCategoryMaster/itemCategoryMaster");
const ObjectId = mongoose.Types.ObjectId;

exports.create = asyncHandler(async (req, res) => {
    try {
        const {outputDetails, remarksDetails, selectedMRNDetails = []} = req.body;
        for await (const element of outputDetails) {
            const {status, _id, type, ...SFGDetails} = element;
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                type: "SFGStock",
                ...SFGDetails,
                ...remarksDetails
            };
            await InventoryCorrectionRepository.createDoc(createdObj);
        }
        for (const ele of selectedMRNDetails) {
            const invDoc = await InventoryCorrectionRepository.getDocById(ele._id, {
                UOM: 1
                // primaryUnit: 1,
                // secondaryUnit: 1,
                // primaryToSecondaryConversion: 1,
                // secondaryToPrimaryConversion: 1
            });
            // let closedIRQty = ele.closedIRQty;
            // let UOMConvertData = {
            //     UOM: invDoc.UOM,
            //     quantity: closedIRQty,
            //     primaryUnit: invDoc.primaryUnit,
            //     secondaryUnit: invDoc.secondaryUnit,
            //     primaryToSecondaryConversion: invDoc.primaryToSecondaryConversion,
            //     secondaryToPrimaryConversion: invDoc.secondaryToPrimaryConversion
            // };
            // if (invDoc.UOM != ele.UOM) {
            //     closedIRQty = setConversion(UOMConvertData);
            // }
            await InventoryCorrectionRepository.findAndUpdateDoc(
                {_id: ele._id},
                {
                    $set: {
                        closedIRQty: invDoc.UOM != ele.UOM ? ele.roll : ele.closedIRQty,
                        roll: ele.roll,
                        productionRemarks: remarksDetails.productionRemarks,
                        QARemarks: remarksDetails.QARemarks
                    }
                }
            );
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("SFG Stock")
        });
    } catch (e) {
        console.error("create SFG Stock", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// const getAllSFGOfSplit = async (company, _id = null, stage = null) => {
//     try {
//         let project = getAllSFGStockAttributes();
//         let rows = await SFGStockRepository.filteredSFGStockList([
//             {
//                 $match: {
//                     company: ObjectId(company),
//                     ...(!!_id && {_id: ObjectId(_id)}),
//                     ...(!!stage && {stage: stage}),
//                     PPICQty: {$gt: 0}
//                 }
//             },
//             {
//                 $addFields: {
//                     expiryDate: {
//                         $dateAdd: {
//                             startDate: "$GINDate",
//                             unit: "month",
//                             amount: "$shelfLife"
//                         }
//                     }
//                 }
//             },
//             {
//                 $match: {
//                     $or: [{expiryDate: {$gt: new Date()}}, {expiryDate: null}]
//                 }
//             },
//             {
//                 $addFields: {
//                     status: {
//                         $cond: {
//                             if: {
//                                 $or: [
//                                     {$eq: ["$expiryDate", null]},
//                                     {$gte: ["$expiryDate", {$add: [new Date(), 30 * 24 * 60 * 60 * 1000]}]}
//                                 ]
//                             },
//                             then: "green",
//                             else: {
//                                 $cond: {
//                                     if: {
//                                         $gt: ["$expiryDate", new Date()]
//                                     },
//                                     then: "orange",
//                                     else: "red"
//                                 }
//                             }
//                         }
//                     }
//                 }
//             },
//             {$project: project}
//         ]);
//         return rows;
//     } catch (error) {
//         console.error(error);
//     }
// };
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let SFGList = await getAllSFGOfSplit(req.user.company, "Roll");
        return res.success(SFGList);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getSheetToSheetList = asyncHandler(async (req, res) => {
    try {
        let SFGList = await getAllSFGOfSplit(req.user.company, "Sheet");
        return res.success(SFGList);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const getAllSFGOfSplit = async (company, stage = null, _id = null) => {
    try {
        let project = getAllSFGStockAttributes();
        let itemCategoryArray = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            stockPreparation: true
        });
        itemCategoryArray = itemCategoryArray.map(x => x.category);
        let rows = await InventoryCorrectionRepository.filteredInventoryCorrectionList([
            {
                $match: {
                    company: ObjectId(company),
                    department: GOODS_TRANSFER_REQUEST_DEPT.PLANNING,
                    itemType: {$in: itemCategoryArray},
                    ...(!!_id && {_id: ObjectId(_id)}),
                    ...(stage == "Roll" && {stage: {$ne: "Sheet"}}),
                    ...(stage == "Sheet" && {stage: {$eq: "Sheet"}}),
                    closedIRQty: {$gt: 0},
                    UOM: {$in: STOCK_PREP_UOM.getStockUOM()}
                }
            },
            {
                $addFields: {
                    status: {
                        $cond: {
                            if: {
                                $or: [
                                    {$eq: [{$type: "$expiryDate"}, "missing"]},
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
                    }
                }
            },
            {$project: project}
        ]);
        return rows;
    } catch (error) {
        console.error(error);
    }
};
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await generateCreateData(itemDetails, req.body);

        itemDetails = await itemDetails.save();
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("SFG stock has been")
        });
    } catch (e) {
        console.error("update SFG stock", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SFG Stock");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById SFG Stock", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("SFG Stock")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SFG Stock");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById SFG Stock", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const productionShifts = await getAllModuleMaster(req.user.company, "PRODUCTION_SHIFT");
        const processNames = await getAllModuleMaster(req.user.company, "STOCK_PROCESS_NAME");
        const machineNames = await getAllModuleMaster(req.user.company, "STOCK_MACHINE_NAME");
        const autoIncrementNo = await getAndSetAutoIncrementNo({...SFG_STOCK.AUTO_INCREMENT_DATA()}, req.user.company);
        return res.success({
            autoIncrementNo,
            processNames,
            machineNames,
            productionShifts
        });
    } catch (error) {
        console.error("getAllMasterData SFG Stock", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllSFGStock = async company => {
    try {
        let rows = await Model.find({
            company: company,
            "outputDetails.noOfSlits": {$gt: 0},
            "outputDetails.sqmTotal": {$gt: 0}
        }).sort({createdAt: -1});
        return rows;
    } catch (e) {
        console.error("getAllSFGStock", e);
    }
};

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        let project = getAllSFGStockReportsAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    roll: {$gt: 0},
                    PPICQty: {$gt: 0}
                }
            },
            {
                $addFields: {
                    expiryDate: {
                        $dateAdd: {
                            startDate: "$GINDate",
                            unit: "month",
                            amount: "$shelfLife"
                        }
                    }
                }
            }
        ];
        let output = await SFGStockRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        if (output.rows.length > 0) {
            for (const ele of output.rows) {
                if (!!ele.expiryDate) {
                    ele.expiryDate = dateToAnyFormat(ele.expiryDate, "YYYY-MM-DD");
                    let dateDiff = getDateDiff(ele.expiryDate, currentDate, "days");
                    if (+dateDiff < 0) {
                        ele.status = "red";
                    } else if (+dateDiff > 0 && +dateDiff < 30) {
                        ele.status = "orange";
                    } else {
                        ele.status = "green";
                    }
                } else {
                    ele.status = "green";
                }
            }
        }
        return res.success({
            ...output
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.updateSFGQtyOnStockIssue = async (stockIssueDetails, company) => {
    try {
        for (const ele of stockIssueDetails) {
            await Model.findOneAndUpdate(
                {
                    _id: ele.SFGId,
                    company: company
                },
                {
                    $inc: {
                        "outputDetails.noOfSlits": -+ele.qty,
                        "outputDetails.sheetQty": -+ele.sheetQty,
                        "outputDetails.sqmTotal": -+ele.issueQty
                    }
                }
            );
        }
    } catch (e) {
        console.error("updateSFGQtyOnStockIssue", e);
    }
};

exports.getStockPreparationByIdAndType = asyncHandler(async (req, res) => {
    try {
        const {_id, type, stage = null} = req.query;
        let childItemList = [];
        let output = await getAllSFGOfSplit(req.user.company, stage, _id);
        if (stage == "Roll To Sheet" || stage == "Sheet To Sheet") {
            childItemList = await ProdItemRepository.filteredProdItemList([
                {$match: {company: ObjectId(req.user.company), status: OPTIONS.defaultStatus.ACTIVE}},
                {
                    $project: {
                        itemCode: 1,
                        itemName: 1,
                        itemDescription: 1,
                        UOM: "$primaryUnit",
                        widthInMM: "$dualUnitsDimensionsDetails.widthInMM",
                        lengthInM: {$round: [{$multiply: ["$dualUnitsDimensionsDetails.lengthInM", 1000]}, 2]},
                        SQM: "$dualUnitsDimensionsDetails.sqmPerRoll"
                    }
                }
            ]);
        }
        return res.success({output, childItemList});
    } catch (e) {
        console.error("getStockPreparationByIdAndType", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

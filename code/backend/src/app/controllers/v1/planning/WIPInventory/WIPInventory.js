const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/planning/WIPInventoryModel");
const {default: mongoose} = require("mongoose");
const {dateToAnyFormat, getDateDiff, getExpiryDate} = require("../../../../helpers/dateTime");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllWIPInventoryReportsAttributes} = require("../../../../models/planning/helpers/WIPInventoryHelper");
const WIPInventoryRepository = require("../../../../models/planning/repository/WIPInventoryRepository");
const {STOCK_PREP_UOM} = require("../../../../mocks/constantData");
const ObjectId = mongoose.Types.ObjectId;

exports.insertWIPInventory = asyncHandler(async GIList => {
    try {
        await Model.insertMany(GIList);
    } catch (e) {
        console.error("create WIPInventory", e);
    }
});
exports.getAllWIPInventory = async company => {
    try {
        let rows = await Model.find({company: company, PPICQty: {$gt: 0}})
            .sort({createdAt: -1})
            .lean();
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");

        for (const ele of rows) {
            let expiryDate = null;
            if (ele.shelfLife) {
                expiryDate = getExpiryDate(ele.GINDate, ele.shelfLife);
            }
            if (!!expiryDate) {
                expiryDate = dateToAnyFormat(expiryDate, "YYYY-MM-DD");
                let dateDiff = getDateDiff(expiryDate, currentDate, "days");
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
        rows = rows.filter(x => x.status != "red");
        return rows;
    } catch (e) {
        console.error("getAllWIPInventory", e);
    }
};
exports.getAllWIPInventoryForSFG = async (company, _id = null) => {
    try {
        let rows = await Model.aggregate([
            {
                $match: {
                    ...(!!_id && {_id: ObjectId(_id)}),
                    UOM: {$in: STOCK_PREP_UOM.getStockUOM()},
                    PPICQty: {$gt: 0},
                    company: ObjectId(company)
                }
            },
            {
                $addFields: {
                    PPICQty: {$round: ["$PPICQty", 2]}
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                widthInMM: "$dualUnitsDimensionsDetails.widthInMM",
                                lengthInM: "$dualUnitsDimensionsDetails.lengthInM",
                                sqmPerRoll: "$dualUnitsDimensionsDetails.sqmPerRoll"
                            }
                        }
                    ],
                    as: "item"
                }
            },
            {
                $unwind: "$item"
            },
            {
                $addFields: {
                    shelfLife: {$cond: [{$ne: ["$shelfLife", null]}, {$toDouble: "$shelfLife"}, false]},
                    expiryDate: {
                        $dateAdd: {
                            startDate: "$GINDate",
                            unit: "month",
                            amount: "$shelfLife"
                        }
                    }
                }
            },
            {
                $match: {
                    $or: [{expiryDate: {$gt: new Date()}}, {expiryDate: null}]
                }
            },
            {
                $addFields: {
                    status: {
                        $cond: {
                            if: {
                                $or: [
                                    {$eq: ["$expiryDate", null]},
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
            {
                $project: {
                    MRN: 1,
                    MRNNumber: 1,
                    GIN: 1,
                    GINDate: 1,
                    item: "$item._id",
                    itemCode: 1,
                    itemName: 1,
                    shelfLife: 1,
                    itemDescription: 1,
                    department: 1,
                    deliveryLocation: 1,
                    UOM: STOCK_PREP_UOM.SQM,
                    // PPICQty: {
                    //     $cond: [
                    //         {$eq: ["$UOM", STOCK_PREP_UOM.SQM]},
                    //         "$PPICQty",
                    //         {
                    //             $round: [
                    //                 {
                    //                     $multiply: ["$PPICQty", "$item.sqmPerRoll"]
                    //                 },
                    //                 2
                    //             ]
                    //         }
                    //     ]
                    // },
                    // width: {$ifNull: ["$item.widthInMM", 0]},
                    // length: {$ifNull: ["$item.lengthInM", 0]},
                    // SQM: {$ifNull: ["$item.sqmPerRoll", 0]},
                    // roll: {
                    //     $cond: [
                    //         {$eq: ["$item.sqmPerRoll", 0]},
                    //         0,
                    //         {
                    //             $cond: [
                    //                 {$eq: ["$UOM", STOCK_PREP_UOM.SQM]},
                    //                 {
                    //                     $round: [
                    //                         {
                    //                             $divide: ["$PPICQty", {$ifNull: ["$item.sqmPerRoll", 1]}]
                    //                         },
                    //                         2
                    //                     ]
                    //                 },
                    //                 "$PPICQty"
                    //             ]
                    //         }
                    //     ]
                    // },
                    PPICQty: 1,
                    width: 1,
                    length: 1,
                    SQM: 1,
                    roll: 1,
                    status: 1,
                    primaryToSecondaryConversion: 1,
                    secondaryToPrimaryConversion: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    unitConversion: 1,
                    expiryDate: 1,
                    _id: 1,
                    type: "WIPInventory"
                }
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.updateWIPInventory = async (WIPId, rollQty, company) => {
    try {
        let rows = await Model.findOneAndUpdate(
            {
                _id: WIPId,
                company: company
            },
            {$inc: {PPICQty: -+rollQty}}
        );
        return rows;
    } catch (e) {
        console.error("updateWIPInventory", e);
    }
};
exports.updateWIPInventoryOnSFG = async (WIPId, rollQty, company, remarksDetails) => {
    try {
        let rows = await Model.findOneAndUpdate(
            {
                _id: WIPId,
                company: company
            },
            {$inc: {PPICQty: -+rollQty}, $set: remarksDetails}
        );
        return rows;
    } catch (e) {
        console.error("updateWIPInventory", e);
    }
};
exports.updateWIPInventoryOnResolveDiscrepancy = async GIDetails => {
    try {
        for await (const ele of GIDetails) {
            rows = await Model.findOneAndUpdate(
                {
                    item: ele.item,
                    MRN: ele.MRN
                },
                {$inc: {PPICQty: +ele.WIPQty}}
            );
        }
    } catch (e) {
        console.error("updateWIPInventory", e);
    }
};
exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        let project = getAllWIPInventoryReportsAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
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
        let output = await WIPInventoryRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });

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

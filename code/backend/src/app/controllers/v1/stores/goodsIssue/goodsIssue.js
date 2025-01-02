const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/stores/goodsIssueModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {expiryStatus} = require("../../../../helpers/utility");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {
    getGRById,
    updateGRQtyOnGIUpdate,
    updateGRQtyOnGICreate
} = require("../../production/goodsRequisition/goodsRequisition");
const {default: mongoose} = require("mongoose");
const {
    getAllInventoryCorrectionByItems,
    updateInventory,
    updateInventoryOnResolveDiscrepancy
} = require("../Inventory/Inventory");
const {
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFiscalMonthsName
} = require("../../../../utilities/utility");
const {
    insertWIPInventory,
    updateWIPInventoryOnResolveDiscrepancy
} = require("../../planning/WIPInventory/WIPInventory");
const {getCompanyLocations} = require("../../settings/company/company");
const {getEndDateTime, getStartDateTime, dateToAnyFormat} = require("../../../../helpers/dateTime");
const {
    getAllGoodsIssueAttributes,
    getAllGoodsIssueReportsAttributes
} = require("../../../../models/stores/helpers/goodsIssueHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {GOOD_ISSUE} = require("../../../../mocks/schemasConstant/storesConstant");
const {getAllCheckedItemCategoriesList} = require("../../purchase/itemCategoryMaster/itemCategoryMaster");
const {filteredGRList} = require("../../../../models/production/repository/GRRepository");
const GIRepository = require("../../../../models/stores/repository/goodsIssueRepository");
const ObjectId = mongoose.Types.ObjectId;

// @desc    getAll GoodsIssueAgainstGR Record
exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {statusKey = null} = req.query;
        let project = getAllGoodsIssueAttributes();
        let query = {};
        if (statusKey == "Discrepancy") {
            query = {
                company: ObjectId(req.user.company),
                GIStatus: {
                    $in: ["Discrepancy Reported", "Discrepancy Resolved"]
                }
            };
        } else if (statusKey == "GRAcknowledgement") {
            query = {
                company: ObjectId(req.user.company),
                GIStatus: {$in: ["Acknowledged", "Awaiting Acknowledgement", "Discrepancy Reported"]}
            };
        } else {
            query = {
                company: ObjectId(req.user.company),
                $or: [
                    {
                        GIStatus: {$in: ["Acknowledged", "Discrepancy Resolved"]},
                        updatedAt: {
                            $gte: new Date(new Date() - 1 * 60 * 60 * 24 * 1000)
                        }
                    },
                    {GIStatus: {$nin: ["Acknowledged", "Discrepancy Resolved"]}}
                ]
            };
        }
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "GoodsRequisition",
                    localField: "GRNumber",
                    foreignField: "_id",
                    pipeline: [{$project: {GRNumber: 1, GRDate: 1}}],
                    as: "GRNumber"
                }
            },
            {$unwind: "$GRNumber"},
            {
                $addFields: {
                    GIDateS: {$dateToString: {format: "%d-%m-%Y", date: "$GIDate"}},
                    GRDateS: {$dateToString: {format: "%d-%m-%Y", date: "$GRNumber.GRDate"}}
                }
            }
        ];
        let rows = await GIRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("Goods Issue Against GR", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @desc    create GoodsIssueAgainstGR new Record
exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const saveObj = new Model(createdObj);

        const itemDetails = await saveObj.save();
        if (itemDetails) {
            await updateInventory(itemDetails.GIDetails);
            for (let i of itemDetails.GIDetails) {
                await updateGRQtyOnGICreate(
                    req.user.sub,
                    itemDetails.GRNumber.valueOf(),
                    i.GRLineNumber,
                    i.item.valueOf(),
                    i.GIQty
                );
            }
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Goods Issue Against GR")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create GoodsIssueAgainstGR", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update GoodsIssueAgainstGR  Record
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
        await updateInventory(itemDetails.GIDetails);
        if (["Acknowledged", "Discrepancy Reported"].includes(itemDetails.GIStatus)) {
            await this.updateWIPInventory(req.user, itemDetails._id);
        }
        for (let i of itemDetails.GIDetails) {
            await updateGRQtyOnGIUpdate(
                req.user.sub,
                itemDetails.GRNumber.valueOf(),
                i.GRLineNumber,
                i.item.valueOf(),
                i.GIQty
            );
        }
        return res.success({
            message: `Goods Issue Against GR has been ${
                itemDetails.GIStatus == "Opened" ? "updated" : "Acknowledged"
            } successfully`
        });
    } catch (e) {
        console.error("update GoodsIssueAgainstGR", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById GoodsIssueAgainstGR Record
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("GoodsIssueAgainstGR")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("GoodsIssueAgainstGR");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Goods Issue Against GR", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById GoodsIssueAgainstGR Record
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id)
            .populate("GIDetails.item", "conversionOfUnits itemName itemCode itemDescription orderInfoUOM shelfLife")
            .populate("GIDetails.MRN", "MRNNumber MRNDate")
            .populate("GIDetails.GIN", "GINDate")
            .populate("GRNumber", "GRNumber")
            .lean();
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Goods Issue Against GR");
            return res.unprocessableEntity(errors);
        }
        existing.GIDetails = existing.GIDetails.map(x => {
            x.expiryStatus = expiryStatus(x?.item?.shelfLife, x?.GIN?.GINDate);
            return x;
        });
        return res.success(existing);
    } catch (e) {
        console.error("getById Goods Issue Against GR", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData GoodsIssueAgainstGR Record
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo({...GOOD_ISSUE.AUTO_INCREMENT_DATA()}, req.user.company);
        let approvedGR = await filteredGRList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    GRStatus: OPTIONS.defaultStatus.APPROVED,
                    "GRDetails.balancedQty": {$gt: 0}
                }
            },
            {
                $project: {
                    _id: 1,
                    GRNumber: 1,
                    department: 1
                }
            }
        ]);
        return res.success({autoIncrementNo, approvedGR});
    } catch (error) {
        console.error("getAllMasterData GoodsIssueAgainstGR", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getGoodRequisitionById = asyncHandler(async (req, res) => {
    try {
        const goodsRequisition = await getGRById(req.params.id);
        let inventoryRecords = await getAllInventoryCorrectionByItems(req.user.company, goodsRequisition.GRDetails);
        inventoryRecords = inventoryRecords.map(x => {
            x.expiryStatus = expiryStatus(x.item.shelfLife, x.GINDate);
            return x;
        });
        let codes = goodsRequisition.GRDetails.filter(x => {
            if (inventoryRecords.length) {
                return !inventoryRecords.map(y => y.item._id).some(ele => String(ele) == String(x.item._id));
            } else {
                return true;
            }
        });
        let itemCodes = codes.map(x => x.item.itemCode.concat("-", x.item.itemName));
        let records = JSON.parse(JSON.stringify(inventoryRecords));
        records = records.filter(ele =>
            goodsRequisition.GRDetails.some(y => {
                return String(y.item._id) == String(ele.item._id) && y.primaryUnit == ele.UOM;
            })
        );
        let rows = records
            .map(x => {
                let GRObj = goodsRequisition.GRDetails.find(
                    y => String(y.item._id) == String(x.item._id) && y.primaryUnit == x.UOM
                );
                x.GRQty = GRObj.balancedQty;
                x.GRLineNumber = GRObj.GRLineNumber;
                x.GIQty = 0;
                x.deliveryLocation = goodsRequisition.deliveryLocation;
                x.GRDate = goodsRequisition.GRDate;
                return x;
            })
            .sort(
                (a, b) => a.item.itemCode.localeCompare(b.item.itemCode)
                // && a.MRN.MRNNumber.localeCompare(b.MRN.MRNNumber)
            );
        return res.success({rows, itemCodes});
    } catch (e) {
        console.error("getAllData GoodsIssue", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getGICounts = async company => {
    try {
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GIDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    // GRStatus: {$in: ["Created"]},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    counts: {$sum: 1}
                }
            }
        ]);
        return result[0]?.counts || 0;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};
// Acknowledged
exports.getMonthlyGIStatus = async company => {
    try {
        const monthsArray = getFiscalMonthsName();
        let GIOpenedData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let GIAcknowledgementData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GIDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$GIDate", 0, 7]}},
                    countAcknowledgement: {$sum: {$cond: [{$eq: ["$GIStatus", "Acknowledged"]}, 1, 0]}},
                    countOpened: {$sum: {$cond: [{$eq: ["$GIStatus", "Opened"]}, 1, 0]}}
                }
            },
            {
                $sort: {"_id.year_month": 1}
            },
            {
                $project: {
                    _id: 0,
                    countOpened: 1,
                    countAcknowledgement: 1,
                    month_year: {
                        $concat: [
                            {
                                $arrayElemAt: [
                                    monthsArray,
                                    {
                                        $subtract: [{$toInt: {$substrCP: ["$_id.year_month", 5, 2]}}, 4]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    data: {$push: {k: "$month_year", v: {o: "$countOpened", a: "$countAcknowledgement"}}}
                }
            },
            {
                $project: {
                    data: {$arrayToObject: "$data"},
                    _id: 0
                }
            }
        ]);
        if (result.length > 0) {
            const propertyNames = Object.keys(result[0].data);
            const propertyValues = Object.values(result[0].data);
            let n = 0;
            propertyNames.forEach(elem => {
                let index = monthsArray.indexOf(elem);
                GIOpenedData[index] = propertyValues[n].o;
                GIAcknowledgementData[index] = propertyValues[n].a;
                n++;
            });

            let monthlyGIStatus = {
                Months: monthsArray,
                GIOpenedData: GIOpenedData,
                GIAcknowledgementData: GIAcknowledgementData
            };
            return monthlyGIStatus;
        } else {
            let monthlyGIStatus = {Months: monthsArray, GIAcknowledgementData: [], GIOpenedData: []};
            return monthlyGIStatus;
        }
    } catch (error) {
        console.error(error);
    }
};

exports.updateWIPInventory = asyncHandler(async (user, id) => {
    try {
        let itemCategoryArray = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            stockPreparation: true
        });
        itemCategoryArray = itemCategoryArray.map(x => x.category);
        let GIList = await Model.aggregate([
            {
                $match: {
                    _id: ObjectId(id),
                    company: ObjectId(user.company)
                }
            },
            {$unwind: "$GIDetails"},
            {
                $lookup: {
                    from: "Items",
                    localField: "GIDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                itemType: 1,
                                orderInfoUOM: 1,
                                itemCode: 1,
                                itemDescription: 1,
                                itemName: 1,
                                conversionOfUnits: 1,
                                shelfLife: 1
                            }
                        }
                    ],
                    as: "GIDetails.item"
                }
            },
            {$unwind: "$GIDetails.item"},
            {
                $match: {
                    "GIDetails.item.itemType": {$in: itemCategoryArray}
                }
            },
            {
                $lookup: {
                    from: "MRN",
                    localField: "GIDetails.MRN",
                    foreignField: "_id",
                    pipeline: [{$project: {MRNNumber: 1}}],
                    as: "GIDetails.MRN"
                }
            },
            {$unwind: "$GIDetails.MRN"},
            {
                $lookup: {
                    from: "GoodInwardEntry",
                    localField: "GIDetails.GIN",
                    foreignField: "_id",
                    pipeline: [{$project: {GINDate: 1}}],
                    as: "GIDetails.GIN"
                }
            },
            {$unwind: "$GIDetails.GIN"},
            {
                $project: {
                    _id: 0,
                    company: user.company,
                    createdBy: user.sub,
                    updatedBy: user.sub,
                    MRN: "$GIDetails.MRN._id",
                    MRNNumber: "$GIDetails.MRN.MRNNumber",
                    GIN: "$GIDetails.GIN._id",
                    GINDate: "$GIDetails.GIN.GINDate",
                    item: "$GIDetails.item._id",
                    itemCode: "$GIDetails.item.itemCode",
                    itemType: "$GIDetails.item.itemType",
                    itemName: "$GIDetails.item.itemName",
                    itemDescription: "$GIDetails.item.itemDescription",
                    shelfLife: "$GIDetails.item.shelfLife",
                    unitConversion: "$GIDetails.item.conversionOfUnits",
                    UOM: "$GIDetails.UOM",
                    PPICQty: "$GIDetails.receiptQty"
                }
            }
        ]);
        await insertWIPInventory(GIList);
    } catch (e) {
        console.error(e);
    }
});
exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const location = await getCompanyLocations(req.user.company);
        const {fromDate = null, toDate = null, deliveryLocation = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            GIStatus: {$nin: ["Opened"]},
            ...(!!deliveryLocation && {
                deliveryLocation: deliveryLocation
            }),
            ...(!!toDate &&
                !!fromDate && {
                    GIDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = getAllGoodsIssueReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "GoodsRequisition",
                    localField: "GRNumber",
                    foreignField: "_id",
                    pipeline: [{$project: {GRNumber: 1}}],
                    as: "GRNumber"
                }
            },
            {$unwind: "$GRNumber"},
            {$unwind: "$GIDetails"},
            {
                $lookup: {
                    from: "MRN",
                    localField: "GIDetails.MRN",
                    foreignField: "_id",
                    pipeline: [{$project: {MRNNumber: 1}}],
                    as: "GIDetails.MRN"
                }
            },
            {$unwind: "$GIDetails.MRN"},
            {
                $lookup: {
                    from: "Items",
                    localField: "GIDetails.item",
                    foreignField: "_id",
                    pipeline: [{$project: {itemName: 1, itemCode: 1, itemDescription: 1, shelfLife: 1}}],
                    as: "GIDetails.item"
                }
            },
            {$unwind: "$GIDetails.item"},
            {
                $lookup: {
                    from: "GoodInwardEntry",
                    localField: "GIDetails.GIN",
                    foreignField: "_id",
                    pipeline: [{$project: {GINDate: 1}}],
                    as: "GIDetails.GIN"
                }
            },
            {$unwind: "$GIDetails.GIN"}
        ];
        let output = await GIRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        output.rows = output.rows.map(x => {
            x.expiryStatus = expiryStatus(x.shelfLife, x.GINDate);
            return x;
        });
        return res.success({
            ...output,
            location: location?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            })
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.updateOnResolveDiscrepancy = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await generateCreateData(itemDetails, req.body);
        itemDetails = await itemDetails.save();
        if (itemDetails.actionBy == "Stores") {
            await updateInventoryOnResolveDiscrepancy(itemDetails.GIDetails);
        } else {
            await updateWIPInventoryOnResolveDiscrepancy(itemDetails.GIDetails);
        }
        return res.success({
            message: `Goods Issue Against GR has been ${
                itemDetails.GIStatus == "Opened" ? "updated" : "Acknowledged"
            } successfully`
        });
    } catch (e) {
        console.error("update GoodsIssueAgainstGR", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getTotalGoodsIssueAgainstGRPerDay = async company => {
    try {
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        const rows = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GIDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    matchDate: currentDate
                }
            },
            {
                $group: {
                    _id: null,
                    // count: {$sum: 1},
                    count: {$sum: {$cond: [{$eq: ["$GIStatus", "Opened"]}, 1, 0]}}
                }
            },
            {
                $project: {
                    _id: 0,
                    count: 1
                }
            }
        ]);
        return rows[0]?.count || 0;
    } catch (error) {
        console.error("error", error);
    }
};

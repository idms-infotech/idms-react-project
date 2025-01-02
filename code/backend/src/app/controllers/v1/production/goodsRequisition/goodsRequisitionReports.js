const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const mongoose = require("mongoose");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const GRRepository = require("../../../../models/production/repository/GRRepository");
const {getAllDepartments} = require("../../settings/department/department");
const ObjectId = mongoose.Types.ObjectId;

exports.getAllGRSummaryReports = asyncHandler(async (req, res) => {
    try {
        const departments = await getAllDepartments(req.user.company, {
            label: "$departmentName",
            value: "$departmentName",
            _id: 0
        });
        const {department = null, fromDate = null, toDate = null, status = null} = req.query;
        let project = {
            GRNumber: 1,
            GRDate: {$dateToString: {format: "%d-%m-%Y", date: "$GRDate"}},
            department: 1,
            itemCode: "$GRDetails.item.itemCode",
            itemName: "$GRDetails.item.itemName",
            itemDescription: "$GRDetails.item.itemDescription",
            UOM: "$GRDetails.item.orderInfoUOM",
            GRQty: "$GRDetails.GRQty",
            GRStatus: 1
        };
        let query = {
            company: ObjectId(req.user.company),
            ...(!!department && {
                department: department
            }),
            ...(!!status && {
                GRStatus: status
            }),
            ...(!!toDate &&
                !!fromDate && {
                    GRDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {
                $match: query
            },
            {
                $unwind: "$GRDetails"
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "GRDetails.item",
                    foreignField: "_id",
                    pipeline: [{$project: {itemCode: 1, itemName: 1, itemDescription: 1, orderInfoUOM: 1}}],
                    as: "GRDetails.item"
                }
            },
            {
                $unwind: "$GRDetails.item"
            }
        ];
        let rows = await GRRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            GRStatus: OPTIONS.defaultStatus.getAllGRStatusAsArray(),
            departments: departments,
            ...rows
        });
    } catch (e) {
        console.error("getAllGRSummaryReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllGRFulfillmentReports = asyncHandler(async (req, res) => {
    try {
        const {fromDate = null, toDate = null, status = null} = req.query;
        let project = {
            GRNumber: 1,
            GRDate: {$dateToString: {format: "%d-%m-%Y", date: "$GRDate"}},
            itemCode: "$GRDetails.item.itemCode",
            itemName: "$GRDetails.item.itemName",
            itemDescription: "$GRDetails.item.itemDescription",
            UOM: "$GRDetails.item.orderInfoUOM",
            GRQty: "$GRDetails.GRQty",
            GIQty: {$round: [{$abs: {$subtract: ["$GRDetails.GRQty", "$GRDetails.balancedQty"]}}, 2]},
            GIStatus: 1,
            createdAt: 1
        };
        let query = {
            company: ObjectId(req.user.company),
            ...(!!toDate &&
                !!fromDate && {
                    GRDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {
                $match: query
            },
            {
                $unwind: "$GRDetails"
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "GRDetails.item",
                    foreignField: "_id",
                    pipeline: [{$project: {itemCode: 1, itemName: 1, itemDescription: 1, orderInfoUOM: 1}}],
                    as: "GRDetails.item"
                }
            },
            {
                $unwind: "$GRDetails.item"
            },
            {
                $addFields: {
                    GIStatus: {
                        $cond: [
                            {
                                $and: [{$eq: ["$GRDetails.balancedQty", 0]}, {$ne: ["$GRDetails.GRQty", 0]}]
                            },
                            "Fulfilled",
                            {
                                $cond: [
                                    {
                                        $and: [
                                            {$eq: ["$GRDetails.balancedQty", "$GRDetails.GRQty"]},
                                            {$ne: ["$GRStatus", "Rejected"]}
                                        ]
                                    },
                                    "Awaiting Issue",
                                    {$cond: [{$eq: ["$GRStatus", "Rejected"]}, "Rejected", "Partially Fulfilled"]}
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $match: {
                    ...(!!status && {
                        GIStatus: status == "All" ? {$exists: true} : status
                    })
                }
            }
        ];
        let rows = await GRRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            statusOptions: ["All", "Awaiting Issue", "Partially Fulfilled", "Fulfilled", "Rejected"],
            ...rows
        });
    } catch (e) {
        console.error("getAllGRSummaryReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

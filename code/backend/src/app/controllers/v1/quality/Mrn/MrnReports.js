const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllSuppliers} = require("../../purchase/suppliers/suppliers");
const {default: mongoose} = require("mongoose");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const MRNHelper = require("../../../../models/quality/helpers/mrnHelper");
const MRNRepository = require("../../../../models/quality/repository/mrnRepository");
const {filteredItemList} = require("../../../../models/purchase/repository/itemRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAllMRNReports = asyncHandler(async (req, res) => {
    try {
        const suppliers = await getAllSuppliers(req.user.company, {supplierName: 1});
        const {supplier = null, status = null, toDate = null, location = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!supplier && {
                supplier: ObjectId(supplier)
            }),
            ...(!!location && {
                deliveryLocation: location
            }),
            ...(!!status && {
                MRNStatus: status == "All" ? {$exists: true} : status
            }),
            ...(!!toDate && {
                MRNDate: {
                    $lte: getEndDateTime(toDate)
                }
            })
        };
        let project = MRNHelper.getAllMRNReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "GRN",
                    localField: "GRNNumber",
                    foreignField: "_id",
                    pipeline: [{$project: {GRNNumber: 1, GRNDate: 1, _id: 1}}],
                    as: "GRNNumber"
                }
            },
            {
                $unwind: {
                    path: "$GRNNumber",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1, id: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"}
        ];
        let rows = await MRNRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            suppliers,
            statusOptions: [
                "All",
                "Partially Released",
                "Rejected",
                "Report Generated",
                "Released",
                "Closed",
                "Created"
            ],
            ...rows
        });
    } catch (e) {
        console.error("getAllMrnReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllItemWiseReports = asyncHandler(async (req, res) => {
    try {
        let itemList = await filteredItemList([
            {$match: {company: ObjectId(req.user.company), isActive: "A"}},
            {
                $project: {
                    itemName: 1
                }
            }
        ]);
        const {item = null, toDate = null, fromDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            MRNStatus: {$in: ["Report Generated", "Closed"]},
            ...(!!toDate &&
                !!fromDate && {
                    MRNDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = MRNHelper.getAllItemWiseReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "GRN",
                    localField: "GRNNumber",
                    foreignField: "_id",
                    pipeline: [{$project: {GRNNumber: 1, GRNDate: 1, _id: 1}}],
                    as: "GRNNumber"
                }
            },
            {
                $unwind: {
                    path: "$GRNNumber",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1, id: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"},
            {$unwind: "$MRNDetails"},
            {
                $lookup: {
                    from: "Items",
                    localField: "MRNDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                itemName: 1,
                                itemCode: 1,
                                itemDescription: 1
                            }
                        }
                    ],
                    as: "itemInfo"
                }
            },
            {
                $lookup: {
                    from: "ProductionItem",
                    localField: "MRNDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                itemCode: 1,
                                itemName: 1,
                                itemDescription: 1
                            }
                        }
                    ],
                    as: "childItemInfo"
                }
            },
            {
                $addFields: {
                    item: {
                        $concatArrays: ["$itemInfo", "$childItemInfo"]
                    }
                }
            },
            {
                $unwind: {
                    path: "$item",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    ...(!!item && {
                        "item._id": ObjectId(item)
                    })
                }
            }
        ];
        let rows = await MRNRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            itemList,
            ...rows
        });
    } catch (e) {
        console.error("getAllMrnReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllRawMaterialInspectionReports = asyncHandler(async (req, res) => {
    try {
        const {toDate = null, fromDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            MRNStatus: {$in: ["Report Generated", "Closed"]},
            "MRNDetails.QCLevels": "L3",
            ...(!!toDate &&
                !!fromDate && {
                    MRNDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = MRNHelper.getAllRawMaterialInspectionReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "GRN",
                    localField: "GRNNumber",
                    foreignField: "_id",
                    pipeline: [{$project: {GRNNumber: 1, GRNDate: 1, _id: 1}}],
                    as: "GRNNumber"
                }
            },
            {$unwind: "$GRNNumber"},
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1, id: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"}
        ];
        let rows = await MRNRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAllRawMaterialInspectionReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMRNDetailsReports = asyncHandler(async (req, res) => {
    try {
        const suppliersOptions = await getAllSuppliers(req.user.company, {supplierName: 1});
        const {supplier = null, toDate = null, fromDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!supplier && {
                supplier: ObjectId(supplier)
            }),
            MRNStatus: {$in: ["Report Generated", "Closed"]},
            ...(!!toDate &&
                !!fromDate && {
                    MRNDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = MRNHelper.getAllMRNDetailsReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "GRN",
                    localField: "GRNNumber",
                    foreignField: "_id",
                    pipeline: [{$project: {GRNNumber: 1, GRNDate: 1, _id: 1}}],
                    as: "GRNNumber"
                }
            },
            {$unwind: "$GRNNumber"},

            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1, id: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"},
            {$unwind: "$MRNDetails"},
            {
                $lookup: {
                    from: "Items",
                    localField: "MRNDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                itemName: 1,
                                UOM: 1,
                                GRNQty: 1
                            }
                        }
                    ],
                    as: "MRNDetails.item"
                }
            },
            {$unwind: "$MRNDetails.item"}
            // {
            //     $match: {
            //         ...(!!item && {
            //             "MRNDetails.item._id": ObjectId(item)
            //         })
            //     }
            // }
        ];
        let rows = await MRNRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            suppliersOptions,
            ...rows
        });
    } catch (e) {
        console.error("getAllMRNDetailsReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

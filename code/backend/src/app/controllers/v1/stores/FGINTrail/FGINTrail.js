const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllFGINTrailAttributes} = require("../../../../models/stores/helpers/FGINTrailHelper");
const FGINTrailRepository = require("../../../../models/stores/repository/FGINTrailRepository");
const FGINRepository = require("../../../../models/stores/repository/FGINRepository");
const {getFilterSalesInvoiceList} = require("../../../../models/dispatch/repository/salesInvoiceRepository");
const {getEndDateTime, getStartDateTime, dateToAnyFormat} = require("../../../../helpers/dateTime");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {toDate = null, fromDate = null} = req.query;
        let project = getAllFGINTrailAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ...(!!toDate &&
                        !!fromDate && {
                            createdAt: {
                                $lte: getEndDateTime(toDate),
                                $gte: getStartDateTime(fromDate)
                            }
                        })
                }
            }
        ];
        let rows = await FGINTrailRepository.getAllPaginate({
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
exports.insertFGINTrails = async () => {
    try {
        const todayDate = new Date();
        todayDate.setUTCHours(0, 0, 0, 0);
        let FGINTrailDocArray = await FGINRepository.filteredFGINList([
            {
                $match: {
                    FGINQuantity: {$gt: 0}
                }
            },
            {
                $group: {
                    _id: "$SKUId",
                    company: {$first: "$company"},
                    SKUNo: {$first: "$SKUNo"},
                    SKUName: {$first: "$SKUName"},
                    UOM: {$first: "$UOM"},
                    SKUDescription: {$first: "$SKUDescription"},
                    FGINQuantity: {$sum: "$FGINQuantity"}
                }
            },
            {
                $project: {
                    _id: 0,
                    company: 1,
                    SKUId: "$_id",
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    UOM: 1,
                    openingQty: "$FGINQuantity"
                }
            }
        ]);
        if (FGINTrailDocArray.length) {
            await FGINTrailRepository.insertManyDoc(FGINTrailDocArray);
            console.log("FGINTrails inserted SuccessFully");
        }
    } catch (e) {
        console.error("insertFGINTrails", e);
    }
};

exports.updateFGINTrails = async () => {
    try {
        const todayDate = new Date();
        todayDate.setUTCHours(0, 0, 0, 0);
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        const exists = await FGINTrailRepository.findOneDoc({
            $expr: {$eq: [currentDate, {$dateToString: {date: "$createdAt", format: "%Y-%m-%d"}}]}
        });
        if (!exists) {
            await this.insertFGINTrails();
        }
        let inwardQtyArr = await FGINRepository.filteredFGINList([
            {
                $match: {
                    producedQty: {$gt: 0},
                    FGINDate: {$gte: todayDate}
                }
            },
            {
                $group: {
                    _id: {$toString: "$SKUId"},
                    inwardQty: {$sum: "$producedQty"}
                }
            }
        ]);
        let closingQtyArr = await FGINRepository.filteredFGINList([
            {
                $match: {
                    FGINQuantity: {$gt: 0}
                }
            },
            {
                $group: {
                    _id: {$toString: "$SKUId"},
                    closingQty: {$sum: "$FGINQuantity"}
                }
            }
        ]);
        let recoQtyArr = await FGINRepository.filteredFGINList([
            {
                $match: {
                    FGINQuantity: {$gt: 0},
                    FGINDate: {$gte: todayDate}
                }
            },
            {$unwind: "$recoHistory"},
            {
                $group: {
                    _id: {$toString: "$SKUId"},
                    recoQty: {$sum: "$recoHistory.recoQtyPlusMinus"}
                }
            }
        ]);
        let invoiceQtyArr = await getFilterSalesInvoiceList([
            {
                $match: {
                    salesInvoiceDate: {$gte: todayDate}
                }
            },
            {
                $unwind: "$salesInvoiceDetails"
            },
            {
                $group: {
                    _id: "$salesInvoiceDetails.SKU",
                    invoiceQty: {$sum: "$salesInvoiceDetails.dispatchQty"}
                }
            },
            {
                $project: {
                    _id: {$toString: "$_id"},
                    invQty: "$invoiceQty"
                }
            }
        ]);
        const FGINTrail = mergeArrays([inwardQtyArr, closingQtyArr, recoQtyArr, invoiceQtyArr], "_id");
        let bulkUpdateOperations = [];
        for (const trail of FGINTrail) {
            let updateOperation = {
                updateOne: {
                    filter: {
                        SKUId: trail._id,
                        $expr: {$eq: [currentDate, {$dateToString: {date: "$createdAt", format: "%Y-%m-%d"}}]}
                    },
                    update: {
                        $set: {
                            inwardQty: trail?.inwardQty ?? 0,
                            invQty: trail?.invQty ?? 0,
                            invReturnedQty: trail?.invReturnedQty ?? 0,
                            recoQty: trail?.recoQty ?? 0,
                            closingQty: trail?.closingQty ?? 0
                        }
                    },
                    upsert: true
                }
            };
            bulkUpdateOperations.push(updateOperation);
        }
        await FGINTrailRepository.bulkWriteDoc(bulkUpdateOperations);
        console.log("FGINTrails updated SuccessFully");
    } catch (e) {
        console.error("updateFGINTrails", e);
    }
};
const mergeArrays = (arrays, key) => {
    const map = new Map();

    for (const obj of arrays.flat()) {
        if (!map.has(obj[key])) {
            map.set(obj[key], {...obj});
        } else {
            map.set(obj[key], {...map.get(obj[key]), ...obj});
        }
    }

    return Array.from(map.values());
};

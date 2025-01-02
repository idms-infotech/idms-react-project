const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {default: mongoose} = require("mongoose");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {getCompanyLocations} = require("../../settings/company/company");
const GoodInwardEntryHelper = require("../../../../models/stores/helpers/goodInwardEntryHelper");
const GINRepository = require("../../../../models/stores/repository/goodInwardEntryRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const location = await getCompanyLocations(req.user.company);
        const {fromDate = null, toDate = null, deliveryLocation = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!deliveryLocation && {
                deliveryLocation: deliveryLocation
            }),
            ...(!!toDate &&
                !!fromDate && {
                    GINDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = GoodInwardEntryHelper.getAllGoodInwardEntryReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "MRN",
                    localField: "MRNNumber",
                    foreignField: "_id",
                    pipeline: [{$project: {MRNNumber: 1, MRNDate: 1}}],
                    as: "MRNInfo"
                }
            },
            {
                $unwind: {
                    path: "$MRNInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {$unwind: "$GINDetails"},
            {
                $lookup: {
                    from: "Items",
                    localField: "GINDetails.item",
                    foreignField: "_id",
                    pipeline: [{$project: {itemName: 1, itemCode: 1, itemDescription: 1}}],
                    as: "itemInfo"
                }
            },
            {
                $lookup: {
                    from: "ProductionItem",
                    localField: "GINDetails.item",
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
                    as: "childItem"
                }
            },
            {
                $addFields: {
                    item: {
                        $concatArrays: ["$itemInfo", "$childItem"]
                    }
                }
            },
            {
                $unwind: "$item"
            }
        ];
        let rows = await GINRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            location: location?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            }),
            ...rows
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

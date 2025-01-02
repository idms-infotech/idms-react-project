const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/settings/auditModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {default: mongoose} = require("mongoose");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {getAllAuditAttributes} = require("../../../../models/settings/helpers/auditHelper");
const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");
const AuditRepository = require("../../../../models/settings/repository/auditRepository");
const AppParameter = require("../appParameter/appParameter");
const ObjectId = mongoose.Types.ObjectId;
exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {userId = null, fromDate = null, toDate = null} = req.query;
        let project = getAllAuditAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ...(!!userId && {
                        user: ObjectId(userId)
                    }),
                    ...(!!toDate &&
                        !!fromDate && {
                            createdAt: {
                                $lte: getEndDateTime(toDate),
                                $gte: getStartDateTime(fromDate)
                            }
                        })
                }
            },
            {
                $lookup: {
                    from: "User",
                    localField: "user",
                    foreignField: "_id",
                    pipeline: [{$project: {name: 1}}],
                    as: "user"
                }
            },
            {$unwind: "$user"}
        ];
        let rows = await AuditRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id).populate("user", "name");
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Audit");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});

exports.auditModule = async auditData => {
    const auditFlagValue = await AppParameter.findAppParameterValue("AUDIT_FLAG", auditData.company);
    if (auditFlagValue == "yes") {
        await AuditRepository.createDoc(auditData);
    }
};

exports.getAllApiStack = asyncHandler(async (req, res) => {
    try {
        let apiStackObj = memoryCacheHandler?.cache?.requestCount?.value;
        let apiArray = [];
        let totalCount = 0;
        if (apiStackObj) {
            apiArray = Object.entries(apiStackObj)
                .map(([endpoint, count]) => ({endpoint, count}))
                .sort((a, b) => b.count - a.count);
            for (const api of apiArray) {
                totalCount += api.count;
            }
        }
        return res.success({apiArray, totalCount});
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});

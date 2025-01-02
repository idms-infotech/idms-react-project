const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const ProcessListConfigRepository = require("../../../../models/settings/repository/processListConfigRepository");
const {PROCESS, IPQA} = require("../../../../mocks/constantData");


exports.getAll = asyncHandler(async (req, res) => {
    try {
        let rows = await ProcessListConfigRepository.filteredProcessListConfigList([
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            },
            {
                $project: {
                    _id: 1,
                    processDetails: 1,
                    revisionInfo: 1
                }
            },
            {
                $facet: {
                    latestDoc: [
                        {
                            $sort: {
                                _id: -1
                            }
                        },
                        {
                            $limit: 1
                        }
                    ],
                    revisions: [
                        {
                            $sort: {
                                _id: 1
                            }
                        },
                        {
                            $limit: 1
                        }
                    ]
                }
            }
        ]);
        return res.success({
            rows: rows.length ? rows[0]?.latestDoc[0] ?? {} : {},
            revision: rows[0]?.revisions ?? []
        });
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.createOrUpdate = asyncHandler(async (req, res) => {
    try {
        let docObj = {};
        if (req.body._id) {
            docObj = await ProcessListConfigRepository.getDocById(req.body._id);
            docObj.updatedBy = req.user.sub;
            docObj = await ProcessListConfigRepository.updateDoc(docObj, req.body);
        } else {
            let docObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            await ProcessListConfigRepository.createDoc(docObj);
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED(`Process list Config`)
        });
    } catch (e) {
        console.error(`Process list Config`, e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.bulkUpdate = asyncHandler(async (req, res) => {
    try {
        for await (const ele of req.body) {
            let existing = await ProcessListConfigRepository.getDocById(ele._id);
            existing.updatedBy = req.user.sub;
            existing.processDetails = existing.processDetails.map(x => {
                if (ele.processName == x.processName) {
                    x.processOriginalName = ele?.processOriginalName;
                    x.qualityOriginalName = ele?.qualityOriginalName;
                }
                return x;
            });
            await existing.save();
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE(`Process list Config`)
        });
    } catch (e) {
        console.error(`Process list Config`, e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMapProcessNames = asyncHandler(async (req, res) => {
    try {
        let project = {
            _id: 1,
            processName: "$processDetails.processName",
            processOriginalName: "$processDetails.processOriginalName",
            qualityOriginalName: "$processDetails.qualityOriginalName"
        };
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            },
            {
                $sort: {
                    _id: -1
                }
            },
            {
                $limit: 1
            },
            {
                $unwind: "$processDetails"
            },
            {
                $sort: {SN: 1}
            }
        ];
        let rows = await ProcessListConfigRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success({
            ...rows,
            processOptions: PROCESS,
            IPQAOptions: IPQA
        });
    } catch (error) {
        console.error("getAllMapProcessNames Process list Config", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

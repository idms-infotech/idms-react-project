const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const MaterialFlowZoneRepository = require("../../../../models/settings/repository/materialFlowZoneRepository");
const {getAllModuleMaster} = require("../module-master/module-master");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const MFZCategoryOptions = await getAllModuleMaster(req.user.company, "MFZ_CATEGORY");
        let rows = await MaterialFlowZoneRepository.filteredMaterialFlowZoneList([
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
            revision: rows[0]?.revisions ?? [],
            MFZCategoryOptions
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
            docObj = await MaterialFlowZoneRepository.getDocById(req.body._id);
            docObj.updatedBy = req.user.sub;
            docObj = await MaterialFlowZoneRepository.updateDoc(docObj, req.body);
        } else {
            let docObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            await MaterialFlowZoneRepository.createDoc(docObj);
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.ADDED(`Material Flow Zone`)
        });
    } catch (e) {
        console.error(`Material Flow Zone`, e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.bulkUpdate = asyncHandler(async (req, res) => {
    try {
        for await (const ele of req.body) {
            let existing = await MaterialFlowZoneRepository.getDocById(ele._id);
            existing.processDetails = existing.processDetails.map(x => {
                if (ele.materialFlowZone == x.materialFlowZone) {
                    x.SN = ele?.SN;
                    x.MFZCategory = ele?.MFZCategory;
                }
                return x;
            });
            await existing.save();
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE(`Material Flow Zone`)
        });
    } catch (e) {
        console.error(`Material Flow Zone`, e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

const {ObjectId} = require("../../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../../helpers/messages.options");
const GenericIPQARepository = require("../../../../../models/production/repository/prodHouseRepo/genericIPQARepository");
const {filteredSKUProcessFlowList} = require("../../../../../models/businessLeads/repository/SKUProcessFlowRepository");
const {OPTIONS} = require("../../../../../helpers/global.options");
const {getAllModuleMaster} = require("../../../settings/module-master/module-master");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = {company: 0};
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await GenericIPQARepository.getAllPaginate({
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

exports.createOrUpdate = asyncHandler(async (req, res) => {
    try {
        let logExists = await GenericIPQARepository.findOneDoc({
            SKUProcessFlow: req.body.SKUProcessFlow,
            jobCard: req.body.jobCard,
            SKU: req.body.SKU
        });
        if (logExists) {
            logExists.updatedBy = req.user.sub;
            logExists = await GenericIPQARepository.updateDoc(logExists, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            await GenericIPQARepository.createDoc(createdObj);
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("IPQA")
        });
    } catch (e) {
        console.error("create IPQA", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let data = await GenericIPQARepository.findOneDoc({
            SKUProcessFlow: ObjectId(req.query.SKUProcessFlow),
            jobCard: ObjectId(req.query.jobCard),
            SKU: ObjectId(req.query.SKU),
            processType: req.query.processOriginalName
        });
        if (!data) {
            data = {
                IPQALog: {
                    prodSource: null,
                    cumulativeCount: 0,
                    remarks: null,
                    qualityReleasedBy: null,
                    logEntryDetails: [
                        {
                            inspectionDate: new Date(),
                            shift: null,
                            inspectionStaff: null,
                            releaseQty: null
                        }
                    ]
                }
            };
        }
        const SKUProcessData = await filteredSKUProcessFlowList([
            {
                $match: {
                    SKU: ObjectId(req.query.SKU)
                }
            },
            {
                $unwind: "$PFDetails"
            },
            {
                $lookup: {
                    from: "ProcessMaster",
                    localField: "PFDetails.process",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $match: {
                                status: OPTIONS.defaultStatus.ACTIVE,
                                processOriginalName: req.query.processName
                            }
                        },
                        {$project: {sourceOfManufacturing: 1}}
                    ],
                    as: "processMaster"
                }
            },
            {$unwind: "$processMaster"},
            {
                $project: {
                    sourceOfManufacturing: "$processMaster.sourceOfManufacturing"
                }
            }
        ]);
        const shiftOptions = await getAllModuleMaster(req.user.company, "PRODUCTION_SHIFT");
        return res.success({
            genericIPQA: data,
            SKUProcessData: SKUProcessData.length ? SKUProcessData[0] : {},
            shiftOptions
        });
    } catch (error) {
        console.error("getAllMasterData IPQA", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

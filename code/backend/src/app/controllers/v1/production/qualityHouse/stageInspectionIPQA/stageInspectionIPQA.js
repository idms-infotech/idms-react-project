const {ObjectId} = require("../../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../../helpers/messages.options");
const {
    getAllStageInspectionIPQAAttributes
} = require("../../../../../models/production/helpers/stageInspectionIPQAHelper");
const StageInspectionIPQARepository = require("../../../../../models/production/repository/prodHouseRepo/stageInspectionIPQARepository");
const {filteredSKUProcessFlowList} = require("../../../../../models/businessLeads/repository/SKUProcessFlowRepository");
const {OPTIONS} = require("../../../../../helpers/global.options");
const {getAllModuleMaster} = require("../../../settings/module-master/module-master");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllStageInspectionIPQAAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await StageInspectionIPQARepository.getAllPaginate({
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
        let logExists = await StageInspectionIPQARepository.findOneDoc({
            SKUProcessFlow: req.body.SKUProcessFlow,
            jobCard: req.body.jobCard,
            SKU: req.body.SKU
        });
        if (logExists) {
            logExists.updatedBy = req.user.sub;
            logExists = await StageInspectionIPQARepository.updateDoc(logExists, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            await StageInspectionIPQARepository.createDoc(createdObj);
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Stage Inspection Log")
        });
    } catch (e) {
        console.error("create Stage Inspection Log", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let data = await StageInspectionIPQARepository.findOneDoc({
            jobCard: ObjectId(req.query.jobCard),
            SKU: ObjectId(req.query.SKU),
            SKUProcessFlow: ObjectId(req.query.SKUProcessFlow)
        });
        if (!data) {
            data = {
                stageInspectionIPQAInfo: [
                    {
                        date: new Date(),
                        shift: null,
                        UOM: null,
                        okQty: null,
                        inspectedBy: null
                    }
                ],
                totalOkQty: 0,
                remarks: null,
                batchReleaseStatus: null,
                processInCharge: null
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
            stageInspectionIPQA: data,
            shiftOptions,
            SKUProcessData: SKUProcessData.length ? SKUProcessData[0] : {}
        });
    } catch (error) {
        console.error("getAllMasterData Stage Inspection Log", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

const {ObjectId} = require("../../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../../helpers/messages.options");
const {
    getAllScreenPrintingLogIPQAAttributes
} = require("../../../../../models/production/helpers/screenPrintingLogIPQAHelper");
const ScreenPrintingLogIPQARepository = require("../../../../../models/production/repository/prodHouseRepo/screenPrintingLogIPQARepository");
const {filteredSKUProcessFlowList} = require("../../../../../models/businessLeads/repository/SKUProcessFlowRepository");
const {OPTIONS} = require("../../../../../helpers/global.options");
const {getAllModuleMaster} = require("../../../settings/module-master/module-master");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllScreenPrintingLogIPQAAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await ScreenPrintingLogIPQARepository.getAllPaginate({
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
        let logExists = await ScreenPrintingLogIPQARepository.findOneDoc({
            SKUProcessFlow: req.body.SKUProcessFlow,
            jobCard: req.body.jobCard,
            SKU: req.body.SKU
        });
        if (logExists) {
            logExists.updatedBy = req.user.sub;
            logExists = await ScreenPrintingLogIPQARepository.updateDoc(logExists, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            await ScreenPrintingLogIPQARepository.createDoc(createdObj);
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Screen Printing Log IPQA")
        });
    } catch (e) {
        console.error("create Screen Printing Log IPQA", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let data = await ScreenPrintingLogIPQARepository.findOneDoc({
            jobCard: ObjectId(req.query.jobCard),
            SKU: ObjectId(req.query.SKU),
            SKUProcessFlow: ObjectId(req.query.SKUProcessFlow)
        });
        if (!data) {
            data = {
                IPQCLogInfo: [
                    {
                        inspectionType: null,
                        inspectionParameter: null,
                        observation: null,
                        inspectedBy: null,
                        status: null
                    }
                ],
                remarks: null
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
        const inspectionTypeOptions = await getAllModuleMaster(req.user.company, "INSPECTION_TYPE");
        const inspectionParameterOptions = await getAllModuleMaster(req.user.company, "INSPECTION_PARAMETER");
        const statusOptions = await getAllModuleMaster(req.user.company, "STATUS");
        return res.success({
            inspectionTypeOptions,
            inspectionParameterOptions,
            statusOptions,
            screenPrintingLogIPQC: data,
            SKUProcessData: SKUProcessData.length ? SKUProcessData[0] : {}
        });
    } catch (error) {
        console.error("getAllMasterData Screen Printing Log IPQA", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

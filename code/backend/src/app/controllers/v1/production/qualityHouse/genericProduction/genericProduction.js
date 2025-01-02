const {ObjectId} = require("../../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../../helpers/messages.options");
const GenericProdRepository = require("../../../../../models/production/repository/prodHouseRepo/genericProductionRepository");
const {filteredSKUProcessFlowList} = require("../../../../../models/businessLeads/repository/SKUProcessFlowRepository");
const {OPTIONS} = require("../../../../../helpers/global.options");
const {getAllModuleMaster} = require("../../../settings/module-master/module-master");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = {company: 0};
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await GenericProdRepository.getAllPaginate({
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
        let logExists = await GenericProdRepository.findOneDoc({
            jobCard: req.body.jobCard,
            SKU: req.body.SKU,
            SKUProcessFlow: req.body.SKUProcessFlow
        });
        if (logExists) {
            logExists.updatedBy = req.user.sub;
            logExists = await GenericProdRepository.updateDoc(logExists, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            await GenericProdRepository.createDoc(createdObj);
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Production")
        });
    } catch (e) {
        console.error("create Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let data = await GenericProdRepository.findOneDoc({
            SKUProcessFlow: ObjectId(req.query.SKUProcessFlow),
            jobCard: ObjectId(req.query.jobCard),
            SKU: ObjectId(req.query.SKU),
            processType: req.query.processOriginalName
        });
        if (!data) {
            data = {
                prodLog: {
                    prodSource: null,
                    cumulativeCount: 0,
                    remarks: null,
                    prodAuthorizedBy: null,
                    logEntryDetails: [
                        {
                            prodDate: new Date(),
                            prodShift: null,
                            operatingStaff: null,
                            prodQty: null
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
            genericProduction: data,
            SKUProcessData: SKUProcessData.length ? SKUProcessData[0] : {},
            shiftOptions
        });
    } catch (error) {
        console.error("getAllMasterData Production", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

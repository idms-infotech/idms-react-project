const {ObjectId} = require("../../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../../helpers/messages.options");
const {getAllPackingIPQAAttributes} = require("../../../../../models/production/helpers/packingIPQAHelper");
const PackingIPQARepository = require("../../../../../models/production/repository/prodHouseRepo/packingIPQARepository");
const {filteredSKUProcessFlowList} = require("../../../../../models/businessLeads/repository/SKUProcessFlowRepository");
const {OPTIONS} = require("../../../../../helpers/global.options");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllPackingIPQAAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await PackingIPQARepository.getAllPaginate({
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
        let logExists = await PackingIPQARepository.findOneDoc({
            SKUProcessFlow: req.body.SKUProcessFlow,
            jobCard: req.body.jobCard,
            SKU: req.body.SKU
        });
        if (logExists) {
            logExists.updatedBy = req.user.sub;
            logExists = await PackingIPQARepository.updateDoc(logExists, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            await PackingIPQARepository.createDoc(createdObj);
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Packing IPQA")
        });
    } catch (e) {
        console.error("create Packing IPQA", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let data = await PackingIPQARepository.findOneDoc({
            SKUProcessFlow: ObjectId(req.query.SKUProcessFlow),
            jobCard: ObjectId(req.query.jobCard),
            SKU: ObjectId(req.query.SKU)
        });
        if (!data) {
            data = {
                IPQALog: {
                    adherenceToProcessStd: false,
                    inProcessInfo: [
                        {
                            date: new Date(),
                            inProcessNonConformance: null,
                            inProcessCorrection: null
                        }
                    ],
                    remarks: null,
                    IPQAInCharge: null
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
        return res.success({
            packingIPQA: data,
            SKUProcessData: SKUProcessData.length ? SKUProcessData[0] : {}
        });
    } catch (error) {
        console.error("getAllMasterData Packing IPQA", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

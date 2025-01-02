const {ObjectId} = require("../../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../../helpers/messages.options");
const {getAllScreenPrintingLogAttributes} = require("../../../../../models/production/helpers/screenPrintingLogHelper");
const ScreenPrintingLogRepository = require("../../../../../models/production/repository/prodHouseRepo/screenPrintingLogRepository");
const {filteredSKUMasterList} = require("../../../../../models/sales/repository/SKUMasterRepository");
const {getAllModuleMaster} = require("../../../settings/module-master/module-master");
const {filteredSKUProcessFlowList} = require("../../../../../models/businessLeads/repository/SKUProcessFlowRepository");
const {OPTIONS} = require("../../../../../helpers/global.options");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllScreenPrintingLogAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await ScreenPrintingLogRepository.getAllPaginate({
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
        let logExists = await ScreenPrintingLogRepository.findOneDoc({
            SKUProcessFlow: req.body.SKUProcessFlow,
            jobCard: req.body.jobCard,
            SKU: req.body.SKU
        });
        if (logExists) {
            logExists.updatedBy = req.user.sub;
            logExists = await ScreenPrintingLogRepository.updateDoc(logExists, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            delete createdObj._id;
            await ScreenPrintingLogRepository.createDoc(createdObj);
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Screen Printing Log")
        });
    } catch (e) {
        console.error("create Screen Printing Log", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let inkList = {};
        inkList = await ScreenPrintingLogRepository.findOneDoc({
            jobCard: ObjectId(req.query.jobCard),
            SKU: ObjectId(req.query.SKU),
            SKUProcessFlow: ObjectId(req.query.SKUProcessFlow)
        });
        if (!inkList) {
            rows = await filteredSKUMasterList([
                {
                    $match: {
                        _id: ObjectId(req.query.SKU)
                    }
                },
                {
                    $sort: {SKUNo: 1}
                },
                {
                    $project: {
                        jobCard: req.query.jobCard,
                        jobCardNo: req.query.jobCardNo,
                        SKU: "$_id",
                        SKUNo: 1,
                        SKUName: 1,
                        SKUDescription: 1,
                        screenPrintingLogDetails: {
                            $map: {
                                input: "$inkDetails",
                                as: "details",
                                in: {
                                    SN: "$$details.colSeq",
                                    ink: "$$details.inkId",
                                    colourCode: "$$details.itemCode",
                                    colourName: "$$details.itemName",
                                    colourDescription: "$$details.itemDescription",
                                    mesh: "$$details.mesh",
                                    machine: null,
                                    ptgPass: {$literal: 0},
                                    SQGPerSH: {$literal: 0},
                                    deltaE: {$literal: 0},
                                    logDetails: {
                                        prodSource: {$literal: null},
                                        prodDate: {$literal: null},
                                        prodShift: {$literal: null},
                                        operatingStaff: {$literal: null},
                                        remarks: {$literal: null},
                                        authorizedBy: {$literal: null}
                                    },
                                    status: {$literal: false}
                                }
                            }
                        }
                    }
                }
            ]);
            inkList = rows.length ? rows[0] : {};
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
            screenPrintingLog: inkList,
            shiftOptions,
            SKUProcessData: SKUProcessData.length ? SKUProcessData[0] : {}
        });
    } catch (error) {
        console.error("getAllMasterData Screen Printing Log", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

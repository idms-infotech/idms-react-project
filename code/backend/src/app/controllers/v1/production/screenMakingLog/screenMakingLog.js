const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const ScreenMakingLogRepository = require("../../../../models/production/repository/prodHouseRepo/screenMakingLogRepository");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllScreenMakingLogAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await ScreenMakingLogRepository.getAllPaginate({
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
        let logExists = await ScreenMakingLogRepository.findOneDoc({
            SKUProcessFlow: req.body.SKUProcessFlow,
            jobCard: req.body.jobCard,
            SKU: req.body.SKU
        });
        if (logExists) {
            logExists.updatedBy = req.user.sub;
            logExists = await ScreenMakingLogRepository.updateDoc(logExists, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            await ScreenMakingLogRepository.createDoc(createdObj);
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Screen Making Log")
        });
    } catch (e) {
        console.error("create Screen Making Log", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let inkList = {};
        inkList = await ScreenMakingLogRepository.findOneDoc({
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
                        screenMakingLogDetails: {
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
                                    tension: {$literal: 0},
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
        const shiftOptions = await getAllModuleMaster(req.user.company, "PRODUCTION_SHIFT");
        return res.success({screenMakingLog: inkList, shiftOptions});
    } catch (error) {
        console.error("getAllMasterData Screen Making Log", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

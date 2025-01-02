const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const GenericBatchProdRepository = require("../../../../models/production/repository/genericBatchProductionRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = {company: 0};
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await GenericBatchProdRepository.getAllPaginate({
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
        let logExists = await GenericBatchProdRepository.findOneDoc({
            batchCard: req.body.batchCard,
            item: req.body.item,
            processUnitId: req.body.processUnitId
        });
        if (logExists) {
            logExists.updatedBy = req.user.sub;
            logExists = await GenericBatchProdRepository.updateDoc(logExists, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            await GenericBatchProdRepository.createDoc(createdObj);
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
        let data = await GenericBatchProdRepository.findOneDoc({
            batchCardNo: req.query.batchCardNo,
            batchCard: ObjectId(req.query.batchCard),
            item: ObjectId(req.query.item),
            processUnitId: ObjectId(req.query.processUnitId)
        });
        if (!data) {
            data = {
                prodLog: {
                    prodSource: null,
                    totalProdQty: 0,
                    remarks: null,
                    prodAuthorizedBy: null,
                    logEntryDetails: [
                        {
                            prodDate: new Date(),
                            prodShift: null,
                            shiftInCharge: null,
                            UOM: null,
                            prodQty: null
                        }
                    ]
                }
            };
        }
        const shiftOptions = await getAllModuleMaster(req.user.company, "PRODUCTION_SHIFT");
        return res.success({
            genericProduction: data,
            shiftOptions
        });
    } catch (error) {
        console.error("getAllMasterData Production", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

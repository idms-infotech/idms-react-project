const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const GenericBatchIPQARepository = require("../../../../models/production/repository/genericBatchIPQARepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = {company: 0};
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await GenericBatchIPQARepository.getAllPaginate({
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
        let logExists = await GenericBatchIPQARepository.findOneDoc({
            batchCard: req.body.batchCard,
            item: req.body.item,
            processUnitId: req.body.processUnitId
        });
        if (logExists) {
            logExists.updatedBy = req.user.sub;
            logExists = await GenericBatchIPQARepository.updateDoc(logExists, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            logExists = await GenericBatchIPQARepository.createDoc(createdObj);
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("IPQA"),
            releaseQty: logExists?.IPQALog?.totalProdQty ?? null
        });
    } catch (e) {
        console.error("create IPQA", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let data = await GenericBatchIPQARepository.findOneDoc({
            batchCardNo: req.query.batchCardNo,
            batchCard: ObjectId(req.query.batchCard),
            item: ObjectId(req.query.item),
            processUnitId: ObjectId(req.query.processUnitId)
        });
        if (!data) {
            data = {
                IPQALog: {
                    prodSource: null,
                    totalProdQty: 0,
                    remarks: null,
                    qualityReleasedBy: null,
                    logEntryDetails: [
                        {
                            inspectionDate: new Date(),
                            shift: null,
                            checkedBy: null,
                            UOM: null,
                            releaseQty: null
                        }
                    ]
                }
            };
        }
        const shiftOptions = await getAllModuleMaster(req.user.company, "PRODUCTION_SHIFT");
        return res.success({
            genericIPQA: data,
            shiftOptions
        });
    } catch (error) {
        console.error("getAllMasterData IPQA", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

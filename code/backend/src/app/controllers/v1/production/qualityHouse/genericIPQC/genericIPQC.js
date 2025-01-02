const {ObjectId} = require("../../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../../helpers/messages.options");
const GenericIPQCRepository = require("../../../../../models/production/repository/prodHouseRepo/genericIPQCRepository");
const {filteredSKUProcessFlowList} = require("../../../../../models/businessLeads/repository/SKUProcessFlowRepository");
const {OPTIONS} = require("../../../../../helpers/global.options");
const {getAllModuleMaster} = require("../../../settings/module-master/module-master");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = {company: 0};
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await GenericIPQCRepository.getAllPaginate({
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
        let logExists = await GenericIPQCRepository.findOneDoc({
            SKUProcessFlow: req.body.SKUProcessFlow,
            jobCard: req.body.jobCard,
            SKU: req.body.SKU
        });
        if (logExists) {
            logExists.updatedBy = req.user.sub;
            logExists = await GenericIPQCRepository.updateDoc(logExists, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            await GenericIPQCRepository.createDoc(createdObj);
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("IPQC")
        });
    } catch (e) {
        console.error("create IPQC", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let data = await GenericIPQCRepository.findOneDoc({
            SKUProcessFlow: ObjectId(req.query.SKUProcessFlow),
            jobCard: ObjectId(req.query.jobCard),
            SKU: ObjectId(req.query.SKU),
            processType: req.query.processOriginalName
        });
        if (!data) {
            data = {
                remarks: null,
                IPQCLog: [
                    {
                        inspectionType: null,
                        inspectionParameter: null,
                        observation: null,
                        inspectedBy: null,
                        status: null
                    }
                ]
            };
        }
        const inspectionTypeOptions = await getAllModuleMaster(req.user.company, "INSPECTION_TYPE");
        const inspectionParameterOptions = await getAllModuleMaster(req.user.company, "INSPECTION_PARAMETER");
        const statusOptions = await getAllModuleMaster(req.user.company, "STATUS");
        return res.success({
            genericIPQC: data,
            inspectionTypeOptions,
            inspectionParameterOptions,
            statusOptions
        });
    } catch (error) {
        console.error("getAllMasterData IPQC", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

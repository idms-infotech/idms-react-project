const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllProdProcessConfigAttributes} = require("../../../../models/planning/helpers/prodProcessConfigHelper");
const ProdProcessConfigRepository = require("../../../../models/planning/repository/prodProcessConfigRepository");
const {PROCESS, IPQA} = require("../../../../mocks/constantData");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllProdProcessConfigAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), prodUnitConfigId: ObjectId(req.query.processId)}},
            {
                $addFields: {
                    revisionNo: {$toString: "$revisionInfo.revisionNo"}
                }
            }
        ];
        let rows = await ProdProcessConfigRepository.getAllPaginate({
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

exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await ProdProcessConfigRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Process")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Process", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ProdProcessConfigRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await ProdProcessConfigRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Process has been")
        });
    } catch (e) {
        console.error("update Process", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await ProdProcessConfigRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Process")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Process");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Process", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await ProdProcessConfigRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Process");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Process", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        return res.success({});
    } catch (error) {
        console.error("getAllMasterData Process", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.bulkUpdate = asyncHandler(async (req, res) => {
    try {
        for await (const ele of req.body) {
            await ProdProcessConfigRepository.findAndUpdateDoc(
                {
                    _id: ele?._id
                },
                {
                    srNo: ele?.srNo
                }
            );
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Process has been")
        });
    } catch (e) {
        console.error("update Process", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllForMapProcess = asyncHandler(async (req, res) => {
    try {
        let project = {
            _id: 1,
            processOriginalName: {$ifNull: ["$processOriginalName", null]},
            qualityOriginalName: {$ifNull: ["$qualityOriginalName", null]},
            prodProcessName: 1
        };
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), prodUnitConfigId: ObjectId(req.query.prodUnitConfigId)}}
        ];
        let rows = await ProdProcessConfigRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            ...rows,
            processOptions: PROCESS.filter(x =>
                ["Generic Production Process", "MTO Ink Mixing Log", "MTO Quality Log", "MTO Stock Log"].includes(
                    x.value
                )
            ),
            IPQAOptions: IPQA.filter(x => ["Generic IPQA Process"].includes(x.value))
        });
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.bulkUpdateProcess = asyncHandler(async (req, res) => {
    try {
        for await (const ele of req.body) {
            let existing = await ProdProcessConfigRepository.getDocById(ele._id);
            existing.updatedBy = req.user.sub;
            if (ele.processName == existing.processName) {
                existing.processOriginalName = ele?.processOriginalName;
                existing.qualityOriginalName = ele?.qualityOriginalName;
            }
            await existing.save();
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE(`Process`)
        });
    } catch (e) {
        console.error(`Process`, e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

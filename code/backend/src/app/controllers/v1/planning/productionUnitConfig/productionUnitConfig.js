const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllProductionUnitConfigAttributes
} = require("../../../../models/planning/helpers/productionUnitConfigHelper");
const ProductionUnitConfigRepository = require("../../../../models/planning/repository/productionUnitConfigRepository");
const {OPTIONS} = require("../../../../helpers/global.options");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllProductionUnitConfigAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $addFields: {
                    revisionNo: {$toString: "$revisionInfo.revisionNo"}
                }
            }
        ];
        let rows = await ProductionUnitConfigRepository.getAllPaginate({
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
        const itemDetails = await ProductionUnitConfigRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Production Unit Config")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Production Unit Config", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ProductionUnitConfigRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await ProductionUnitConfigRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Production Unit Config has been")
        });
    } catch (e) {
        console.error("update Production Unit Config", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await ProductionUnitConfigRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Production Unit Config")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Production Unit Config");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Production Unit Config", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await ProductionUnitConfigRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Production Unit Config");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Production Unit Config", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.bulkUpdate = asyncHandler(async (req, res) => {
    try {
        for await (const ele of req.body) {
            await ProductionUnitConfigRepository.findAndUpdateDoc(
                {
                    _id: ele?._id
                },
                {
                    srNo: ele?.srNo
                }
            );
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Production Unit Config has been")
        });
    } catch (e) {
        console.error("update Production Unit Config", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllProdUnit = asyncHandler(async (req, res) => {
    try {
        let rows = await ProductionUnitConfigRepository.filteredProductionUnitConfigList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $sort: {srNo: 1}
            },
            {
                $project: {
                    _id: 1,
                    prodUnitCode: 1,
                    prodUnitName: 1,
                    SKUFlag: 1,
                    formulationFlag: 1,
                    materialFlag: 1,
                    label: {$concat: ["$prodUnitName", " ", "(", "$prodUnitCode", ")"]}
                }
            }
        ]);
        return res.success(rows);
    } catch (e) {
        console.error("getAllProdUnit", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

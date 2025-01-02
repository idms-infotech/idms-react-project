const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/purchase/serviceMasterModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllServiceMasterAttributes} = require("../../../../models/purchase/helpers/serviceMasterHelper");
const {default: mongoose} = require("mongoose");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {PURCHASE_SERVICE_MASTER} = require("../../../../mocks/schemasConstant/purchaseConstant");
const {filteredSACMasterList} = require("../../../../models/purchase/repository/sacRepository");
const ServiceMasterRepository = require("../../../../models/purchase/repository/serviceMasterRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllServiceMasterAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $addFields: {
                    igst: {$toString: "$igst"},
                    sgst: {$toString: "$sgst"},
                    cgst: {$toString: "$cgst"}
                }
            },
            {
                $lookup: {
                    from: "SAC",
                    localField: "sacId",
                    foreignField: "_id",
                    as: "sacId"
                }
            },
            {$unwind: "$sacId"}
        ];
        let rows = await ServiceMasterRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAllServiceMaster", e);
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
        const itemDetails = await ServiceMasterRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("ServiceMaster")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create ServiceMaster", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ServiceMasterRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await ServiceMasterRepository.updateDoc(itemDetails, req.body);

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Service Master has been")
        });
    } catch (e) {
        console.error("update ServiceMaster", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await ServiceMasterRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Service Master")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Service Master");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Service Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id).populate("sacId");
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Service Master");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Service Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            PURCHASE_SERVICE_MASTER.AUTO_INCREMENT_DATA(),
            req.user.company
        );
        const SACs = await filteredSACMasterList([
            {$match: {company: ObjectId(req.user.company), isActive: "Y"}},
            {$sort: {sacMasterEntryNo: -1}},
            {
                $project: {
                    _id: 1,
                    sacCode: 1,
                    gstRate: 1,
                    igstRate: 1,
                    sgstRate: 1,
                    cgstRate: 1
                }
            }
        ]);
        return res.success({autoIncrementNo, SACs});
    } catch (error) {
        console.error("getAllMasterData Service Master", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

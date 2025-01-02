const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllMouldMasterAttributes} = require("../../../../models/settings/helpers/mouldMasterHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {MOULD_MASTER} = require("../../../../mocks/schemasConstant/settingsConstant");
const MouldMasterRepository = require("../../../../models/settings/repository/mouldMasterRepository");
const {filteredSupplierList} = require("../../../../models/purchase/repository/supplierRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllMouldMasterAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await MouldMasterRepository.getAllPaginate({
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
        const itemDetails = await MouldMasterRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Mould Master")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Mould Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await MouldMasterRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await MouldMasterRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Mould Master has been")
        });
    } catch (e) {
        console.error("update Mould Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await MouldMasterRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Mould Master")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Mould Master");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Mould Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await MouldMasterRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Mould Master");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Mould Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            MOULD_MASTER.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        const suppliersOptions = await filteredSupplierList([
            {$match: {company: ObjectId(req.user.company), isSupplierActive: "A"}},
            {$sort: {supplierName: 1}},
            {
                $addFields: {
                    supplierBillingAddress: {$arrayElemAt: ["$supplierBillingAddress", 0]}
                }
            },
            {
                $project: {
                    supplierName: 1,
                    _id: 1,
                    supplierCode: 1,
                    supplierBillingState: "$supplierBillingAddress.state",
                    supplierBillingCity: "$supplierBillingAddress.city",
                    supplierBillingPinCode: "$supplierBillingAddress.pinCode"
                }
            }
        ]);
        const mouldTypeOptions = await getAllModuleMaster(req.user.company, "MOULD_TYPE");
        return res.success({autoIncrementNo, suppliersOptions, mouldTypeOptions});
    } catch (error) {
        console.error("getAllMasterData Mould Master", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

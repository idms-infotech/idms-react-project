const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/purchase/cgmModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {removeSingleFileInError, removeFile} = require("../../../../helpers/utility");
const {generateCreateData, getMatchData} = require("../../../../helpers/global.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {getAllCGMAttributes, getAllCGMExcelAttributes} = require("../../../../models/purchase/helpers/cgmHelper");
const {default: mongoose} = require("mongoose");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const ObjectId = mongoose.Types.ObjectId;
const {CAPITAL_GOODS_CGM} = require("../../../../mocks/schemasConstant/purchaseConstant");
const {filteredHSNList} = require("../../../../models/purchase/repository/hsnRepository");
const {filteredSupplierList} = require("../../../../models/purchase/repository/supplierRepository");
const CGMRepository = require("../../../../models/purchase/repository/CGMRepository");
const { getAllModuleMaster } = require("../../settings/module-master/module-master");
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllCGMAttributes();
        if (req.query.excel == "true") {
            project = getAllCGMExcelAttributes();
        }
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $lookup: {
                    from: "HSN",
                    localField: "hsnCode",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, hsnCode: 1}}],
                    as: "hsnCode"
                }
            },
            {$unwind: "$hsnCode"}
        ];
        let rows = await CGMRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllCGM", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    create SKU new Record
exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        if (createdObj.supplierInfo) {
            createdObj.supplierInfo = JSON.parse(createdObj.supplierInfo);
        }
        if (req.file) {
            if (req.file.filename) {
                createdObj["technicalSheetFile"] = req.file.filename;
            }
        }
        const saveObj = new Model(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Capital Goods")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            await saveObj.remove();
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create CGM", e);
        if (req.file) {
            removeSingleFileInError(req.file);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update SKU  Record
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        itemDetails.updatedBy = req.user.sub;
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        if (req.body.supplierInfo) {
            req.body.supplierInfo = JSON.parse(req.body.supplierInfo);
        }
        itemDetails = await generateCreateData(itemDetails, req.body);
        if (req.file && req.file.filename) {
            if (itemDetails.technicalSheetFile) {
                removeFile(`${req.file.destination}/${itemDetails.technicalSheetFile}`);
            }
            itemDetails.technicalSheetFile = req.file.filename;
        }
        itemDetails = await itemDetails.save();
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Capital Goods has been")
        });
    } catch (e) {
        console.error("update CGM", e);
        if (req.file) {
            removeSingleFileInError(req.file);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        await saveObj.remove();
        return res.serverError(errors);
    }
});

// @desc    deleteById SKU Record
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Capital Goods")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Capital Goods");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById CGM", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById SKU Record
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Capital Goods");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Capital Goods", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData SKU Record
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            CAPITAL_GOODS_CGM.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        let UOMOptions = await getAllModuleMaster(req.user.company, "CGM_UOM");
        let hsnCodes = await filteredHSNList([
            {$match: {company: ObjectId(req.user.company), isActive: "Y"}},
            {$sort: {createdAt: -1}},
            {
                $project: {
                    _id: 1,
                    hsnCode: 1
                }
            }
        ]);
        let suppliersOptions = await filteredSupplierList([
            {$match: {company: ObjectId(req.user.company), isSupplierActive: "A"}},
            {$sort: {supplierName: 1}},
            {
                $addFields: {
                    supplierBillingAddress: {$arrayElemAt: ["$supplierBillingAddress", 0]}
                }
            },
            {
                $project: {
                    label: "$supplierName",
                    value: "$_id",
                    currency: "$supplierCurrency",
                    supplierCode: 1,
                    supplierBillingState: "$supplierBillingAddress.state",
                    supplierBillingCity: "$supplierBillingAddress.city",
                    supplierBillingPinCode: "$supplierBillingAddress.pinCode"
                }
            }
        ]);
        return res.success({
            autoIncrementNo,
            hsnCodes,
            suppliersOptions,
            UOMOptions,
        });
    } catch (error) {
        console.error("getAllMasterData Capital Goods", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

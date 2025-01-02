const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/settings/professionalTaxModel");
const AutoIncrement = require("../../../../models/settings/autoIncrementModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAutoIncrementNumber, outputData, getAllAggregationFooter} = require("../../../../helpers/utility");
const {generateCreateData, getMatchData} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {findAppParameterValue} = require("../appParameter/appParameter");
const {getAllProfessionalTaxAttributes} = require("../../../../models/settings/helpers/professionalTaxHelper");
const {getAndSetAutoIncrementNo} = require("../autoIncrement/autoIncrement");
const {PROFESSIONAL_TAX} = require("../../../../mocks/schemasConstant/settingsConstant");
const ObjectId = mongoose.Types.ObjectId;
// @desc    getAll Professional Tax Record
// @route   GET /purchase/servicePurchaseOrder/getAll
exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let project = getAllProfessionalTaxAttributes();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([
            {$match: {company: ObjectId(req.user.company)}},
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            ...outputData(rows)
        });
    } catch (e) {
        console.error("Professional Tax", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @desc    create Professional Tax new Record
// @route   POST /purchase/servicePurchaseOrder/create
exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        await Model.create(createdObj);

        return res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Professional Tax")
        });
    } catch (e) {
        console.error("create Professional Tax", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update Professional Tax  Record

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await generateCreateData(itemDetails, req.body);
        itemDetails = await itemDetails.save();

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Professional Tax")
        });
    } catch (e) {
        console.error("update Professional Tax", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById Professional Tax Record
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Professional Tax")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Professional Tax");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Professional Tax", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById Professional Tax Record
// @route   GET /purchase/servicePurchaseOrder/getById/:id
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Professional Tax");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Professional Tax", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData Professional Tax Record
// @route   GET /purchase/servicePurchaseOrder/getAllMasterData
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            PROFESSIONAL_TAX.AUTO_INCREMENT_DATA(),
            req.user.company
        );
        return res.success({
            autoIncrementNo
        });
    } catch (error) {
        console.error("getAllMasterData Professional Tax", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllProfessionalTax = asyncHandler(async company => {
    try {
        let rows = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company)
                }
            },
            {
                $group: {
                    _id: {
                        state: "$state",
                        gender: "$gender"
                    },
                    slabs: {
                        $push: {
                            minSalary: "$minSalary",
                            maxSalary: "$maxSalary",
                            amount: "$amount",
                            isFebAmount: "$isFebAmount"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    state: "$_id.state",
                    gender: "$_id.gender",
                    slabs: 1
                }
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllProfessionalTax", e);
    }
});

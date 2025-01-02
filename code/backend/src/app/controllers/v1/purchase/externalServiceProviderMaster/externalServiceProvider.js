const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/purchase/externalServiceProviderModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {getIncrementNumWithPrefix} = require("../../../../helpers/utility");
const {generateCreateData} = require("../../../../helpers/global.options");
const {getAllPaymentTerms} = require("../../sales/paymentTerms/paymentTerms");
const {
    getAllExternalServiceProviderAttributes,
    getAllExternalServiceProviderExcelAttributes
} = require("../../../../models/purchase/helpers/externalServiceProviderHelper");
const {default: mongoose} = require("mongoose");
const {filteredESPCategoryList} = require("../../../../models/settings/repository/ESPCategoryRepository");
const ExtServiceProviderRepository = require("../../../../models/purchase/repository/extServiceProviderRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");

const ObjectId = mongoose.Types.ObjectId;

// @route   GET /purchase/suppliers/getAll
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllExternalServiceProviderAttributes();
        if (req.query.excel == "true") {
            project = getAllExternalServiceProviderExcelAttributes();
        }
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}, {$unwind: "$billingAddress"}];
        let rows = await ExtServiceProviderRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAllESP", e);
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
        const saveObj = new Model(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("External Service Provider")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create External Service Provider", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await generateCreateData(itemDetails, req.body);
        if (req.body.billingAddress) {
            itemDetails.billingAddress = req.body.billingAddress;
        }
        if (req.body.shippingAddress) {
            itemDetails.shippingAddress = req.body.shippingAddress;
        }
        if (req.body.contactMatrix) {
            itemDetails.contactMatrix = req.body.contactMatrix;
        }
        if (req.body.bankDetails) {
            itemDetails.bankDetails = req.body.bankDetails;
        }

        itemDetails = await itemDetails.save();

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("External Service Provider has been")
        });
    } catch (e) {
        console.error("update External Service Provider ", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("External Service Provider")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("External Service Provider");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById External Service Provider", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("External Service Provider");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById External Service Provider", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllExtServiceProviderName = asyncHandler(async company => {
    try {
        let rows = await Model.find({
            company: company,
            isESPActive: "Active"
        });
        return rows;
    } catch (e) {
        console.error("getAllItemCategory", e);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const ESPCategoryOptions = await filteredESPCategoryList([
            {$match: {categoryStatus: "Active"}},
            {
                $project: {
                    _id: 1,
                    category: 1,
                    prefix: 1,
                    nextAutoIncrement: 1,
                    digit: 1
                }
            }
        ]);
        let autoIncValues = {};
        if (ESPCategoryOptions.length > 0) {
            for (const ele of ESPCategoryOptions) {
                autoIncValues[ele.category] = getIncrementNumWithPrefix({
                    modulePrefix: ele.prefix,
                    autoIncrementValue: ele.nextAutoIncrement,
                    digit: ele.digit
                });
            }
        }
        const paymentTermsOptions = await getAllPaymentTerms(req.user.company);
        const currenciesOptions = await getAllModuleMaster(req.user.company, "CURRENCY");
        return res.success({
            paymentTermsOptions: paymentTermsOptions.map(x => {
                return {
                    label: x.paymentDescription,
                    value: x.paymentDescription
                };
            }),
            currenciesOptions,
            ESPCategoryOptions,
            autoIncValues
        });
    } catch (error) {
        console.error("getAllMasterData ESP", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

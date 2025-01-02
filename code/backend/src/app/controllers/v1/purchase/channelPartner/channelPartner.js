const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllChannelPartnerAttributes,
    getAllChannelPartnerExcelAttributes
} = require("../../../../models/purchase/helpers/channelPartnerHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {CHANNEL_PARTNER} = require("../../../../mocks/schemasConstant/purchaseConstant");
const ChannelPartnerRepository = require("../../../../models/purchase/repository/channelPartnerRepository");
const {getAllPaymentTerms} = require("../../sales/paymentTerms/paymentTerms");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");

const {getAllModuleMaster} = require("../../settings/module-master/module-master");
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllChannelPartnerAttributes();
        if (req.query.excel == "true") {
            project = getAllChannelPartnerExcelAttributes();
        }
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $addFields: {
                    billingAddress: {$first: "$billingAddress"}
                }
            }
        ];
        let rows = await ChannelPartnerRepository.getAllPaginate({
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
        const itemDetails = await ChannelPartnerRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Channel Partner")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Channel Partner", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ChannelPartnerRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await ChannelPartnerRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Channel Partner has been")
        });
    } catch (e) {
        console.error("update Channel Partner", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await ChannelPartnerRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Channel Partner")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Channel Partner");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Channel Partner", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await ChannelPartnerRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Channel Partner");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Channel Partner", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const purchaseTypesOptions = await getAllModuleMaster( req.user.company,"PURCHASE_TYPE");
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            CHANNEL_PARTNER.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        const paymentTermsOptions = await getAllPaymentTerms(req.user.company);
        const currenciesOptions = await getAllModuleMaster(req.user.company,"CURRENCY");
        return res.success({
            paymentTermsOptions: paymentTermsOptions.map(x => {
                return {
                    label: x.paymentDescription,
                    value: x.paymentDescription
                };
            }),
            currenciesOptions,
            purchaseTypesOptions,
            autoIncrementNo
        });
    } catch (error) {
        console.error("getAllMasterData Channel Partner", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

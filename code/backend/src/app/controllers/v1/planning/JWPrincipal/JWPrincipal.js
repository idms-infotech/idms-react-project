const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllJWPrincipalAttributes} = require("../../../../models/planning/helpers/JWPrincipalHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {JW_PRINCIPAL} = require("../../../../mocks/schemasConstant/planningConstant");
const JWPrincipalRepository = require("../../../../models/planning/repository/JWPrincipalRepository");
const {getAllPaymentTerms} = require("../../sales/paymentTerms/paymentTerms");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllJWPrincipalAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await JWPrincipalRepository.getAllPaginate({
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
        const itemDetails = await JWPrincipalRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("JW Principal")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create JW Principal", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await JWPrincipalRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await JWPrincipalRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("JW Principal has been")
        });
    } catch (e) {
        console.error("update JW Principal", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await JWPrincipalRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("JW Principal")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("JW Principal");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById JW Principal", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await JWPrincipalRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("JW Principal");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById JW Principal", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            JW_PRINCIPAL.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        const paymentTermsOptions = await getAllPaymentTerms(req.user.company);
        const purchaseCountryOptions = await getAllModuleMaster(req.user.company, "PURCHASE_COUNTRY");
        const zonesOptions = await getAllModuleMaster(company, "REGION_ZONES");
        const freightTermsOptions = await getAllModuleMaster(req.user.company, "FREIGHT_TERMS");
        return res.success({
            autoIncrementNo,
            purchaseCountryOptions,
            freightTermsOptions,
            paymentTermsOptions: paymentTermsOptions.map(x => {
                return {
                    label: x.paymentDescription,
                    value: x.paymentDescription
                };
            }),
            zonesOptions
        });
    } catch (error) {
        console.error("getAllMasterData JW Principal", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

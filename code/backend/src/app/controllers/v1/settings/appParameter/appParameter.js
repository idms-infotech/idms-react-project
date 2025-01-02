const asyncHandler = require("express-async-handler");
const LocationModel = require("../../../../models/settings/locationModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllAppParameterAttributes} = require("../../../../models/settings/helpers/appParameterHelper");
const AppParameterJson = require("../../../../mocks/appParameter.json");
const {getAndSetAutoIncrementNo} = require("../autoIncrement/autoIncrement");
const {APP_PARAMETER} = require("../../../../mocks/schemasConstant/settingsConstant");
const AppParameterRepository = require("../../../../models/settings/repository/appParameterRepository");
const {ObjectId} = require("../../../../../config/mongoose");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllAppParameterAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await AppParameterRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
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
        const itemDetails = await AppParameterRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("AppParameter")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.locationCreate = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const saveObj = new LocationModel(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Location"),
                _id: itemDetails._id
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await AppParameterRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails = await AppParameterRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("AppParameter has been")
        });
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.deleteByAppCode = asyncHandler(async (req, res) => {
    try {
        const parameterExists = AppParameterJson.find(x => x.appParameterAppCode == req.params.code);
        if (parameterExists) {
            return res.preconditionFailed(MESSAGES.apiErrorStrings.CANNOT_DELETE("AppParameter"));
        } else {
            await AppParameterRepository.deleteDoc({appParameterAppCode: req.params.code});
            return res.success({message: MESSAGES.apiSuccessStrings.DELETED("AppParameter")});
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await AppParameterRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("AppParameter");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(APP_PARAMETER.AUTO_INCREMENT_DATA(), req.user.company);
        res.success({autoIncrementNo});
    } catch (error) {
        console.error("getAllMasterDataForUser", error);
        res.status(400);
        throw new Error("Invalid Model data");
    }
});

exports.findAppParameterValue = async (code, company) => {
    try {
        const appParameter = await AppParameterRepository.findOneDoc({
            appParameterAppCode: code,
            company: company
        });
        if (appParameter) {
            return appParameter.appParameterValue;
        } else {
            return undefined;
        }
    } catch (e) {
        console.error(e);
    }
};
exports.getAppParameterValueByCode = asyncHandler(async (req, res) => {
    try {
        let existing = await AppParameterRepository.findOneDoc({appParameterName: req.params.code});
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("AppParameter");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getAppParameterValueByCodeSupport = asyncHandler(async (req, res) => {
    try {
        let value = await this.findAppParameterValue(req.query.code, req.params.company);
        return res.success(value);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});

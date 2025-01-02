const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllHSNAttributes, getAllHSNExcelAttributes} = require("../../../../models/purchase/helpers/hsnHelper");
const {default: mongoose} = require("mongoose");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {PURCHASE_HSN} = require("../../../../mocks/schemasConstant/purchaseConstant");
const HSNRepository = require("../../../../models/purchase/repository/hsnRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");

const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllHSNAttributes();
        if (req.query.excel == "true") {
            project = getAllHSNExcelAttributes();
        }
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $addFields: {
                    gstRate: {$toString: "$gstRate"},
                    ugstRate: {$toString: "$ugstRate"},
                    cgstRate: {$toString: "$cgstRate"},
                    sgstRate: {$toString: "$sgstRate"},
                    igstRate: {$toString: "$igstRate"}
                }
            }
        ];
        let rows = await HSNRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.create = asyncHandler(async (req, res) => {
    try {
        let exists = await HSNRepository.findOneDoc(
            {
                hsnCode: req.body.hsnCode
            },
            {
                _id: 1
            }
        );
        if (exists) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("HSN Code");
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await HSNRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("HSN")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create HSN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await HSNRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await HSNRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("HSN has been")
        });
    } catch (e) {
        console.error("update HSN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await HSNRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("HSN")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("HSN");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById HSN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await HSNRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("HSN");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById HSN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            PURCHASE_HSN.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        return res.success({autoIncrementNo});
    } catch (error) {
        console.error("getAllMasterData HSN", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getHSNByCode = async hsnCode => {
    try {
        let existing = await HSNRepository.findOneDoc({hsnCode: hsnCode});
        return existing;
    } catch (e) {
        console.error("getHSNByCode HSN", e);
    }
};

exports.checkPurchaseHSNMasterValidation = async (purchaseHSNData, column, company) => {
    try {
        const purchaseHSNOptions = await HSNRepository.filteredHSNList([
            {$match: {company: ObjectId(company)}},
            {
                $project: {
                    hsnCode: 1,
                    goodsDescription: 1
                }
            }
        ]);
        const requiredFields = [
            "hsnCode",
            "goodsDescription",
            "gstRate",
            "igstRate",
            "sgstRate",
            "cgstRate",
            "ugstRate"
        ];
        const falseArr = OPTIONS.falsyArray;
        let dropdownCheck = [];
        let uniquePurchaseHSN = [];
        for await (const x of purchaseHSNData) {
            x.isValid = true;
            x.message = null;
            let label = `${x["hsnCode"]}`;
            if (uniquePurchaseHSN.includes(label)) {
                x.isValid = false;
                x.message = `${x["hsnCode"]} duplicate Entry`;
                break;
            }
            uniquePurchaseHSN.push(label);
            for (const ele of Object.values(column)) {
                if (requiredFields.includes(ele) && falseArr.includes(x[ele])) {
                    x.isValid = false;
                    x.message = validationJson[ele] ?? `${ele} is Required`;
                    break;
                }
                for (const dd of dropdownCheck) {
                    if (ele == dd.key && !dd.options.map(values => values.value).includes(x[ele])) {
                        x.isValid = false;
                        x.message = `${ele} is Invalid Value & Value Must be ${dd.options.map(values => values.value)}`;
                        break;
                    }
                }
                for (const option of purchaseHSNOptions) {
                    if (option.hsnCode == x["hsnCode"]) {
                        x.isValid = false;
                        x.message = `${x["hsnCode"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = purchaseHSNData.filter(x => !x.isValid);
        const validRecords = purchaseHSNData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertPurchaseHSNMasterByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        let purchaseHSNData = jsonData.map(rest => {
            rest.company = company;
            rest.createdBy = createdBy;
            rest.updatedBy = updatedBy;
            rest.revisionInfo = {
                revisionNo: 0,
                revisionDate: new Date(),
                reasonForRevision: "-",
                revisionProposedBy: "-",
                revisionApprovedBy: "IDMS Support"
            };
            return rest;
        });
        for await (const item of purchaseHSNData) {
            await HSNRepository.createDoc(item);
        }
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

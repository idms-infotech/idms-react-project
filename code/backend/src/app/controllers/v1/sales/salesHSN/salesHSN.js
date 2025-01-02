const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllSaleHSNAttributes,
    getAllSaleHSNExcelAttributes
} = require("../../../../models/sales/helpers/saleHSNHelper");
const {default: mongoose} = require("mongoose");
const {SALES_HSN} = require("../../../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const SalesHSNRepository = require("../../../../models/sales/repository/salesHSNRepository");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
const { OPTIONS } = require("../../../../helpers/global.options");

const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSaleHSNAttributes();
        // if (req.query.excel == "true") {
        //     project = getAllSaleHSNExcelAttributes();
        // }
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
        let rows = await SalesHSNRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllHSN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.create = asyncHandler(async (req, res) => {
    try {
        let existing = await SalesHSNRepository.findOneDoc(
            {
                hsnCode: req.body.hsnCode
            },
            {_id: 1}
        );
        if (existing) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("HSN");
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await SalesHSNRepository.createDoc(createdObj);
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
        let itemDetails = await SalesHSNRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await SalesHSNRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("HSN has been")
        });
    } catch (e) {
        console.error("update HSN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById SKU Record
// @route   PUT /sales/SKU/delete/:id
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await SalesHSNRepository.deleteDoc({_id: req.params.id});
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

// @desc    getById SKU Record
// @route   GET /sales/SKU/getById/:id
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await SalesHSNRepository.getDocById(req.params.id);
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

// @desc    getAllMasterData SKU Record
// @route   GET /sales/SKU/getAllMasterData
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(SALES_HSN.AUTO_INCREMENT_DATA(), req.user.company);
        return res.success({autoIncrementNo});
    } catch (error) {
        console.error("getAllMasterData HSN", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getSalesHSNByCode = async hsnCode => {
    try {
        let existing = await SalesHSNRepository.findOneDoc({hsnCode: hsnCode});
        return existing;
    } catch (e) {
        console.error("getSalesHSNByCode HSN", e);
    }
};

exports.checkSalesHSNMasterValidation = async (salesHSNData, column, company) => {
    try {
        const salesHSNOptions = await SalesHSNRepository.filteredSaleHSNList([
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
            "cgstRate",
            "sgstRate",
            "ugstRate"
        ];
        const falseArr = OPTIONS.falsyArray;
        let dropdownCheck = [];
        let uniqueSalesHSN = [];
        for await (const x of salesHSNData) {
            x.isValid = true;
            x.message = null;
            let label = `${x["hsnCode"]}`;
            if (uniqueSalesHSN.includes(label)) {
                x.isValid = false;
                x.message = `${x["hsnCode"]} duplicate Entry`;
                break;
            }
            uniqueSalesHSN.push(label);
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
                for (const option of salesHSNOptions) {
                    if (option.hsnCode == x["hsnCode"]) {
                        x.isValid = false;
                        x.message = `${x["hsnCode"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = salesHSNData.filter(x => !x.isValid);
        const validRecords = salesHSNData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertSalesHSNMasterByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        let salesHSNData = jsonData.map(rest => {
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
        for await (const item of salesHSNData) {
            await SalesHSNRepository.createDoc(item);
        }
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

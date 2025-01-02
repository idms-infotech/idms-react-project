const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/purchase/sacModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {getAllSACAttributes} = require("../../../../models/purchase/helpers/sacHelper");
const {default: mongoose} = require("mongoose");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {PURCHASE_SAC} = require("../../../../mocks/schemasConstant/purchaseConstant");
const SACRepository = require("../../../../models/purchase/repository/sacRepository");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSACAttributes();
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
        let rows = await SACRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllSAC", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @desc    create SAC new Record
// @route   POST /purchase/SAC/create
exports.create = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findOne(
            {
                sacCode: req.body.sacCode
            },
            {_id: 1}
        );
        if (existing) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("SAC Code");
            return res.preconditionFailed(errors);
        }
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
                message: MESSAGES.apiSuccessStrings.ADDED("SAC")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create SAC", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @desc    update SAC  Record
// @route   PUT /purchase/SAC/update/:id
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
            message: MESSAGES.apiSuccessStrings.UPDATE("SAC has been")
        });
    } catch (e) {
        console.error("update SAC", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @desc    deleteById SAC Record
// @route   PUT /purchase/SAC/delete/:id
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("SAC")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SAC");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById SAC", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @desc    getById SAC Record
// @route   GET /purchase/SAC/getById/:id
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SAC");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById SAC", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @desc    getAllMasterData SAC Record
// @route   GET /purchase/SAC/getAllMasterData
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(PURCHASE_SAC.AUTO_INCREMENT_DATA(), req.user.company);
        return res.success({autoIncrementNo});
    } catch (error) {
        console.error("getAllMasterData SAC", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getSACObj = async SACCode => {
    try {
        let rows = await Model.findOne({
            sacCode: SACCode
        });
        return rows;
    } catch (e) {
        console.error("getSACObj", e);
    }
};

exports.InsertSAC = async createObj => {
    try {
        let itemDetails = await Model.findOne({sacCode: createObj.sacCode});
        if (!itemDetails) {
            await Model.create(createObj);
        }
    } catch (e) {
        console.error("InsertSAC", e);
    }
};

exports.checkPurchaseSACMasterValidation = async (purchaseSACData, column, company) => {
    try {
        const purchaseSACOptions = await SACRepository.filteredSACMasterList([
            {$match: {company: ObjectId(company)}},
            {
                $project: {
                    sacCode: 1,
                    serviceDescription: 1
                }
            }
        ]);
        const requiredFields = [
            "sacCode",
            "serviceDescription",
            "gstRate",
            "igstRate",
            "sgstRate",
            "cgstRate",
            "ugstRate"
        ];
        const falseArr = OPTIONS.falsyArray;
        let dropdownCheck = [];
        let uniquePurchaseSAC = [];
        for await (const x of purchaseSACData) {
            x.isValid = true;
            x.message = null;
            let label = `${x["sacCode"]}`;
            if (uniquePurchaseSAC.includes(label)) {
                x.isValid = false;
                x.message = `${x["sacCode"]} duplicate Entry`;
                break;
            }
            uniquePurchaseSAC.push(label);
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
                for (const option of purchaseSACOptions) {
                    if (option.sacCode == x["sacCode"]) {
                        x.isValid = false;
                        x.message = `${x["sacCode"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = purchaseSACData.filter(x => !x.isValid);
        const validRecords = purchaseSACData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertPurchaseSACMasterByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        let purchaseSACData = jsonData.map(rest => {
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
        for await (const item of purchaseSACData) {
            await SACRepository.createSAC(item);
        }
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

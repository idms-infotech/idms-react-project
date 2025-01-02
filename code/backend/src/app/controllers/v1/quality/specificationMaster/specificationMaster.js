const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {default: mongoose} = require("mongoose");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getAllSpecificationAttributes} = require("../../../../models/quality/helpers/specificationHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {SPECIFICATION} = require("../../../../mocks/schemasConstant/qualityConstant");
const SpecificationRepository = require("../../../../models/quality/repository/specificationRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
const ObjectId = mongoose.Types.ObjectId;
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSpecificationAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            }
        ];

        let rows = await SpecificationRepository.getAllPaginate({pipeline, project, queryParams: req.query});
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
        const itemDetails = await SpecificationRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: "Specification Master has been created successfully"
            });
        }
    } catch (e) {
        console.error("create Specification Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await SpecificationRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await SpecificationRepository.updateDoc(itemDetails, req.body);
        if (itemDetails) {
            res.success({
                message: "Specification Master has been updated successfully"
            });
        }
    } catch (e) {
        console.error("update Specification Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await SpecificationRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Specification Master")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Specification Master");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Specification Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await SpecificationRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Specification Master");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Specification Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(SPECIFICATION.AUTO_INCREMENT_DATA(), req.user.company);
        const options = await dropDownOptions(req.user.company);
        return res.success({autoIncrementNo, ...options});
    } catch (error) {
        console.error("getAllMasterData Specification Master", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

const dropDownOptions = async company => {
    try {
        let [UOMListOptions] = await Promise.all([getAllModuleMaster(company, "SPECIFICATION_UOM")]);
        return {
            UOMListOptions
        };
    } catch (error) {
        console.error(error);
    }
};

exports.checkSpecificationMasterValidation = async (specificationData, column, company) => {
    try {
        const specificationOptions = await SpecificationRepository.filteredSpecificationList([
            {$match: {company: ObjectId(company), status: OPTIONS.defaultStatus.ACTIVE}},
            {
                $project: {
                    characteristic: 1
                }
            }
        ]);
        const requiredFields = ["characteristic", "UOM", "testStandard", "measuringInstrument"];
        const falseArr = OPTIONS.falsyArray;
        let {UOMListOptions} = await dropDownOptions(company);
        let dropdownCheck = [
            {
                key: "UOM",
                options: UOMListOptions.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            }
        ];
        let uniqueSpecification = [];
        for await (const x of specificationData) {
            x.isValid = true;
            x.message = null;
            let label = `${x["characteristic"]}`;
            if (uniqueSpecification.includes(label)) {
                x.isValid = false;
                x.message = `${x["characteristic"]} duplicate Entry`;
                break;
            }
            uniqueSpecification.push(label);
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
                for (const option of specificationOptions) {
                    if (option.characteristic == x["characteristic"]) {
                        x.isValid = false;
                        x.message = `${x["characteristic"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = specificationData.filter(x => !x.isValid);
        const validRecords = specificationData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertSpecificationMasterByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        let specificationData = jsonData.map(rest => {
            rest.company = company;
            rest.createdBy = createdBy;
            rest.updatedBy = updatedBy;
            return rest;
        });
        for await (const item of specificationData) {
            await SpecificationRepository.createDoc(item);
        }
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

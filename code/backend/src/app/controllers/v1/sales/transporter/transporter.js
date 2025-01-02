const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {default: mongoose} = require("mongoose");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {
    getAllTransporterMasterAttributes,
    getAllTransporterMasterExcelAttributes
} = require("../../../../models/sales/helpers/transporterMasterHelper");
const {getAndSetAutoIncrementNo, getNextAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {TRANSPORTER_MASTER} = require("../../../../mocks/schemasConstant/salesConstant");
const TransporterMasterRepository = require("../../../../models/sales/repository/transporterMasterRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const statesJson = require("../../../../mocks/states.json");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
const {getIncrementNumWithPrefix} = require("../../../../helpers/utility");
const AutoIncrementRepository = require("../../../../models/settings/repository/autoIncrementRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");

const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllTransporterMasterAttributes();
        if (req.query.excel == "true") {
            project = getAllTransporterMasterExcelAttributes();
        }
        let pipeline = [
            {
                $match: {
                    status: {$in: ["Active"]},
                    company: ObjectId(req.user.company)
                }
            }
        ];
        let rows = await TransporterMasterRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("Transporter", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @desc    create Transporter new Record
// @route   POST /purchase/servicePurchaseOrder/create
exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        await TransporterMasterRepository.createDoc(createdObj);
        return res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Transporter")
        });
    } catch (e) {
        console.error("create Transporter", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update Transporter  Record
// @route   PUT /purchase/servicePurchaseOrder/update/:id
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await TransporterMasterRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await TransporterMasterRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Transporter")
        });
    } catch (e) {
        console.error("update Transporter", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById Transporter Record
// @route   PUT /purchase/servicePurchaseOrder/delete/:id
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await TransporterMasterRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Transporter")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Transporter");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Transporter", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById Transporter Record
// @route   GET /purchase/servicePurchaseOrder/getById/:id
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await TransporterMasterRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Transporter");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Transporter", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData Transporter Record
// @route   GET /purchase/servicePurchaseOrder/getAllMasterData
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            TRANSPORTER_MASTER.AUTO_INCREMENT_DATA(),
            req.user.company
        );
        const options = await dropDownOptions(req.user.company);
        // let transporterTypeOptions = await findAppParameterValue("MODE_OF_TRANSPORT", req.user.company);
        return res.success({
            autoIncrementNo,
            ...options
        });
    } catch (error) {
        console.error("getAllMasterData Transporter", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

const dropDownOptions = async company => {
    try {
        let [transporterTypeOptions] = await Promise.all([getAllModuleMaster(company, "MODE_OF_TRANSPORT")]);
        return {
            transporterTypeOptions
        };
    } catch (error) {
        console.error(error);
    }
};
exports.getAllTransporter = async (match, project) => {
    try {
        let rows = await TransporterMasterRepository.filteredTransporterMasterList([
            {
                $match: {status: OPTIONS.defaultStatus.ACTIVE, ...match}
            },
            {
                $project: project
            },
            {
                $sort: {label: 1}
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllTransporter", e);
    }
};

exports.checkTransporterMasterValidation = async (transporterData, column, company) => {
    try {
        const transporterOptions = await TransporterMasterRepository.filteredTransporterMasterList([
            {$match: {company: ObjectId(req.user.company), status: OPTIONS.defaultStatus.ACTIVE}},
            {
                $project: {
                    name: 1
                }
            }
        ]);
        const requiredFields = ["transporterType"];
        const falseArr = OPTIONS.falsyArray;
        let {transporterTypeOptions} = await dropDownOptions(company);
        let dropdownCheck = [
            {
                key: "transporterType",
                options: transporterTypeOptions.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            },
            {
                key: "state",
                options: statesJson
            }
        ];
        let uniqueTransporter = [];
        for await (const x of transporterData) {
            x.isValid = true;
            x.message = null;
            let label = `${x["name"]}`;
            if (uniqueTransporter.includes(label)) {
                x.isValid = false;
                x.message = `${x["name"]} duplicate Entry`;
                break;
            }
            uniqueTransporter.push(label);
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
                for (const option of transporterOptions) {
                    if (option.name == x["name"]) {
                        x.isValid = false;
                        x.message = `${x["name"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = transporterData.filter(x => !x.isValid);
        const validRecords = transporterData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertTransporterMasterByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        let autoIncrementObj = await getNextAutoIncrementNo({
            ...TRANSPORTER_MASTER.AUTO_INCREMENT_DATA(),
            company: company
        });
        let transporterData = jsonData.map(x => {
            rest.transporterCode = getIncrementNumWithPrefix(autoIncrementObj);
            rest.company = company;
            rest.createdBy = createdBy;
            rest.updatedBy = updatedBy;
            autoIncrementObj.autoIncrementValue++;
            return rest;
        });
        await TransporterMasterRepository.insertManyDoc(transporterData);
        await AutoIncrementRepository.findAndUpdateDoc(
            {
                module: TRANSPORTER_MASTER.MODULE,
                company: company
            },
            {
                $set: {
                    autoIncrementValue: autoIncrementObj.autoIncrementValue
                }
            }
        );
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

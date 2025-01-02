const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllJobWorkerMasterAttributes} = require("../../../../models/purchase/helpers/jobWorkerMasterHelper");
const {getAndSetAutoIncrementNo, getNextAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {JOB_WORKER_MASTER} = require("../../../../mocks/schemasConstant/purchaseConstant");
const JobWorkerMasterRepository = require("../../../../models/purchase/repository/jobWorkerMasterRepository");
const {getAllPaymentTerms} = require("../../sales/paymentTerms/paymentTerms");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {OPTIONS} = require("../../../../helpers/global.options");
const {SUPPLIER_OPTIONS} = require("../../../../mocks/dropDownOptions");
const statesJson = require("../../../../mocks/states.json");
const {getIncrementNumWithPrefix} = require("../../../../helpers/utility");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
const AutoIncrementRepository = require("../../../../models/settings/repository/autoIncrementRepository");
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllJobWorkerMasterAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await JobWorkerMasterRepository.getAllPaginate({
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
        const itemDetails = await JobWorkerMasterRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Job Worker Master")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Job Worker Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await JobWorkerMasterRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await JobWorkerMasterRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Job Worker Master has been")
        });
    } catch (e) {
        console.error("update Job Worker Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await JobWorkerMasterRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Job Worker Master")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Job Worker Master");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Job Worker Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await JobWorkerMasterRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Job Worker Master");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Job Worker Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            JOB_WORKER_MASTER.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        const options = await dropDownOptions(req.user.company);
        return res.success({
            autoIncrementNo,
            ...options
        });
    } catch (error) {
        console.error("getAllMasterData Job Worker Master", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const dropDownOptions = async company => {
    try {
        const paymentTermsOptions = await getAllPaymentTerms(company);
        const currenciesOptions = await getAllModuleMaster(company,"CURRENCY");
        const purchaseCountryOptions = await getAllModuleMaster(company, "PURCHASE_COUNTRY");
        return {
            purchaseCountryOptions,
            paymentTermsOptions: paymentTermsOptions.map(x => {
                return {
                    label: x.paymentDescription,
                    value: x.paymentDescription
                };
            }),
            currenciesOptions,
        };
    } catch (error) {
        console.error(error);
    }
};
exports.checkJobWorkerValidation = async (JWData, column, company) => {
    try {
        const jobWorkerOptions = await JobWorkerMasterRepository.filteredJobWorkerMasterList([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {jobWorkerName: 1}
            }
        ]);
        const requiredFields = [
            "jobWorkerName",
            "jobWorkerNickName",
            "GSTClassification",
            "GSTINNo",
            "PANNo",
            "currency",
            "paymentTerms",
            "MSMEClassification"
        ];
        const falseArr = OPTIONS.falsyArray;
        const MSME = SUPPLIER_OPTIONS.MSME_CLASSIFICATION;
        const GSTClassification = SUPPLIER_OPTIONS.GST_CLASSIFICATION;
        const accType = SUPPLIER_OPTIONS.ACCOUNT_TYPE;
        let {paymentTermsOptions, currenciesOptions, purchaseCountryOptions} = await dropDownOptions(company);
        let dropdownCheck = [
            {
                key: "paymentTerms",
                options: paymentTermsOptions
            },
            {
                key: "currency",
                options: currenciesOptions
            },
            {
                key: "country",
                options: purchaseCountryOptions.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            },
            {
                key: "GSTClassification",
                options: GSTClassification
            },
            {
                key: "MSMEClassification",
                options: MSME
            },
            {
                key: "state",
                options: statesJson
            },
            {
                key: "accountType",
                options: accType
            }
        ];
        let uniqueJW = [];
        for await (const x of JWData) {
            x.isValid = true;
            x.message = null;
            let label = x["jobWorkerName"];
            if (uniqueJW.includes(label)) {
                x.isValid = false;
                x.message = `${x["jobWorkerName"]} duplicate Entry`;
                break;
            }
            uniqueJW.push(label);
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
                for (const JW of jobWorkerOptions) {
                    if (JW.jobWorkerName == x["jobWorkerName"]) {
                        x.isValid = false;
                        x.message = `${x["jobWorkerName"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = JWData.filter(x => !x.isValid);
        const validRecords = JWData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertJobWorkerByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        let autoIncrementObj = await getNextAutoIncrementNo({
            ...JOB_WORKER_MASTER.AUTO_INCREMENT_DATA(),
            company: company
        });
        let JWData = jsonData.map(x => {
            const {
                country,
                state,
                cityOrDistrict,
                pinCode,
                line1,
                line2,
                line3,
                line4,
                contactPersonName,
                department,
                designation,
                mobileNo,
                emailId,
                befName,
                bankName,
                accountNumber,
                accountType,
                bankIFSCCode,
                bankSwiftCode,
                ...rest
            } = x;

            rest.primaryAddress = {
                country,
                state,
                cityOrDistrict,
                pinCode,
                line1,
                line2,
                line3,
                line4
            };
            rest.contactDetails = [
                {
                    contactPersonName,
                    department,
                    designation,
                    mobileNo,
                    emailId
                }
            ];
            rest.bankDetails = [
                {
                    befName,
                    bankName,
                    accountNumber,
                    accountType,
                    bankIFSCCode,
                    bankSwiftCode
                }
            ];
            rest.jobWorkerCode = getIncrementNumWithPrefix(autoIncrementObj);
            rest.company = company;
            rest.createdBy = createdBy;
            rest.updatedBy = updatedBy;
            autoIncrementObj.autoIncrementValue++;
            return rest;
        });
        await JobWorkerMasterRepository.insertManyDoc(JWData);
        await AutoIncrementRepository.findAndUpdateDoc(
            {
                module: JOB_WORKER_MASTER.MODULE,
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

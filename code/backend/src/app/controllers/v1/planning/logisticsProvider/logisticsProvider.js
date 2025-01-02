const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllLogisticsProviderAttributes} = require("../../../../models/planning/helpers/logisticsProviderHelper");
const LogisticsProviderRepository = require("../../../../models/planning/repository/logisticsProviderRepository");
const {getAllPaymentTerms} = require("../../sales/paymentTerms/paymentTerms");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getAllLSPCategory} = require("../../settings/LSPCategory/LSPCategory");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getIncrementNumWithPrefix} = require("../../../../helpers/utility");
const {SUPPLIER_OPTIONS} = require("../../../../mocks/dropDownOptions");
const statesJson = require("../../../../mocks/states.json");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllLogisticsProviderAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await LogisticsProviderRepository.getAllPaginate({
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
        const itemDetails = await LogisticsProviderRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Logistics Provider")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Logistics Provider", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await LogisticsProviderRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await LogisticsProviderRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Logistics Provider has been")
        });
    } catch (e) {
        console.error("update Logistics Provider", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await LogisticsProviderRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Logistics Provider")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Logistics Provider");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Logistics Provider", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await LogisticsProviderRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Logistics Provider");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Logistics Provider", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const options = await dropDownOptions(req.user.company);
        let autoIncValues = {};

        for (const ele of options.categoryOptions) {
            autoIncValues[ele.category] = getIncrementNumWithPrefix({
                modulePrefix: ele.prefix,
                autoIncrementValue: ele.nextAutoIncrement,
                digit: ele.digit
            });
        }
        options.categoryOptions = options.categoryOptions.map(x => {
            return {
                category: x?.category,
                categoryType: x?.categoryType
            };
        });

        return res.success({
            autoIncValues,
            ...options
        });
    } catch (error) {
        console.error("getAllMasterData Logistics Provider", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const dropDownOptions = async company => {
    try {
        let categoryOptions = await getAllLSPCategory([
            {
                $match: {
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ]);
        const zonesOptions = await getAllModuleMaster(company, "REGION_ZONES");
        const paymentTermsOptions = await getAllPaymentTerms(company);
        const currenciesOptions = await getAllModuleMaster(company, "CURRENCY");
        const purchaseCountryOptions = await getAllModuleMaster(company, "PURCHASE_COUNTRY");
        const freightTermsOptions = await getAllModuleMaster(company, "FREIGHT_SERVICES");
        return {
            zonesOptions,
            paymentTermsOptions: paymentTermsOptions.map(x => {
                return {
                    label: x.paymentDescription,
                    value: x.paymentDescription
                };
            }),
            currenciesOptions,
            purchaseCountryOptions,
            freightTermsOptions,
            categoryOptions
        };
    } catch (error) {
        console.error(error);
    }
};
exports.checkLogisticsValidation = async (logisticsData, column, company) => {
    try {
        const logisticsOptions = await LogisticsProviderRepository.filteredLogisticsProviderList([
            {$match: {company: ObjectId(company), status: OPTIONS.defaultStatus.ACTIVE}},
            {
                $project: {
                    _id: 1,
                    LSPName: 1,
                    GSTINNo: 1
                }
            }
        ]);
        const requiredFields = ["LSPName", "GSTINNo", "PANNo", "LSPCategory"];
        // const requiredFields = ["LSPName"];
        const falseArr = OPTIONS.falsyArray;
        let {
            zonesOptions,
            paymentTermsOptions,
            currenciesOptions,
            purchaseCountryOptions,
            freightTermsOptions,
            categoryOptions
        } = await dropDownOptions(company);
        let dropdownCheck = [
            {
                key: "LSPCategory",
                options: categoryOptions.map(x => {
                    return {
                        label: x.category,
                        value: x.category
                    };
                })
            },
            {
                key: "zone",
                options: zonesOptions
            },
            {
                key: "RCMApplicability",
                options: SUPPLIER_OPTIONS.RCM_APPLICABILITY
            },
            {
                key: "GSTClassification",
                options: SUPPLIER_OPTIONS.GST_CLASSIFICATION
            },
            {
                key: "currency",
                options: currenciesOptions.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            },
            {
                key: "paymentTerms",
                options: paymentTermsOptions.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            },
            {
                key: "freight",
                options: freightTermsOptions.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            },
            {
                key: "state",
                options: statesJson
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
                key: "accountType",
                options: SUPPLIER_OPTIONS.ACCOUNT_TYPE
            }
        ];
        dropdownCheck = dropdownCheck.map(y =>
            y.options.push({
                label: "",
                value: ""
            })
        );
        for await (const x of logisticsData) {
            x.isValid = true;
            x.message = null;
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
                if (
                    await LogisticsProviderRepository.findOneDoc(
                        {
                            $or: [{LSPName: x["LSPName"]}, {GSTINNo: x["GSTINNo"]}]
                        },
                        {
                            _id: 1
                        }
                    )
                ) {
                    x.isValid = false;
                    x.message = `${ele} is already exists`;
                    break;
                }
                for (const ele of logisticsOptions) {
                    if (ele.LSPName == x["LSPName"] && ele.GSTINNo == x["GSTINNo"]) {
                        x.isValid = false;
                        x.message = `${x["LSPName"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = logisticsData.filter(x => !x.isValid);
        const validRecords = logisticsData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};
exports.bulkInsertLogisticsByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        // let supplierAutoIncrementObj = await getNextAutoIncrementNo({
        //     ...SUPPLIER.AUTO_INCREMENT_DATA(),
        //     company: company
        // });
        let LSPCategoryOptions = await getAllLSPCategory([
            {
                $match: {
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ]);
        if (LSPCategoryOptions.length > 0) {
            LSPCategoryOptions = LSPCategoryOptions.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            });
        }
        let LSPData = jsonData.map(x => {
            const {
                country,
                state,
                city,
                pinCode,
                line1,
                line2,
                line3,
                line4,
                zone,

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
            let address = {
                country,
                state,
                city,
                pinCode,
                line1,
                line2,
                line3,
                line4,
                zone
            };
            rest.primaryAddress = address;
            rest.contactDetails = [
                {
                    contactPersonName,
                    department,
                    designation,
                    mobileNo,
                    emailId
                }
            ];
            rest.bankDetails = [{befName, bankName, accountNumber, accountType, bankIFSCCode, bankSwiftCode}];
            // rest.supplierCode = getIncrementNumWithPrefix(supplierAutoIncrementObj);
            rest.categoryType = LSPCategoryOptions.find(y => y.category == rest.LSPCategory)?.categoryType;
            rest.company = company;
            rest.createdBy = createdBy;
            rest.updatedBy = updatedBy;
            // supplierAutoIncrementObj.autoIncrementValue++;
            return rest;
        });

        for (const obj of LSPData) {
            if (obj.LSPCategory) {
                await LogisticsProviderRepository.createDoc(obj);
            }
        }
        // await SupplierRepository.insertManyDoc(LSPData);
        // await AutoIncrementRepository.findAndUpdateDoc(
        //     {
        //         module: SUPPLIER.MODULE,
        //         company: company
        //     },
        //     {
        //         $set: {
        //             autoIncrementValue: supplierAutoIncrementObj.autoIncrementValue
        //         }
        //     }
        // );
        return {message: "LSP Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/sales/customerModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    outputData,
    getAllAggregationFooter,
    getIncrementNumWithPrefix,
    checkExportsCustomer
} = require("../../../../helpers/utility");
const {getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const {getAllPaymentTerms} = require("../paymentTerms/paymentTerms");
const {updateProspectOnCustomerCreate} = require("../../businessLeads/prospect/prospect");
const {
    getAllCustomerAttributes,
    getAllCustomerExcelAttributes,
    getAllCustomerReportsAttributes
} = require("../../../../models/sales/helpers/customerHelper");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const CustomerRepository = require("../../../../models/sales/repository/customerRepository");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
const {filteredCurrencyMasterList} = require("../../../../models/settings/repository/currencyMasterRepository");
const {getAllCustomerCategory} = require("../../settings/customerCategory/customerCategory");
const {getAllTransporter} = require("../transporter/transporter");
const {filteredSubModuleManagementList} = require("../../../../models/settings/repository/subModuleRepository");
const statesJson = require("../../../../mocks/states.json");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllCustomerAttributes();
        if (req.query.excel == "true") {
            project = getAllCustomerExcelAttributes();
        }
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {$unwind: {path: "$customerBillingAddress", preserveNullAndEmptyArrays: true}},
            {
                $addFields: {
                    customerContactInfo: {$first: "$customerContactInfo"}
                }
            },
            {$unwind: {path: "$customerContactInfo", preserveNullAndEmptyArrays: true}}
        ];
        let rows = await CustomerRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll B2B Customer Master", e);
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
        const saveObj = new Model(createdObj);
        if (saveObj.customerShippingAddress.length == 0) {
            saveObj.customerShippingAddress = saveObj.customerBillingAddress.map(x => {
                x.contactPersonName = saveObj.customerName;
                return x;
            });
        }
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            if ((req.body.isConvertedToCustomer = "Converted to Customer")) {
                await updateProspectOnCustomerCreate(req.body.prospectId, req.user.company);
            }
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("B2B Customer Master"),
                _id: itemDetails._id
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create CMM", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await CustomerRepository.findOneDoc({_id: req.params.id}, {_id: 1});
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        await CustomerRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("B2B Customer Master has been")
        });
    } catch (e) {
        console.error("update B2B Customer Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @route   PUT /sales/SKU/delete/:id
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("B2B Customer Master")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("B2B Customer Master");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById CMM", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @route   GET /sales/SKU/getById/:id
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("CMM");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById CMM", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @route   GET /sales/SKU/getAllMasterData
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const options = await dropDownOptions(req.user.company);
        let autoIncValues = {};
        if (options?.customerCategories?.length > 0) {
            for (const ele of options.customerCategories) {
                autoIncValues[ele.category] = getIncrementNumWithPrefix({
                    modulePrefix: ele.prefix,
                    autoIncrementValue: ele.nextAutoIncrement,
                    digit: ele.digit
                });
            }
            options.customerCategories = options.customerCategories.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            });
        }

        const featureConfig = await filteredSubModuleManagementList([
            {
                $match: {
                    _id: ObjectId(req.query.subModuleId)
                }
            },
            {
                $unwind: "$featureConfig"
            },
            {
                $match: {
                    "featureConfig.status": true
                }
            },
            {
                $project: {
                    featureCode: "$featureConfig.featureCode",
                    value: "$featureConfig.value"
                }
            }
        ]);

        return res.success({
            autoIncValues,
            featureConfig,
            ...options
        });
    } catch (error) {
        console.error("getAllMasterData CMM", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const dropDownOptions = async company => {
    try {
        // const currenciesOptions = await findAppParameterValue("Currency", company);
        const currenciesOptions = await filteredCurrencyMasterList([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $sort: {sequence: 1}
            },
            {
                $project: {
                    currencyName: 1,
                    symbol: 1
                }
            }
        ]);

        const paymentTermsOptions = await getAllPaymentTerms(company);
        const zones = await getAllModuleMaster(company, "REGION_ZONES");
        const gstClassifications = await getAllModuleMaster(company, "GST_CLASSIFICATION");
        const salesCountry = await getAllModuleMaster(company, "SALES_COUNTRY");
        const customerCategories = await getAllCustomerCategory(company);
        const customerTypeOptions = await getAllModuleMaster(company, "CUSTOMER_TYPE");
        const freightTermsOptions = await getAllModuleMaster(company, "FREIGHT_TERMS");
        const transporterOptions = await getAllTransporter(
            {
                company: ObjectId(company)
            },
            {transporterName: "$name", transporterGSTIN: "$licenseNumber", _id: 1}
        );

        return {
            customerCategories,
            customerTypeOptions,
            salesCountry,
            currenciesOptions: currenciesOptions.map(x => {
                return {
                    label: x.currencyName,
                    value: x.currencyName
                };
            }),
            paymentTermsOptions: paymentTermsOptions.map(x => {
                return {
                    label: x.paymentDescription,
                    value: x.paymentDescription
                };
            }),
            zones,
            gstClassifications,
            freightTermsOptions,
            transporterOptions
        };
    } catch (error) {
        console.error(error);
    }
};
exports.getCustomersList = asyncHandler(async (req, res) => {
    try {
        const customerOptions = await CustomerRepository.filteredCustomerList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isCustomerActive: "A"
                }
            },
            {
                $project: {
                    customerCode: 1,
                    customerName: 1,
                    printQRCodeOnInvoice: 1,
                    printDSOnInvoice: 1,
                    showSKUDescription: 1
                }
            }
        ]);
        return res.success(customerOptions);
    } catch (error) {
        console.error("getCustomersList", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllCustomers = async (company, project = {}) => {
    try {
        let rows = await Model.find(
            {
                isCustomerActive: "A",
                company: company
            },
            project
        )
            .populate("company", "GSTIN")
            .sort({customerName: 1});
        return rows;
    } catch (e) {
        console.error("getAllCustomers", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return errors;
    }
};
exports.getAllCustomersFiltered = async match => {
    try {
        let rows = await Model.find(
            {isCustomerActive: "A", ...match},
            {
                customerName: 1,
                customerCategory: 1,
                currency: "$customerCurrency",
                reference: "$_id",
                referenceModel: "Customer"
            }
        ).sort({customerName: 1});
        return rows;
    } catch (e) {
        console.error("getAllCustomersFiltered", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return errors;
    }
};
exports.getAllCustomersForNPD = async company => {
    try {
        let rows = await Model.find(
            {
                isCustomerActive: "A",
                company: company
            },
            {name: "$customerName", type: "Customer", currency: "$customerCurrency"}
        );
        return rows;
    } catch (e) {
        console.error("getAllCustomersForNPD", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return errors;
    }
};
exports.getAllCustomersCount = async company => {
    try {
        const count = await Model.countDocuments({
            isCustomerActive: "A",
            company: company
        });
        return count;
    } catch (error) {
        console.error(error);
    }
};
exports.getB2BCustomerById = asyncHandler(async id => {
    try {
        let existing = await Model.findById(id).populate("company", "GSTIN placesOfBusiness exportsDetails");
        return existing;
    } catch (e) {
        console.error("getById B2B Customer Master", e);
    }
});
exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const customerCategory = await getAllModuleMaster(req.user.company, "CUSTOMER_TYPE");
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1,
            category = null,
            state = null,
            city = null
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let query = {
            company: ObjectId(req.user.company),
            isCustomerActive: "A",
            ...(!!category && {
                customerCategory: {$eq: category}
            }),
            ...(!!state && {
                "customerBillingAddress.state": {
                    $regex: `${state}`,
                    $options: "i"
                }
            }),
            ...(!!city && {
                "customerBillingAddress.city": {
                    $regex: `${city}`,
                    $options: "i"
                }
            })
        };
        let project = getAllCustomerReportsAttributes();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([
            {$unwind: "$customerBillingAddress"},
            {
                $match: query
            },
            {
                $addFields: {
                    customerContactInfo: {$first: "$customerContactInfo"}
                }
            },
            {$unwind: {path: "$customerContactInfo", preserveNullAndEmptyArrays: true}},
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            customerCategory: customerCategory?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            }),
            ...outputData(rows)
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// exports.uploadCustomerFile = asyncHandler(async (req, res) => {
//     try {
//         let fname = req.file.filename;
//         let jsonData = await readExcel(fname, column);
//         for (let i = 0; i < jsonData.length; i++) {
//             const ele = jsonData[i];
//             if (!!ele.pinCode && ele.pinCode.length > 1) {
//                 let numberValue = String(ele.pinCode).replaceAll(".", "").replaceAll(" ", "");
//                 ele.pinCode = +numberValue;
//             } else {
//                 ele.pinCode = null;
//             }
//         }
//         let customerData = jsonData.map(x => {
//             const {line1, line2, line3, country, state, city, district, pinCode, contactPersonName, ...rest} = x;
//             let address = {
//                 line1,
//                 line2,
//                 line3,
//                 country,
//                 state,
//                 city,
//                 district: city,
//                 pinCode,
//                 contactPersonName: rest.customerName
//             };
//             rest.customerBillingAddress = [address];
//             rest.customerShippingAddress = [address];
//             return rest;
//         });
//         // fs.writeFile("./customerMigration/Output.json", JSON.stringify(customerData), err => {
//         //     // In case of a error throw err.
//         //     if (err) throw err;
//         // });
//         let {customerArr, exitsCustomerArr} = await customerUpload(customerData);
//         return res.success({message: "uploaded successfully!", customerArr, exitsCustomerArr});
//     } catch (e) {
//         const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
//         res.serverError(errors);
//         throw new Error(e);
//     }
// });

exports.getAllCustomersWithAddress = asyncHandler(async (req, res) => {
    try {
        let customerList = await Model.find(
            {company: req.user.company},
            {
                customerCode: 1,
                customerName: 1,
                customerNickName: 1,
                region: 1,
                GSTIN: 1,
                customerBillingAddress: 1,
                customerShippingAddress: 1
            }
        );
        return res.success(customerList);
    } catch (e) {
        console.error("getAllCustomersWithAddress ", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.checkCustomersValidation = async (customerData, column, company) => {
    try {
        const customersOptions = await CustomerRepository.filteredCustomerList([
            {
                $match: {
                    isCustomerActive: "A",
                    company: ObjectId(company)
                }
            },
            {
                $project: {
                    customerName: 1
                }
            }
        ]);
        const requiredFields = [
            "customerNameLegalEntity",
            "customerCategory",
            "customerPAN",
            "customerCurrency",
            "customerPaymentTerms",
            "GSTIN",
            "GSTClassification",
            "categoryType"
        ];
        const falseArr = OPTIONS.falsyArray;
        let {
            currenciesOptions,
            customerCategories,
            paymentTermsOptions,
            zones,
            gstClassifications,
            salesCountry,
            freightTermsOptions
        } = await dropDownOptions(company);
        let dropdownCheck = [
            {
                key: "customerCurrency",
                options: currenciesOptions
            },
            {
                key: "customerCategory",
                options: customerCategories?.map(x => {
                    return {
                        label: x.category,
                        value: x.category
                    };
                })
            },
            {
                key: "customerPaymentTerms",
                options: paymentTermsOptions
            },
            {
                key: "region",
                options: zones
            },
            {
                key: "state",
                options: statesJson
            },
            {
                key: "GSTClassification",
                options: gstClassifications
            },
            {
                key: "country",
                options: salesCountry
            },
            {
                key: "freightTerms",
                options: freightTermsOptions
            }
        ];
        for await (const x of customerData) {
            const isExports = await checkExportsCustomer(x.categoryType);
            x.isValid = true;
            x.message = null;
            for (const ele of Object.values(column)) {
                if (!(isExports && ["GSTIN", "GSTClassification"].includes(ele))) {
                    if (requiredFields.includes(ele) && falseArr.includes(x[ele])) {
                        x.isValid = false;
                        x.message = validationJson[ele] ?? `${ele} is Required`;
                        break;
                    }
                }
                for (const dd of dropdownCheck) {
                    if (!(isExports && ["state", "GSTClassification"].includes(dd.key))) {
                        if (ele == dd.key && !dd.options.map(values => values.value).includes(x[ele])) {
                            x.isValid = false;
                            x.message = `${ele} is Invalid Value & Value Must be ${dd.options.map(
                                values => values.value
                            )}`;
                            break;
                        }
                    }
                }
                for (const ele of customersOptions) {
                    if (ele.customerName == x["customerName"]) {
                        x.isValid = false;
                        x.message = `${x["customerName"]}  already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = customerData.filter(x => !x.isValid);
        const validRecords = customerData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertCustomersByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        const getAcronym = function (str) {
            return str
                ?.split(" ")
                ?.map(word => word[0])
                ?.join("");
            // ?.toUpperCase();
        };
        for (let i = 0; i < jsonData.length; i++) {
            const ele = jsonData[i];
            if (!!ele.pinCode && ele.pinCode.length > 1) {
                let numberValue = String(ele.pinCode).replaceAll(".", "").replaceAll(" ", "");
                ele.pinCode = +numberValue;
            } else {
                ele.pinCode = null;
            }
            ele.customerName = ele?.customerNameLegalEntity;
            ele.customerNickName = getAcronym(ele?.customerNameLegalEntity);
            if (ele?.plantName) {
                ele.customerName = `${ele?.customerName} - ${ele?.plantName}`;
            }
            if (ele?.plantCode) {
                ele.customerName = `${ele?.customerName} [${ele?.plantCode}]`;
            }
        }
        let customerData = jsonData.map(x => {
            const {
                line1,
                line2,
                line3,
                country,
                state,
                city,
                district,
                pinCode,

                contactPersonName,
                contactPersonDesignation,
                contactPersonDepartment,
                contactPersonNumber,
                contactPersonEmail,
                ...rest
            } = x;
            let address = {
                line1,
                line2,
                line3,
                country,
                state,
                city,
                district: city,
                pinCode,
                contactPersonName: rest.customerName
            };
            let contactInfo = {
                contactPersonName,
                contactPersonDesignation,
                contactPersonDepartment,
                contactPersonNumber,
                contactPersonEmail
            };
            rest.customerBillingAddress = [address];
            rest.customerShippingAddress = [address];
            rest.customerContactInfo = [contactInfo];
            rest.company = company;
            rest.createdBy = createdBy;
            rest.updatedBy = updatedBy;
            let regex = /exports/i;
            if (regex.test(rest.customerCategory)) {
                delete rest.customerPAN;
                delete rest.GSTIN;
                delete rest.region;
                delete rest.GSTClassification;
            }
            return rest;
        });
        for await (const obj of customerData) {
            await CustomerRepository.createDoc(obj);
        }
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

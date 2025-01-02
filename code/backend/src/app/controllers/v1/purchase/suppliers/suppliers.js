const Model = require("../../../../models/purchase/supplierModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    removeFile,
    removeSingleFileInError,
    getIncrementNumWithPrefix,
    checkDomesticCustomer,
    checkImports
} = require("../../../../helpers/utility");
const {OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
const statesJson = require("../../../../mocks/states.json");
const {getAllPaymentTerms} = require("../../sales/paymentTerms/paymentTerms");
const {
    getAllSupplierAttributes,
    getAllSupplierExcelAttributes,
    getAllSupplierReportsAttributes
} = require("../../../../models/purchase/helpers/supplierHelper");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getAndSetAutoIncrementNo, getNextAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {SUPPLIER} = require("../../../../mocks/schemasConstant/purchaseConstant");
const SupplierRepository = require("../../../../models/purchase/repository/supplierRepository");
const {SUPPLIER_OPTIONS} = require("../../../../mocks/dropDownOptions");
const AutoIncrementRepository = require("../../../../models/settings/repository/autoIncrementRepository");
const {filteredCurrencyMasterList} = require("../../../../models/settings/repository/currencyMasterRepository");
const {
    getAllSupplierCategory,
    setSupplierNextAutoIncrementNo
} = require("../../settings/supplierCategory/supplierCategory");
const {SALES_CATEGORY} = require("../../../../mocks/constantData");
const {SupplierJSON} = require("./constantFile");
const SupplierCategoryRepository = require("../../../../models/settings/repository/supplierCategoryRepository");

// @route   GET /purchase/suppliers/getAll
exports.getAll = async (req, res) => {
    try {
        let project = getAllSupplierAttributes();
        if (req.query.excel == "true") {
            project = getAllSupplierExcelAttributes();
        }
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    supplierCode: {$ne: "S0000"}
                }
            },
            {
                $addFields: {
                    supplierBankDetails: {$first: "$supplierBankDetails"},
                    supplierContactMatrix: {$first: "$supplierContactMatrix"},
                    supplierBillingAddress: {$first: "$supplierBillingAddress"}
                }
            }
        ];
        let rows = await SupplierRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllSuppliers", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.create = async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        if (createdObj.supplierBillingAddress) {
            createdObj.supplierBillingAddress = JSON.parse(createdObj.supplierBillingAddress);
        }
        if (createdObj.supplierShippingAddress) {
            createdObj.supplierShippingAddress = JSON.parse(createdObj.supplierShippingAddress);
        }
        if (createdObj.supplierAddress) {
            createdObj.supplierAddress = JSON.parse(createdObj.supplierAddress);
        }
        if (createdObj.supplierContactMatrix) {
            createdObj.supplierContactMatrix = JSON.parse(createdObj.supplierContactMatrix);
        }
        if (createdObj.supplierBankDetails) {
            createdObj.supplierBankDetails = JSON.parse(createdObj.supplierBankDetails);
        }
        if (req.file) {
            if (req.file.filename) {
                createdObj["cpaFile"] = req.file.filename;
            }
        }
        const itemDetails = await SupplierRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Supplier")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Suppliers", e);
        if (req.file) {
            removeSingleFileInError(req.file);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.update = async (req, res) => {
    try {
        let itemDetails = await SupplierRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        if (req.body.supplierBillingAddress) {
            req.body.supplierBillingAddress = JSON.parse(req.body.supplierBillingAddress);
        }
        if (req.body.supplierShippingAddress) {
            req.body.supplierShippingAddress = JSON.parse(req.body.supplierShippingAddress);
        }
        if (req.body.supplierAddress) {
            req.body.supplierAddress = JSON.parse(req.body.supplierAddress);
        }
        if (req.body.supplierContactMatrix) {
            req.body.supplierContactMatrix = JSON.parse(req.body.supplierContactMatrix);
        }
        if (req.body.supplierBankDetails) {
            req.body.supplierBankDetails = JSON.parse(req.body.supplierBankDetails);
        }
        if (req.file && req.file.filename) {
            if (itemDetails.cpaFile) {
                removeFile(`${req.file.destination}/${itemDetails.cpaFile}`);
            }
            req.body.cpaFile = req.file.filename;
        }
        itemDetails = await SupplierRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Supplier has been")
        });
    } catch (e) {
        console.error("update Suppliers", e);
        if (req.file) {
            removeSingleFileInError(req.file);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

// @route   PUT /purchase/suppliers/delete/:id
exports.deleteById = async (req, res) => {
    try {
        const deleteItem = await SupplierRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Supplier")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Supplier");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Suppliers", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

// @route   GET /purchase/suppliers/getById/:id
exports.getById = async (req, res) => {
    try {
        let existing = await SupplierRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Supplier");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Suppliers", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

// @route   GET /purchase/suppliers/getAllMasterData
exports.getAllMasterData = async (req, res) => {
    try {
        const options = await dropDownOptions(req.user.company);
        let autoIncValues = {};
        if (options.supplierCategories.length > 0) {
            for (const ele of options.supplierCategories) {
                autoIncValues[ele.category] = getIncrementNumWithPrefix({
                    modulePrefix: ele.prefix,
                    autoIncrementValue: ele.nextAutoIncrement,
                    digit: ele.digit
                });
            }
            options.supplierCategories = options.supplierCategories.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            });
        } else {
            const purchaseTypesOptions = await getAllModuleMaster(req.user.company, "PURCHASE_TYPE");
            options.supplierCategories = purchaseTypesOptions?.map(x => x.value);
            for (const ele of options.supplierCategories) {
                autoIncValues[ele] = await getAndSetAutoIncrementNo(
                    {...SUPPLIER.AUTO_INCREMENT_DATA()},
                    req.user.company
                );
            }
            options.supplierCategories = await Promise.all(
                options.supplierCategories.map(async ele => {
                    const isDomestic = await checkDomesticCustomer(ele);
                    return {
                        category: ele,
                        categoryType: isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.IMPORTS
                    };
                })
            );
        }

        return res.success({
            autoIncValues,
            ...options
        });
    } catch (error) {
        console.error("getAllMasterData Suppliers", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
const dropDownOptions = async company => {
    try {
        const paymentTermsOptions = await getAllPaymentTerms(company);
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
        const supplierCategories = await getAllSupplierCategory(company);
        const freightTermsOptions = await getAllModuleMaster(company, "FREIGHT_TERMS");
        const purchaseCountryOptions = await getAllModuleMaster(company, "PURCHASE_COUNTRY");
        const supplierTypeOptions = await getAllModuleMaster(company, "SUPPLIER_TYPE");
        const zonesOptions = await getAllModuleMaster(company, "REGION_ZONES");
        return {
            purchaseCountryOptions,
            freightTermsOptions,
            supplierTypeOptions,
            supplierCategories,
            paymentTermsOptions: paymentTermsOptions.map(x => {
                return {
                    label: x.paymentDescription,
                    value: x.paymentDescription
                };
            }),
            currenciesOptions: currenciesOptions.map(x => {
                return {
                    label: x.currencyName,
                    value: x.currencyName
                };
            }),
            zonesOptions
        };
    } catch (error) {
        console.error(error);
    }
};
exports.getAllSuppliers = async (company, project = {}) => {
    try {
        let rows = await Model.find(
            {
                isSupplierActive: "A",
                company: company
            },
            project
        ).sort({supplierName: 1});
        return rows;
    } catch (e) {
        console.error("getAllSuppliers", e);
    }
};
exports.getAllSupplierCount = async company => {
    try {
        const result = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company),
                    isSupplierActive: "A"
                }
            },
            {
                $facet: {
                    domesticSupplierCount: [
                        {$match: {supplierPurchaseType: {$regex: /Domestic/i}}},
                        {
                            $group: {
                                _id: null,
                                counts: {$sum: 1}
                            }
                        }
                    ],
                    importSupplierCount: [
                        {$match: {supplierPurchaseType: {$regex: /Imports/i}}},
                        {
                            $group: {
                                _id: null,
                                counts: {$sum: 1}
                            }
                        }
                    ]
                }
            }
        ]);
        let obj = {
            domesticSupplierCount: result[0]?.domesticSupplierCount[0]?.counts || 0,
            importSupplierCount: result[0]?.importSupplierCount[0]?.counts || 0
        };
        return obj;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};
exports.getAllReports = async (req, res) => {
    try {
        const purchaseCategories = await getAllModuleMaster(req.user.company, "PURCHASE_TYPE");
        const {supplierPurchaseType = null, state = null, city = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!supplierPurchaseType && {
                supplierPurchaseType: supplierPurchaseType
            }),
            ...(!!state && {
                "supplierBillingAddress.state": {
                    $regex: `${state}`,
                    $options: "i"
                }
            }),
            ...(!!city && {
                "supplierBillingAddress.city": {
                    $regex: `${city}`,
                    $options: "i"
                }
            })
        };
        let project = getAllSupplierReportsAttributes();
        let pipeline = [
            {
                $addFields: {
                    supplierBillingAddress: {$first: "$supplierBillingAddress"}
                }
            },
            {$unwind: {path: "$supplierBillingAddress", preserveNullAndEmptyArrays: true}},
            {
                $match: query
            },
            {
                $addFields: {
                    supplierContactMatrix: {$first: "$supplierContactMatrix"}
                }
            },
            {$unwind: {path: "$supplierContactMatrix", preserveNullAndEmptyArrays: true}}
        ];
        let rows = await SupplierRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success({
            purchaseCategories,
            ...rows
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.checkSupplierValidation = async (supplierData, column, company) => {
    try {
        const suppliersOptions = await SupplierRepository.filteredSupplierList([
            {$match: {company: ObjectId(company), isSupplierActive: "A"}},
            {
                $project: {
                    _id: 1,
                    supplierName: 1,
                    supplierGST: 1
                }
            }
        ]);
        const requiredFields = ["supplierName", "supplierGST", "supplierPAN", "supplierPurchaseType"];
        const falseArr = OPTIONS.falsyArray;
        const MSME = SUPPLIER_OPTIONS.MSME_CLASSIFICATION;
        const GSTClassification = SUPPLIER_OPTIONS.GST_CLASSIFICATION;
        const accType = SUPPLIER_OPTIONS.ACCOUNT_TYPE;
        let {
            purchaseCountryOptions,
            paymentTermsOptions,
            currenciesOptions,
            freightTermsOptions,
            supplierCategories,
            zonesOptions
        } = await dropDownOptions(company);
        if (!supplierCategories?.length) {
            supplierCategories = await getAllModuleMaster(company, "PURCHASE_TYPE");
            supplierCategories = supplierCategories;
            // .map(ele => {
            //     return {
            //         label: ele,
            //         value: ele
            //     };
            // });
        } else {
            supplierCategories = supplierCategories.map(x => {
                return {
                    label: x.category,
                    value: x.category
                };
            });
        }
        let dropdownCheck = [
            {
                key: "supplierPurchaseType",
                options: supplierCategories
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
                key: "supplierCurrency",
                options: currenciesOptions
            },
            {
                key: "supplierPaymentTerms",
                options: paymentTermsOptions
            },
            {
                key: "supplierINCOTerms",
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
                options: accType
            }
        ];
        for await (const x of supplierData) {
            const isImports = await checkImports(x.supplierPurchaseType);
            x.isValid = true;
            x.message = null;
            for (const ele of Object.values(column)) {
                if (!(isImports && ["supplierPAN", "supplierGST"].includes(ele))) {
                    if (requiredFields.includes(ele) && falseArr.includes(x[ele])) {
                        x.isValid = false;
                        x.message = validationJson[ele] ?? `${ele} is Required`;
                        break;
                    }
                }
                for (const dd of dropdownCheck) {
                    if (!(isImports && ["state", "GSTClassification", "MSMEClassification"].includes(dd.key))) {
                        if (ele == dd.key && !dd.options.map(values => values.value).includes(x[ele])) {
                            x.isValid = false;
                            x.message = `${ele} is Invalid Value & Value Must be ${dd.options.map(
                                values => values.value
                            )}`;
                            break;
                        }
                    }
                }
                if (
                    await SupplierRepository.findOneDoc(
                        {
                            $or: [{supplierName: x["supplierName"]}, {supplierGST: x["supplierGST"]}]
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
                for (const ele of suppliersOptions) {
                    if (ele.supplierName == x["supplierName"] && ele.supplierGST == x["supplierGST"]) {
                        x.isValid = false;
                        x.message = `${x["supplierName"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = supplierData.filter(x => !x.isValid);
        const validRecords = supplierData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};
exports.bulkInsertSupplierByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        for (let i = 0; i < jsonData.length; i++) {
            const ele = jsonData[i];
            if (!!ele.pinCode && ele.pinCode.length > 1) {
                let numberValue = String(ele.pinCode).replaceAll(" ", "");
                ele.pinCode = +numberValue;
            } else {
                ele.pinCode = null;
            }
            if (!!ele.accountNumber && ele.accountNumber.length > 1) {
                let numberValue = String(ele.accountNumber).replaceAll(" ", "");
                ele.accountNumber = +numberValue;
            } else {
                ele.accountNumber = null;
            }
            if (!!ele.supplierContactPersonNumber && ele.supplierContactPersonNumber.length > 1) {
                let numberValue = String(ele.supplierContactPersonNumber).replaceAll(" ", "");
                ele.supplierContactPersonNumber = +numberValue;
            } else {
                ele.supplierContactPersonNumber = 0;
            }
        }
        // let supplierAutoIncrementObj = await getNextAutoIncrementNo({
        //     ...SUPPLIER.AUTO_INCREMENT_DATA(),
        //     company: company
        // });
        let supplierCategories = await getAllSupplierCategory(company);
        if (supplierCategories.length > 0) {
            supplierCategories = supplierCategories.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            });
        } else {
            const purchaseTypesOptions = await getAllModuleMaster(req.user.company, "PURCHASE_TYPE");
            supplierCategories = purchaseTypesOptions?.map(x => x.value);
            supplierCategories = await Promise.all(
                supplierCategories.map(async ele => {
                    const isDomestic = await checkDomesticCustomer(ele);
                    return {
                        category: ele,
                        categoryType: isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.IMPORTS
                    };
                })
            );
        }
        let supplierData = jsonData.map(x => {
            const {
                line1,
                line2,
                line3,
                country,
                state,
                district,
                pinCode,
                supplierContactPersonName,
                supplierContactPersonDesignation,
                supplierContactPersonNumber,
                supplierContactPersonEmail,
                supplierContactPersonDepartment,
                befName,
                bankName,
                accountNumber,
                accountType,
                bankIFSCCode,
                bankSwiftCode,
                ...rest
            } = x;
            let address = {
                line1,
                line2,
                line3,
                country,
                state,
                city: district,
                district,
                pinCode
            };
            rest.supplierBillingAddress = [address];
            rest.supplierShippingAddress = [address];
            rest.supplierContactMatrix = [
                {
                    supplierContactPersonName,
                    supplierContactPersonDesignation,
                    supplierContactPersonNumber,
                    supplierContactPersonEmail,
                    supplierContactPersonDepartment
                }
            ];
            rest.supplierBankDetails = [{befName, bankName, accountNumber, accountType, bankIFSCCode, bankSwiftCode}];
            // rest.supplierCode = getIncrementNumWithPrefix(supplierAutoIncrementObj);
            rest.categoryType = supplierCategories.find(y => y.category == rest.supplierPurchaseType)?.categoryType;
            rest.company = company;
            rest.createdBy = createdBy;
            rest.updatedBy = updatedBy;
            // supplierAutoIncrementObj.autoIncrementValue++;
            return rest;
        });

        for (const obj of supplierData) {
            await SupplierRepository.createDoc(obj);
        }
        // await SupplierRepository.insertManyDoc(supplierData);
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
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

exports.updateSupplierCategoryType = async () => {
    try {
        let suppliersList = await SupplierRepository.filteredSupplierList([
            {
                $match: {categoryType: {$exists: false}}
            },
            {
                $project: {
                    _id: 1,
                    supplierPurchaseType: 1
                }
            }
        ]);
        for await (const ele of suppliersList) {
            const isDomestic = await checkDomesticCustomer(ele.supplierPurchaseType);
            let updatedDoc = await SupplierRepository.findAndUpdateDoc(
                {_id: ele._id},
                {
                    $set: {
                        categoryType: isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.IMPORTS
                    }
                }
            );
        }
        console.log("Supplier Category Type Updated");
    } catch (error) {
        console.error("error", error);
    }
};

exports.bulkUploadSupplier = async companyId => {
    try {
        let bulkJSON = await SupplierRepository.filteredSupplierList([
            {$match: {company: ObjectId(companyId)}},
            {
                $project: {
                    supplierPurchaseType: 1,
                    supplierCode: 1,
                    _id: 1
                }
            }
        ]);
        for (const obj of bulkJSON) {
            const isDomestic = await checkDomesticCustomer(obj.supplierPurchaseType);
            obj.supplierPurchaseType = isDomestic
                ? SALES_CATEGORY.DOMESTIC_JOB_MANUFACTURER
                : SALES_CATEGORY.IMPORTS_GOODS_PROVIDER;
            let categoryList = await getAllSupplierCategory(companyId);
            if (categoryList?.length) {
                let category = categoryList.find(x => obj.supplierPurchaseType == x.category);
                if (!!category) {
                    obj.supplierCode = getIncrementNumWithPrefix({
                        modulePrefix: category.prefix,
                        autoIncrementValue: category.nextAutoIncrement,
                        digit: category.digit
                    });
                }
                await setSupplierNextAutoIncrementNo(obj.supplierPurchaseType);
            } else {
                obj.supplierCode = await getAndSetAutoIncrementNo({...SUPPLIER.AUTO_INCREMENT_DATA()}, companyId, true);
            }
            let output = await SupplierRepository.findAndUpdateDoc(
                {_id: obj._id},
                {
                    supplierCode: obj.supplierCode,
                    supplierPurchaseType: obj.supplierPurchaseType,
                    categoryType: isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.IMPORTS
                }
            );
            console.log("output", output);
        }
        console.log("Supplier Category Updated SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};

const bulkDataMigrateSupplier = async () => {
    try {
        let bulkJSON = SupplierJSON;
        let missingCat = [];
        await SupplierCategoryRepository.updateManyDoc({}, {nextAutoIncrement: 1});
        for (const obj of bulkJSON) {
            let supplierObj = await SupplierRepository.findOneDoc(
                {supplierCode: obj.supplierCode},
                {supplierPurchaseType: 1, supplierCode: 1, company: 1}
            );
            const isDomestic = await checkDomesticCustomer(obj.supplierPurchaseType);
            // console.log("obj", obj, isDomestic);
            if (supplierObj) {
                const categoryList = await getAllSupplierCategory(supplierObj.company);
                if (categoryList?.length) {
                    let category = categoryList.find(x => obj.supplierPurchaseType == x.category);
                    // console.log("category", category);
                    if (!!category) {
                        supplierObj.supplierPurchaseType = obj.supplierPurchaseType;
                        supplierObj.categoryType = isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.IMPORTS;
                        supplierObj.supplierCode = getIncrementNumWithPrefix({
                            modulePrefix: category.prefix,
                            autoIncrementValue: category.nextAutoIncrement,
                            digit: category.digit
                        });
                        await setSupplierNextAutoIncrementNo(supplierObj.supplierPurchaseType);
                    } else {
                        missingCat.push(obj.supplierPurchaseType);
                    }
                }
                console.log("supplierObj.supplierCode", supplierObj.supplierCode);
                let newData = await supplierObj.save();
                // console.log("new newData", newData);
            }
        }
        console.log("missingCat", missingCat);
        console.log("Supplier Category Migration SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};
// bulkDataMigrateSupplier().then(console.log("SUPPLIER"));

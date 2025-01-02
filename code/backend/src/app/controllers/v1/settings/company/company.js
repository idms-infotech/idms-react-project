const path = require("path");
const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/settings/companyModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {default: mongoose} = require("mongoose");
const {removeFile, removeFilesInError} = require("../../../../helpers/utility");
const {CONSTANTS} = require("../../../../../config/config");
const {getAllDepartments} = require("../department/department");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const fileHandler = require("../../../../utilities/fileHandler");
const excelJson = require("../../../../mocks/excelUploadColumn/index");
const {checkSupplierValidation, bulkInsertSupplierByCSV} = require("../../purchase/suppliers/suppliers");
const {bulkInsertItemsByCSV, checkItemsValidation} = require("../../purchase/items/items");
const {bulkInsertCustomersByCSV, checkCustomersValidation} = require("../../sales/customerMaster/customerMaster");
const {
    checkSKUDimensionValidation,
    bulkInsertSKUDimByCSV,
    checkSKUMaterialValidation,
    bulkInsertSKUMaterialByCSV,
    checkSKUInkValidation,
    bulkInsertSKUInkByCSV
} = require("../../sales/SKU/SKUAttributes");
const {
    bulkInsertInventoryByCSV,
    checkInventoryValidation,
    checkPPICInventoryValidation,
    bulkInsertPPICInventoryByCSV
} = require("../../stores/Inventory/Inventory");
const {checkSKUValidation, bulkInsertSKUByCSV} = require("../../sales/SKU/SKU");
const {
    checkFGINValidation,
    bulkInsertFGINByCSV
} = require("../../stores/finishedGoodsInwardEntry/finishedGoodsInwardEntry");
const {checkEmployeeValidation, bulkInsertEmployeeByCSV} = require("../../HR/employee/Employee");
const {checkAssetValidation, bulkInsertAssetByCSV} = require("../../finance/assetMaster/assetMaster");
const {
    checkSpecificationMasterValidation,
    bulkInsertSpecificationMasterByCSV
} = require("../../quality/specificationMaster/specificationMaster");
const {checkPurchaseHSNMasterValidation, bulkInsertPurchaseHSNMasterByCSV} = require("../../purchase/HSN/HSN");
const {bulkInsertPurchaseSACMasterByCSV, checkPurchaseSACMasterValidation} = require("../../purchase/SAC/SAC");
const {checkSalesHSNMasterValidation, bulkInsertSalesHSNMasterByCSV} = require("../../sales/salesHSN/salesHSN");
const {checkSalesSACMasterValidation, bulkInsertSalesSACMasterByCSV} = require("../../sales/salesSAC/salesSAC");
const {
    bulkInsertTransporterMasterByCSV,
    checkTransporterMasterValidation
} = require("../../sales/transporter/transporter");
const {
    bulkInsertPurchaseRegisterEntryByCSV,
    checkPurchaseRegisterEntryValidation
} = require("../../accounts/purchaseRegisterEntry/purchaseRegisterEntry");
const {
    checkJobWorkItemsValidation,
    bulkInsertJobWorkItemsByCSV
} = require("../../purchase/jobWorkItemMaster/jobWorkItemMaster");
const {
    checkRMSpecificationValidation,
    bulkInsertRMSpecificationByCSV
} = require("../../quality/rm-specification/rm-specification");
const {
    bulkInsertProdSpecificationByCSV,
    checkProdSpecificationValidation
} = require("../../quality/product-specification/product-specification");
const CompanyRepository = require("../../../../models/settings/repository/companyRepository");
const {
    checkLogisticsValidation,
    bulkInsertLogisticsByCSV
} = require("../../planning/logisticsProvider/logisticsProvider");
const {TEMPLATE} = require("../../../../mocks/constantData");
const {checkProdItemsValidation, bulkInsertProdItemsByCSV} = require("../../planning/prodItemMaster/prodItemMaster");
const {checkProdItemsInvValidation, bulkInsertProdItemsInvByCSV} = require("../../stores/Inventory/inventoryUpload");
const ObjectId = mongoose.Types.ObjectId;
exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {search = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(![undefined, null, ""].includes(search) && {$text: {$search: search}})
        };
        let rows = await getAllData(req, query);
        rows = JSON.parse(JSON.stringify(rows));
        for (const ele of rows[0].placesOfBusiness) {
            if (ele.SOPdfHeader) {
                ele.SOPdfHeaderUrl = CONSTANTS.domainUrl + "company/" + ele.SOPdfHeader;
            }
            if (ele.SOSignature) {
                ele.SOSignatureUrl = CONSTANTS.domainUrl + "company/" + ele.SOSignature;
            }
            if (ele.PISignature) {
                ele.PISignatureUrl = CONSTANTS.domainUrl + "company/" + ele.PISignature;
            }
            if (ele.TISignature) {
                ele.TISignatureUrl = CONSTANTS.domainUrl + "company/" + ele.TISignature;
            }
        }
        let count = await Model.countDocuments(query);
        let constitutionOfBusiness = await getAllModuleMaster(req.user.company, "CONSTITUTION_OF_BUSINESS");
        let compDepartments = await getAllDepartments(req.user.company, {
            label: "$departmentName",
            value: "$departmentName",
            _id: 0
        });
        let location = await getAllModuleMaster(req.user.company, "LOCATION");
        let GSTClassifications = await getAllModuleMaster(req.user.company, "GST_CLASSIFICATION");
        // let PODomestic = await findAppParameterValue("PO_DOMESTIC_TEMPLATE", req.user.company);
        // let POImport = await findAppParameterValue("PO_IMPORTS_TEMPLATE", req.user.company);
        // let PIDomestic = await findAppParameterValue("PI_DOMESTIC_TEMPLATE", req.user.company);
        // let PIExports = await findAppParameterValue("PI_EXPORTS_TEMPLATE", req.user.company);
        // let TIDomestic = await getAllModuleMaster(req.user.company, "TI_DOMESTIC_TEMPLATE");
        // let TIExports = await getAllModuleMaster(req.user.company, "TI_EXPORTS_TEMPLATE");
        // let companyType = await findAppParameterValue("COMPANY_TYPE", req.user.company);
        let companyType = await getAllModuleMaster(req.user.company, "COMPANY_TYPE");
        let currencies = await getAllModuleMaster(req.user.company, "CURRENCY");

        return res.success({
            constitutionOfBusiness,
            compDepartments: compDepartments,
            location,
            // template: template?.split(",")?.map(x => {
            //     return {
            //         label: x,
            //         value: x,
            //     };
            // }),
            PODomestic: TEMPLATE.PO_DOMESTIC_TEMPLATE,
            POImport: TEMPLATE.PO_IMPORTS_TEMPLATE,
            PIDomestic: TEMPLATE.PI_DOMESTIC_TEMPLATE,
            PIExports: TEMPLATE.PI_EXPORTS_TEMPLATE,
            TIDomestic: TEMPLATE.TI_DOMESTIC_TEMPLATE,
            TIExports: TEMPLATE.TI_EXPORTS_TEMPLATE,
            GSTClassifications,
            companyType,
            // companyType: companyType?.split(",")?.map(x => {
            //     return {
            //         label: x,
            //         value: x
            //     };
            // }),
            currencies,
            rows,
            count
        });
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            //  company: req.user.company,
            // createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        if (createdObj.companyAddress) {
            createdObj.companyAddress = JSON.parse(createdObj.companyAddress);
        }
        if (req.files) {
            if (req.files.LUTDocumentFile && req.files.LUTDocumentFile.length > 0) {
                createdObj.exportsDetails["LUTDocument"] = req.files.LUTDocumentFile[0].filename;
            }
            if (req.files.companyPdfHeaderFile && req.files.companyPdfHeaderFile.length > 0) {
                createdObj["companyPdfHeader"] = req.files.companyPdfHeaderFile[0].filename;
            }
            if (req.files.SOPdfHeaderFile && req.files.SOPdfHeaderFile.length > 0) {
                createdObj["SOPdfHeader"] = req.files.SOPdfHeaderFile[0].filename;
            }
            if (req.files.registerOfficePOHeaderFile && req.files.registerOfficePOHeaderFile.length > 0) {
                createdObj["registerOfficePOHeader"] = req.files.registerOfficePOHeaderFile[0].filename;
            }
            if (req.files.registerOfficeSOHeaderFile && req.files.registerOfficeSOHeaderFile.length > 0) {
                createdObj["registerOfficeSOHeader"] = req.files.registerOfficeSOHeaderFile[0].filename;
            }
            if (req.files.factoryPOHeaderFile && req.files.factoryPOHeaderFile.length > 0) {
                createdObj["factoryPOHeader"] = req.files.factoryPOHeaderFile[0].filename;
            }
            if (req.files.factorySOHeaderFile && req.files.factorySOHeaderFile.length > 0) {
                createdObj["factorySOHeader"] = req.files.factorySOHeaderFile[0].filename;
            }
            if (req.files.companySignatureFile && req.files.companySignatureFile.length > 0) {
                createdObj["companySignature"] = req.files.companySignatureFile[0].filename;
            }
            if (req.files.SOSignatureFile && req.files.SOSignatureFile.length > 0) {
                createdObj["SOSignature"] = req.files.SOSignatureFile[0].filename;
            }
            if (req.files.logoFile && req.files.logoFile.length > 0) {
                createdObj["logo"] = req.files.logoFile[0].filename;
            }
            if (req.files.landingPageHeaderFile && req.files.landingPageHeaderFile.length > 0) {
                createdObj["landingPageHeader"] = req.files.landingPageHeaderFile[0].filename;
            }
            if (req.files.welcomeInfoFile && req.files.welcomeInfoFile.length > 0) {
                createdObj["welcomeInfo"] = req.files.welcomeInfoFile[0].filename;
            }
            if (req.files.PISignatureFile && req.files.PISignatureFile.length > 0) {
                createdObj["PISignature"] = req.files.PISignatureFile[0].filename;
            }
            if (req.files.TISignatureFile && req.files.TISignatureFile.length > 0) {
                createdObj["TISignature"] = req.files.TISignatureFile[0].filename;
            }
        }
        const saveObj = new Model(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Company")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        if (req.files) {
            removeFilesInError(req.files.companyPdfHeaderFile);
            removeFilesInError(req.files.SOPdfHeaderFile);
            removeFilesInError(req.files.registerOfficePOHeaderFile);
            removeFilesInError(req.files.registerOfficeSOHeaderFile);
            removeFilesInError(req.files.factoryPOHeaderFile);
            removeFilesInError(req.files.factorySOHeaderFile);
            removeFilesInError(req.files.companySignatureFile);
            removeFilesInError(req.files.SOSignatureFile);
            removeFilesInError(req.files.logoFile);
            removeFilesInError(req.files.landingPageHeaderFile);
            removeFilesInError(req.files.welcomeInfoFile);
            removeFilesInError(req.files.PISignatureFile);
            removeFilesInError(req.files.TISignatureFile);
        }
        res.serverError(errors);
        console.error(e);
    }
});
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await CompanyRepository.getDocById(req.params.id);

        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        if (req.body.contactInfo) {
            req.body.contactInfo = JSON.parse(req.body.contactInfo);
        }

        if (req.body.placesOfBusiness) {
            req.body.placesOfBusiness = JSON.parse(req.body.placesOfBusiness);
        }
        if (req.body.exportsDetails) {
            req.body.exportsDetails = JSON.parse(req.body.exportsDetails);
        }
        if (req.body.companyBillingAddress) {
            req.body.companyBillingAddress = JSON.parse(req.body.companyBillingAddress);
        }
        if (req.body.accountsDetails) {
            req.body.accountsDetails = JSON.parse(req.body.accountsDetails);
        }
        if (req.files) {
            if (req.files.companyPdfHeaderFile && req.files.companyPdfHeaderFile.length > 0) {
                if (itemDetails.companyPdfHeader) {
                    removeFile(`${req.files.companyPdfHeaderFile[0].destination}/${itemDetails.companyPdfHeader}`);
                }
                req.body.companyPdfHeader = req.files.companyPdfHeaderFile[0].filename;
            }
            if (req.files.LUTDocumentFile && req.files.LUTDocumentFile.length > 0) {
                if (itemDetails.exportsDetails.LUTDocument) {
                    removeFile(`${req.files.LUTDocumentFile[0].destination}/${itemDetails.exportsDetails.LUTDocument}`);
                }
                req.body.exportsDetails.LUTDocument = req.files.LUTDocumentFile[0].filename;
            }
            if (req.files.SOPdfHeaderFile && req.files.SOPdfHeaderFile.length > 0) {
                if (itemDetails.SOPdfHeader) {
                    removeFile(`${req.files.SOPdfHeaderFile[0].destination}/${itemDetails.SOPdfHeader}`);
                }
                req.body.SOPdfHeader = req.files.SOPdfHeaderFile[0].filename;
            }
            if (req.files.registerOfficePOHeaderFile && req.files.registerOfficePOHeaderFile.length > 0) {
                if (itemDetails.registerOfficePOHeader) {
                    removeFile(
                        `${req.files.registerOfficePOHeaderFile[0].destination}/${itemDetails.registerOfficePOHeader}`
                    );
                }
                req.body.registerOfficePOHeader = req.files.registerOfficePOHeaderFile[0].filename;
            }
            if (req.files.registerOfficeSOHeaderFile && req.files.registerOfficeSOHeaderFile.length > 0) {
                if (itemDetails.registerOfficeSOHeader) {
                    removeFile(
                        `${req.files.registerOfficeSOHeaderFile[0].destination}/${itemDetails.registerOfficeSOHeader}`
                    );
                }
                req.body.registerOfficeSOHeader = req.files.registerOfficeSOHeaderFile[0].filename;
            }
            if (req.files.factoryPOHeaderFile && req.files.factoryPOHeaderFile.length > 0) {
                if (itemDetails.factoryPOHeader) {
                    removeFile(`${req.files.factoryPOHeaderFile[0].destination}/${itemDetails.factoryPOHeader}`);
                }
                req.body.factoryPOHeader = req.files.factoryPOHeaderFile[0].filename;
            }
            if (req.files.factorySOHeaderFile && req.files.factorySOHeaderFile.length > 0) {
                if (itemDetails.factorySOHeader) {
                    removeFile(`${req.files.factorySOHeaderFile[0].destination}/${itemDetails.factorySOHeader}`);
                }
                req.body.factorySOHeader = req.files.factorySOHeaderFile[0].filename;
            }
            if (req.files.companySignatureFile && req.files.companySignatureFile.length > 0) {
                if (itemDetails.companySignature) {
                    removeFile(`${req.files.companySignatureFile[0].destination}/${itemDetails.companySignature}`);
                }
                req.body.companySignature = req.files.companySignatureFile[0].filename;
            }
            if (req.files.SOSignatureFile && req.files.SOSignatureFile.length > 0) {
                if (itemDetails.SOSignature) {
                    removeFile(`${req.files.SOSignatureFile[0].destination}/${itemDetails.SOSignature}`);
                }
                req.body.SOSignature = req.files.SOSignatureFile[0].filename;
            }
            if (req.files.logoFile && req.files.logoFile.length > 0) {
                if (itemDetails.logo) {
                    removeFile(`${req.files.logoFile[0].destination}/${itemDetails.logo}`);
                }
                req.body.logo = req.files.logoFile[0].filename;
            }
            if (req.files.landingPageHeaderFile && req.files.landingPageHeaderFile.length > 0) {
                if (itemDetails.landingPageHeader) {
                    removeFile(`${req.files.landingPageHeaderFile[0].destination}/${itemDetails.landingPageHeader}`);
                }
                req.body.landingPageHeader = req.files.landingPageHeaderFile[0].filename;
            }
            if (req.files.welcomeInfoFile && req.files.welcomeInfoFile.length > 0) {
                if (itemDetails.welcomeInfo) {
                    removeFile(`${req.files.welcomeInfoFile[0].destination}/${itemDetails.welcomeInfo}`);
                }
                req.body.welcomeInfo = req.files.welcomeInfoFile[0].filename;
            }
        }
        itemDetails = await CompanyRepository.updateDoc(itemDetails, req.body);

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Company has been")
        });
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        if (req.files) {
            removeFilesInError(req.files.companyPdfHeaderFile);
            removeFilesInError(req.files.SOPdfHeaderFile);
            removeFilesInError(req.files.registerOfficePOHeaderFile);
            removeFilesInError(req.files.registerOfficeSOHeaderFile);
            removeFilesInError(req.files.factoryPOHeaderFile);
            removeFilesInError(req.files.factorySOHeaderFile);
            removeFilesInError(req.files.companySignatureFile);
            removeFilesInError(req.files.SOSignatureFile);
            removeFilesInError(req.files.logoFile);
            removeFilesInError(req.files.landingPageHeaderFile);
            removeFilesInError(req.files.welcomeInfoFile);
        }
        res.serverError(errors);
        console.error(e);
    }
});
exports.getCompanyURLs = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findOne(
            {},
            {
                _id: 0,
                logo: 1,
                landingPageHeader: 1,
                logoUrl: 1,
                welcomeInfo: 1,
                welcomeInfoUrl: 1
            }
        );
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Company");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Company");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});

const getAllData = asyncHandler(async (req, query, flag) => {
    try {
        const {page = 1, pageSize = 10, search = null, column = "createdAt", direction = -1} = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let rows = [];
        if (flag == "withP") {
            rows = await Model.find(query)
                .limit(+pageSize)
                .skip(+skip)
                .sort({[column]: direction});
        } else {
            rows = await Model.find(query).sort({[column]: direction});
        }
        return rows;
    } catch (e) {
        console.error(e);
    }
});

exports.getCompanyById = async (id, project = {}) => {
    try {
        let existing = await Model.findById(id, project).lean();
        return existing;
    } catch (e) {
        console.error(e);
    }
};
exports.getCompanyLocations = async id => {
    try {
        let existing = await Model.findById(id, {_id: 0, "placesOfBusiness.locationID": 1});
        return [...new Set(existing.placesOfBusiness.map(x => x.locationID))].join(",");
    } catch (e) {
        console.error(e);
    }
};
exports.getCompanyLocationsWithGST = async id => {
    try {
        let existing = await Model.findById(id, {
            _id: 0,
            "placesOfBusiness.locationID": 1,
            "placesOfBusiness.GSTINForAdditionalPlace": 1
        });
        return existing.placesOfBusiness;
    } catch (e) {
        console.error(e);
    }
};

exports.getAllCompanyLocationCount = async () => {
    try {
        const result = await Model.aggregate([
            {
                $project: {
                    count: {$add: [{$cond: ["$placesOfBusiness", {$size: "$placesOfBusiness"}, 0]}, 1]}
                }
            }
        ]);
        return result[0]?.count || 0;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};

exports.uploadSOSignPDF = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        if (req.files) {
            let destination = "";
            for (const ele of itemDetails.placesOfBusiness) {
                if (req.files["newSOSignatureFile"] && req.files["newSOSignatureFile"].length > 0) {
                    if (ele._id == req.body.locationId) {
                        if (ele.SOSignature) {
                            console.log("----------------");
                            destination = path.join(__dirname, `/../../../../../assets/company/${ele.SOSignature}`);
                            removeFile(destination);
                        }
                        ele["SOSignature"] = req.files["newSOSignatureFile"][0].filename;
                    }
                }
                if (req.files.newSOPdfHeaderFile && req.files.newSOPdfHeaderFile.length > 0) {
                    if (ele._id == req.body.locationId) {
                        if (ele.SOPdfHeader) {
                            destination = path.join(__dirname, `/../../../../../assets/company/${ele.SOPdfHeader}`);
                            removeFile(destination);
                        }
                        ele.SOPdfHeader = req.files.newSOPdfHeaderFile[0].filename;
                    }
                }
                if (req.files.PISignatureFile && req.files.PISignatureFile.length > 0) {
                    if (ele._id == req.body.locationId) {
                        if (ele.PISignature) {
                            destination = path.join(__dirname, `/../../../../../assets/company/${ele.PISignature}`);
                            removeFile(destination);
                        }
                        ele.PISignature = req.files.PISignatureFile[0].filename;
                    }
                }
                if (req.files.DCSignatureFile && req.files.DCSignatureFile.length > 0) {
                    if (ele._id == req.body.locationId) {
                        if (ele.DCSignature) {
                            destination = path.join(__dirname, `/../../../../../assets/company/${ele.DCSignature}`);
                            removeFile(destination);
                        }
                        ele.DCSignature = req.files.DCSignatureFile[0].filename;
                    }
                }
                if (req.files.TISignatureFile && req.files.TISignatureFile.length > 0) {
                    if (ele._id == req.body.locationId) {
                        if (ele.TISignature) {
                            destination = path.join(__dirname, `/../../../../../assets/company/${ele.TISignature}`);
                            removeFile(destination);
                        }
                        ele.TISignature = req.files.TISignatureFile[0].filename;
                    }
                }
            }
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
        itemDetails = await itemDetails.save();
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("SO PDF and Signature has been")
        });
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        if (req.files) {
            removeFilesInError(req.files.newSOSignatureFile);
            removeFilesInError(req.files.newSOPdfHeaderFile);
            removeFilesInError(req.files.PISignatureFile);
            removeFilesInError(req.files.TISignatureFile);
        }
        console.error(e);
    }
});

exports.getCompanyId = async () => {
    try {
        const company = await Model.findOne({}, {_id: 1});
        return company._id;
    } catch (e) {
        console.error(e);
    }
};

exports.uploadAndCheckCSVFile = async (req, res) => {
    try {
        let fname = req.file.filename;
        let fileType = req.file.filename.split(".").pop();
        if (fileType != "csv") {
            return res.serverError("Please upload a CSV file only.");
        }
        let rows = [];
        let jsonData = await fileHandler.readExcelIntoJson(fname, excelJson[req.body.collectionName]);
        let validationFunctions = {
            Supplier: checkSupplierValidation,
            Items: checkItemsValidation,
            Customer: checkCustomersValidation,
            SKUMaster: checkSKUValidation,
            FGIN: checkFGINValidation,
            Employee: checkEmployeeValidation,
            Asset: checkAssetValidation,
            SKUDimensions: checkSKUDimensionValidation,
            SKUMaterial: checkSKUMaterialValidation,
            SKUInk: checkSKUInkValidation,
            SpecificationMaster: checkSpecificationMasterValidation,
            HSN: checkPurchaseHSNMasterValidation,
            SAC: checkPurchaseSACMasterValidation,
            SaleHSN: checkSalesHSNMasterValidation,
            SaleSAC: checkSalesSACMasterValidation,
            Transporter: checkTransporterMasterValidation,
            PurchaseRegisterEntry: checkPurchaseRegisterEntryValidation,
            JobWorkItemMaster: checkJobWorkItemsValidation,
            PPICInventoryCorrection: checkPPICInventoryValidation,
            RMSpecification: checkRMSpecificationValidation,
            ProductSpecification: checkProdSpecificationValidation,
            LogisticsMaster: checkLogisticsValidation,
            ProductionItem: checkProdItemsValidation,
            ProdItemsInventory: checkProdItemsInvValidation
        };
        const validationFunction = validationFunctions[req.body.collectionName];
        if (req.body.collectionName == "InventoryCorrection") {
            rows = await checkInventoryValidation(jsonData);
        } else if (validationFunction) {
            rows = await validationFunction(jsonData, excelJson[req.body.collectionName], req.user.company);
        }
        return res.success(rows);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        throw new Error(e);
    }
};

exports.bulkInsertByCSVFile = async (req, res) => {
    try {
        let rows = [];
        let insertFunctions = {
            Supplier: bulkInsertSupplierByCSV,
            Items: bulkInsertItemsByCSV,
            Customer: bulkInsertCustomersByCSV,
            InventoryCorrection: bulkInsertInventoryByCSV,
            SKUMaster: bulkInsertSKUByCSV,
            FGIN: bulkInsertFGINByCSV,
            Employee: bulkInsertEmployeeByCSV,
            Asset: bulkInsertAssetByCSV,
            SKUDimensions: bulkInsertSKUDimByCSV,
            SKUMaterial: bulkInsertSKUMaterialByCSV,
            SKUInk: bulkInsertSKUInkByCSV,
            SpecificationMaster: bulkInsertSpecificationMasterByCSV,
            HSN: bulkInsertPurchaseHSNMasterByCSV,
            SAC: bulkInsertPurchaseSACMasterByCSV,
            SaleHSN: bulkInsertSalesHSNMasterByCSV,
            SaleSAC: bulkInsertSalesSACMasterByCSV,
            Transporter: bulkInsertTransporterMasterByCSV,
            PurchaseRegisterEntry: bulkInsertPurchaseRegisterEntryByCSV,
            JobWorkItemMaster: bulkInsertJobWorkItemsByCSV,
            PPICInventoryCorrection: bulkInsertPPICInventoryByCSV,
            RMSpecification: bulkInsertRMSpecificationByCSV,
            ProductSpecification: bulkInsertProdSpecificationByCSV,
            LogisticsMaster: bulkInsertLogisticsByCSV,
            ProductionItem: bulkInsertProdItemsByCSV,
            ProdItemsInventory: bulkInsertProdItemsInvByCSV
        };

        const insertFunction = insertFunctions[req.body.collectionName];
        if (req.body.collectionName == "InventoryCorrection") {
            rows = await bulkInsertInventoryByCSV(req.body.validRecords, {});
        } else if (insertFunction) {
            rows = await insertFunction(req.body.validRecords, {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub
            });
        }
        return res.success(rows);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        throw new Error(e);
    }
};

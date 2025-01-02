const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getAllSKUCategory} = require("../../settings/SKUCategoryMaster/SKUCategoryMaster");
const {getAllProductSpecificationAttributes} = require("../../../../models/quality/helpers/productSpecificationHelper");
const {default: mongoose} = require("mongoose");
const {getAndSetAutoIncrementNo, getNextAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {PRODUCT_SPECIFICATION} = require("../../../../mocks/schemasConstant/qualityConstant");
const {filteredSpecificationList} = require("../../../../models/quality/repository/specificationRepository");
const ProductSpecificationRepository = require("../../../../models/quality/repository/productSpecificationRepository");
const {filteredProductCategoryMasterList} = require("../../../../models/settings/repository/productCategoryRepository");
const SKUMasterRepository = require("../../../../models/sales/repository/SKUMasterRepository");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {getIncrementNumWithPrefix} = require("../../../../helpers/utility");
const AutoIncrementRepository = require("../../../../models/settings/repository/autoIncrementRepository");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const customerOptions = await filteredCustomerList([
            {$match: {company: ObjectId(req.user.company), isCustomerActive: "A"}},
            {$sort: {customerName: 1}},
            {
                $project: {
                    customerName: 1
                }
            }
        ]);
        const {customer = null} = req.query;
        let project = getAllProductSpecificationAttributes();
        let query = {
            company: ObjectId(req.user.company),
            ...(!!customer && {
                "customerInfo.customer": ObjectId(customer)
            })
        };
        let pipeline = [
            // {
            //     $match: {
            //         company: ObjectId(req.user.company)
            //     }
            // },
            {
                $match: query
            },
            {
                $lookup: {
                    from: "ProductSpecification",
                    localField: "_id",
                    foreignField: "SKU",
                    pipeline: [
                        {
                            $project: {
                                status: 1
                            }
                        }
                    ],
                    as: "productSpecification"
                }
            },
            {
                $unwind: {
                    path: "$productSpecification",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        let rows = await SKUMasterRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        let totalAmounts = await SKUMasterRepository.filteredSKUMasterList([
            {$match: {company: ObjectId(req.user.company), isActive: "A"}},
            {
                $group: {
                    _id: null,
                    itemId: {$first: "$_id"},
                    activeSKUCount: {$sum: 1}
                }
            },
            {
                $lookup: {
                    from: "ProductSpecification",
                    pipeline: [
                        {
                            $group: {
                                _id: null,
                                createdCount: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.ACTIVE]}, 1, 0]}}
                            }
                        }
                    ],
                    as: "productSpecification"
                }
            },
            {
                $unwind: {
                    path: "$productSpecification",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    totalActiveSKU: "$activeSKUCount",
                    totalCreatedSKU: "$productSpecification.createdCount",
                    totalPendingSKU: {$subtract: ["$activeSKUCount", "$productSpecification.createdCount"]}
                }
            }
        ]);
        return res.success({...rows, totalAmounts, customerOptions});
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    create Product Specification new Record
// @route   POST /quality/inspectionParameter/create
exports.create = asyncHandler(async (req, res) => {
    try {
        let existingUser = await ProductSpecificationRepository.findOneDoc({
            SKUNo: req.body.SKUNo
        });
        if (existingUser) {
            let errors = "Product Specification already exists with this same SKUNo";
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await ProductSpecificationRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Product Specification")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Product Specification", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update Product Specification  Record
// @route   PUT /quality/inspectionParameter/update/:id
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ProductSpecificationRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await ProductSpecificationRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Product Specification has been")
        });
    } catch (e) {
        console.error("update Product Specification", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById Product Specification Record
// @route   PUT /quality/inspectionParameter/delete/:id
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await ProductSpecificationRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Product Specification")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Product Specification");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Product Specification", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById Product Specification Record
// @route   GET /quality/inspectionParameter/getById/:id
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await ProductSpecificationRepository.filteredProductSpecificationList([
            {
                $match: {
                    SKU: ObjectId(req.params.id)
                }
            },
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SKU",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $lookup: {
                                from: "Customer",
                                localField: "customerInfo.customer",
                                foreignField: "_id",
                                pipeline: [{$project: {customerCode: 1, customerName: 1}}],
                                as: "customerInfo"
                            }
                        },
                        {
                            $project: {
                                customerInfo: 1
                            }
                        }
                    ],
                    as: "SKUInfo"
                }
            },
            {$unwind: "$SKUInfo"},
            {
                $project: {
                    productSpecificationCode: 1,
                    productCategory: 1,
                    SKU: 1,
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    UOM: 1,
                    specificationInfo: 1,
                    status: 1,
                    customerDetails: {
                        $map: {
                            input: {$range: [0, {$size: "$SKUInfo.customerInfo"}]},
                            as: "index",
                            in: {
                                SN: {$add: ["$$index", 1]},
                                customerCode: {$arrayElemAt: ["$SKUInfo.customerInfo.customerCode", "$$index"]},
                                customerName: {$arrayElemAt: ["$SKUInfo.customerInfo.customerName", "$$index"]}
                            }
                        }
                    }
                }
            }
        ]);
        if (!existing.length) {
            existing = await SKUMasterRepository.filteredSKUMasterList([
                {
                    $match: {
                        _id: ObjectId(req.params.id)
                    }
                },
                {
                    $lookup: {
                        from: "Customer",
                        localField: "customerInfo.customer",
                        foreignField: "_id",
                        pipeline: [{$project: {customerCode: 1, customerName: 1}}],
                        as: "customerInfo"
                    }
                },
                {
                    $project: {
                        SKU: "$_id",
                        SKUNo: 1,
                        SKUName: 1,
                        SKUDescription: 1,
                        UOM: "$primaryUnit",
                        productCategory: "$productCategory",
                        customerDetails: {
                            $map: {
                                input: {$range: [0, {$size: "$customerInfo"}]},
                                as: "index",
                                in: {
                                    SN: {$add: ["$$index", 1]},
                                    customerCode: {$arrayElemAt: ["$customerInfo.customerCode", "$$index"]},
                                    customerName: {$arrayElemAt: ["$customerInfo.customerName", "$$index"]}
                                }
                            }
                        },
                        _id: 0
                    }
                }
            ]);
        }
        return res.success(existing.length ? existing[0] : {});
    } catch (e) {
        console.error("getById Product Specification", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData Product Specification Record
// @route   GET /quality/inspectionParameter/getAllMasterData
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const options = await dropDownOptions(req.user.company);
        let autoIncrementNo = await getAndSetAutoIncrementNo(
            PRODUCT_SPECIFICATION.AUTO_INCREMENT_DATA(),
            req.user.company
        );
        return res.success({autoIncrementNo, ...options});
    } catch (error) {
        console.error("getAllMasterData Product Specification", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const dropDownOptions = async company => {
    try {
        const specificationList = await filteredSpecificationList([
            {$match: {company: ObjectId(company), status: OPTIONS.defaultStatus.ACTIVE}},
            {$sort: {createdAt: -1}},
            {
                $project: {
                    seq: null,
                    specValue: null,
                    tolerance: null,
                    LTL: null,
                    UTL: null,
                    specificationCode: 1,
                    characteristic: 1,
                    UOM: 1,
                    testStandard: 1,
                    measuringInstrument: 1
                }
            }
        ]);
        const SKUCategoryList = await getAllSKUCategory(company, null);
        let productCategories = [];
        if (SKUCategoryList.length > 0) {
            productCategories = SKUCategoryList.map(x => {
                return {
                    label: x.displayProductCategoryName,
                    value: x.displayProductCategoryName,
                    application: x.application,
                    productNumber: x.SKUCategoryName,
                    productCode: x.productCode
                };
            });
        } else {
            productCategories = await filteredProductCategoryMasterList([
                {
                    $match: {
                        company: ObjectId(company),
                        categoryStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                },
                {$sort: {seq: 1}},
                {
                    $project: {
                        productNumber: 1,
                        productCode: 1,
                        displayProductCategoryName: 1,
                        application: 1
                    }
                }
            ]);
            productCategories = productCategories.map(x => {
                return {
                    label: x.displayProductCategoryName,
                    value: x.displayProductCategoryName,
                    application: x.application,
                    productNumber: x.productNumber,
                    productCode: x.productCode
                };
            });
        }
        const SKUOptions = await SKUMasterRepository.filteredSKUMasterList([
            {$match: {isActive: "A", company: ObjectId(company)}},
            {$sort: {createdAt: -1}},
            {$project: {SKUNo: 1, SKUName: 1, SKUDescription: 1, productCategory: 1, primaryUnit: 1, _id: 1}}
        ]);

        return {specificationList, productCategories, SKUOptions};
    } catch (error) {
        console.error(error);
    }
};
exports.getBySKUId = async (company, SKUId) => {
    try {
        let rows = await ProductSpecificationRepository.findOneDoc(
            {
                status: OPTIONS.defaultStatus.ACTIVE,
                company: company,
                SKU: SKUId
            },
            {specificationInfo: 1}
        );
        return rows;
    } catch (e) {
        console.error("getAllRM Specification", e);
    }
};

exports.checkProdSpecificationValidation = async (data, column, company) => {
    try {
        const specificationOptions = await ProductSpecificationRepository.filteredProductSpecificationList([
            {$match: {company: ObjectId(company), status: OPTIONS.defaultStatus.ACTIVE}},
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SKU",
                    foreignField: "_id",
                    pipeline: [{$project: {SKUNo: 1}}],
                    as: "SKU"
                }
            },
            {$unwind: "$SKU"},
            {$project: {SKUNo: "$SKU.SKUNo"}}
        ]);
        const requiredFields = [
            "productCategory",
            "SKUNo",
            "seq",
            "specificationCode",
            "specValue",
            "tolerance",
            "LTL",
            "UTL"
        ];
        const falseArr = OPTIONS.falsyArray;
        let {specificationList, productCategories, SKUOptions} = await dropDownOptions(company);
        let dropdownCheck = [
            {
                key: "specificationCode",
                options: specificationList.map(x => {
                    return {
                        label: x.specificationCode,
                        value: x.specificationCode
                    };
                })
            },
            {
                key: "productCategory",
                options: productCategories.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            },
            {
                key: "SKUNo",
                options: SKUOptions.map(x => {
                    return {
                        label: x.SKUNo,
                        value: x.SKUNo
                    };
                })
            }
        ];
        let unique = [];
        for await (const x of data) {
            x.isValid = true;
            x.message = null;
            if (unique.includes(x["SKUNo"])) {
                x.isValid = false;
                x.message = `${x["SKUNo"]} duplicate Entry`;
                break;
            }
            unique.push(x["SKUNo"]);
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
                    if (option.SKUNo == x["SKUNo"]) {
                        x.isValid = false;
                        x.message = `${x["SKUNo"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = data.filter(x => !x.isValid);
        const validRecords = data.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertProdSpecificationByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        const specificationList = await filteredSpecificationList([
            {$match: {company: ObjectId(company), status: OPTIONS.defaultStatus.ACTIVE}},
            {$sort: {createdAt: -1}},
            {
                $project: {
                    seq: null,
                    specValue: null,
                    tolerance: null,
                    LTL: null,
                    UTL: null,
                    specificationCode: 1,
                    characteristic: 1,
                    UOM: 1,
                    testStandard: 1,
                    measuringInstrument: 1
                }
            }
        ]);
        const SKUOptions = await SKUMasterRepository.filteredSKUMasterList([
            {$match: {isActive: "A", company: ObjectId(company)}},
            {$sort: {createdAt: -1}},
            {$project: {SKUNo: 1, SKUName: 1, SKUDescription: 1, productCategory: 1, primaryUnit: 1, _id: 1}}
        ]);
        let autoIncrementObj = await getNextAutoIncrementNo({
            ...PRODUCT_SPECIFICATION.AUTO_INCREMENT_DATA(),
            company: company
        });
        let data = jsonData.map(x => {
            const {seq, specificationCode, specValue, LTL, UTL, ...rest} = x;
            let SKUWiseData = jsonData.filter(y => y.SKUNo == rest.SKUNo);
            if (SKUWiseData.length) {
                SKUWiseData = SKUWiseData.map(SKU => {
                    let specificationObj = new Map(specificationList.map(ele => [ele.specificationCode, ele])).get(
                        SKU.specificationCode
                    );
                    return {
                        seq: SKU.seq,
                        specificationCode: SKU.specificationCode,
                        characteristic: specificationObj?.characteristic,
                        UOM: specificationObj?.UOM,
                        testStandard: specificationObj?.testStandard,
                        measuringInstrument: specificationObj?.measuringInstrument,
                        specValue: SKU.specValue,
                        LTL: SKU.LTL,
                        UTL: SKU.UTL
                    };
                });
            }
            let SKUObj = new Map(SKUOptions.map(ele => [ele.SKUNo, ele])).get(rest.SKUNo);
            rest.SKUNo = SKUObj.SKUNo;
            rest.SKUName = SKUObj.SKUName;
            rest.SKUDescription = SKUObj.SKUDescription;
            rest.UOM = SKUObj.primaryUnit;
            rest.specificationInfo = SKUWiseData;
            rest.productSpecificationCode = getIncrementNumWithPrefix(autoIncrementObj);
            rest.company = company;
            rest.createdBy = createdBy;
            rest.updatedBy = updatedBy;
            jsonData = jsonData.filter(data => data.SKUNo != rest.SKUNo);
            autoIncrementObj.autoIncrementValue++;
            return rest;
        });
        await ProductSpecificationRepository.insertManyDoc(data);
        await AutoIncrementRepository.findAndUpdateDoc(
            {
                module: PRODUCT_SPECIFICATION.MODULE,
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

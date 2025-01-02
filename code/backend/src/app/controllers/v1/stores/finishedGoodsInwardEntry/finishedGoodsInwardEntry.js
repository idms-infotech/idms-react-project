const Model = require("../../../../models/stores/FGINModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFiscalMonthsName
} = require("../../../../utilities/utility");
const FGINHelper = require("../../../../models/stores/helpers/FGINHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {FGIN_SCHEMA} = require("../../../../mocks/schemasConstant/storesConstant");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");
const FGINRepository = require("../../../../models/stores/repository/FGINRepository");
const {dateToAnyFormat} = require("../../../../helpers/dateTime");
const {filteredCompanyList} = require("../../../../models/settings/repository/companyRepository");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const ObjectId = mongoose.Types.ObjectId;
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
const UNIT_JSON = require("../../../../mocks/unit.json");
exports.getAll = async (req, res) => {
    try {
        const {productCategory = null} = req.query;
        let project = FGINHelper.getAllFGINAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    FGINQuantity: {$gt: 0}
                }
            },
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SKUId",
                    foreignField: "_id",
                    pipeline: [{$project: {productCategory: 1}}],
                    as: "SKUId"
                }
            },
            {$unwind: "$SKUId"},
            {
                $match: {
                    ...(!!productCategory && {
                        "SKUId.productCategory": productCategory
                    })
                }
            }
        ];
        let rows = await FGINRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
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
        const itemDetails = await FGINRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Finished Goods Inward Entry")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create   Finished Goods Inward Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
// @desc    update   FinishedGoodsInwardEntry  Record
exports.update = async (req, res) => {
    try {
        let itemDetails = await FGINRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await FGINRepository.updateDoc(itemDetails, req.body);

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Finished Goods Inward Entry")
        });
    } catch (e) {
        console.error("update   Finished Goods Inward Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.bulkCreate = async (req, res) => {
    try {
        for await (const element of req.body.FGINEntry) {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                FGINNo: req.body.FGINNo,
                location: req.body.location,
                FGINDate: req.body.FGINDate,
                ...element,
                producedQty: element.FGINQuantity
            };
            const saveObj = new Model(createdObj);
            await saveObj.save();
        }
        res.success({
            message: "Multiple FG Inventory created successfully"
        });
    } catch (e) {
        console.error("update FG Correction", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
exports.bulkUpdate = async (req, res) => {
    try {
        for await (const ele of req.body.FGINEntry) {
            let existing = await FGINRepository.getDocById(ele._id);
            if (existing) {
                existing.FGINQuantity = ele.FGINQuantity;
                existing.previousRecoQty = ele.previousRecoQty;
                existing.recoQtyPlusMinus = ele.recoQtyPlusMinus;
                existing.FGINDate = req.body.FGINDate;
                existing.entryAuthorizedBy = req.body.entryAuthorizedBy;
                existing.updatedBy = req.user.sub;
                await existing.save();
            }
        }
        res.success({
            message: "Multiple FG Inventory Updated successfully"
        });
    } catch (e) {
        console.error("update FG Correction", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

// @desc    deleteById   FinishedGoodsInwardEntry Record
exports.deleteById = async (req, res) => {
    try {
        const deleteItem = await FGINRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Finished Goods Inward Entry")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Finished Goods Inward Entry");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById   Finished Goods Inward Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

// @desc    getById   FinishedGoodsInwardEntry Record
exports.getById = async (req, res) => {
    try {
        let existing = await FGINRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Finished Goods Inward Entry");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById   Finished Goods Inward Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

// @desc    getAllMasterData   FinishedGoodsInwardEntry Record
exports.getAllMasterData = async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...FGIN_SCHEMA.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        const customersOptions = await filteredCustomerList([
            {$match: {company: ObjectId(req.user.company), isCustomerActive: "A"}},
            {$sort: {customerName: 1}},
            {
                $addFields: {
                    customerBillingAddress: {$arrayElemAt: ["$customerBillingAddress", 0]}
                }
            },
            {
                $project: {
                    customerName: 1,
                    customerCode: 1,
                    customerBillingState: "$customerBillingAddress.state",
                    customerBillingCity: "$customerBillingAddress.city",
                    customerBillingPinCode: "$customerBillingAddress.pinCode",
                    customerCategory: 1,
                    customerCurrency: 1
                }
            }
        ]);
        return res.success({
            autoIncrementNo,
            customersOptions: [
                {
                    _id: "",
                    customerName: "All"
                },
                ...customersOptions
            ]
        });
    } catch (error) {
        console.error("getAllMasterData   Finished Goods Inward Entry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
const dropDownOptions = async company => {
    try {
        const location = await filteredCompanyList([
            {
                $match: {
                    _id: ObjectId(company)
                }
            },
            {$unwind: "$placesOfBusiness"},
            {$group: {_id: null, locationIDs: {$addToSet: "$placesOfBusiness.locationID"}}},
            {
                $unwind: "$locationIDs"
            },
            {$project: {_id: 0, label: "$locationIDs", value: "$locationIDs"}}
        ]);
        return {
            location: location
        };
    } catch (error) {
        console.error("error", error);
    }
};
exports.getAllFGINMasterData = async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...FGIN_SCHEMA.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        const SKUMastersOptions = await filteredSKUMasterList([
            {$match: {company: ObjectId(req.user.company), isActive: "A"}},
            {$sort: {createdAt: -1}},
            {
                $project: {
                    label: "$SKUName",
                    skuNum: "$SKUNo",
                    value: "$_id",
                    skuDescription: "$SKUDescription",
                    uom: "$primaryUnit",
                    shelfLife: "$shelfLife",
                    _id: 0
                }
            }
        ]);
        return res.success({
            autoIncrementNo,
            SKUMastersOptions
        });
    } catch (error) {
        console.error("getAllMasterData   Finished Goods Inward Entry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
exports.getSKUListByCustomerId = async (req, res) => {
    try {
        const {customerId = null} = req.query;
        let SKUList = await filteredSKUMasterList([
            {
                $match: {company: ObjectId(req.user.company)}
            },
            {
                $addFields: {
                    customerInfo: {$first: "$customerInfo"}
                }
            },
            {
                $unwind: {
                    path: "$customerInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    ...(!!customerId && {"customerInfo.customer": ObjectId(customerId)})
                }
            },
            {
                $project: {
                    SKUId: "$_id",
                    _id: 0,
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    UOM: "$primaryUnit",
                    shelfLife: 1,
                    batchNo: "",
                    jobCardNo: "-",
                    productCategory: 1,
                    customerCurrency: "$customerInfo.customerCurrency",
                    partNo: "$customerInfo.customerPartNo",
                    expiryDate: {
                        $cond: [
                            {$and: ["$shelfLife", {$gt: ["$shelfLife", 0]}]},
                            {
                                $dateAdd: {
                                    startDate: "$$NOW",
                                    unit: "day",
                                    amount: {$multiply: ["$shelfLife", 30]}
                                }
                            },
                            null
                        ]
                    }
                }
            },
            {
                $sort: {
                    SKUNo: 1
                }
            }
        ]);
        return res.success({
            SKUList
        });
    } catch (error) {
        console.error("getAllMasterData   Finished Goods Inward Entry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAllFinishedGoodsInwardEntry = async (company, SKUId) => {
    try {
        let rows = await Model.find(
            {
                SKUId: SKUId,
                company: company,
                FGINQuantity: {$gt: 0}
            },
            {manufacturingDate: 1, FGINQuantity: 1}
        ).sort({createdAt: -1});
        return rows;
    } catch (e) {
        console.error("getAllFinishedGoodsInwardEntry", e);
    }
};

exports.getFGINBySKUId = async SKUId => {
    try {
        let existingFGIN = await Model.find(
            {
                SKUId: ObjectId(SKUId),
                FGINQuantity: {$gt: 0}
            },
            {
                _id: 1,
                FGINId: "$_id",
                FGINNo: 1,
                FGINQuantity: 1,
                expiryDate: 1,
                manufacturingDate: 1,
                FGExpiryDate: "$expiryDate",
                FGBatchDate: "$manufacturingDate",
                FGBatchNo: "$batchNo"
                // SKUId: 1,
                // batchNo: 1,
            }
        ).lean();
        return existingFGIN ?? [];
    } catch (e) {
        console.error("getFGINBySKUId   FinishedGoodsInwardEntry", e);
    }
};

exports.updateFGINQtyOnDRN = async (updatedBy, FGINId, Qty, DRNStatus) => {
    try {
        let FGIN = await FGINRepository.getDocById(FGINId);
        if (FGIN) {
            if (DRNStatus == "Created") {
                FGIN.FGINQuantity = +FGIN.FGINQuantity - +Qty;
                FGIN.previousDRNQty = Qty;
            } else {
                if (DRNStatus == OPTIONS.defaultStatus.REJECTED || DRNStatus == OPTIONS.defaultStatus.CANCELLED) {
                    FGIN.FGINQuantity = +FGIN.FGINQuantity + +Qty;
                    FGIN.previousDRNQty = 0;
                } else if (FGIN) {
                    FGIN.FGINQuantity = +FGIN.FGINQuantity + +FGIN.previousDRNQty - +Qty;
                    FGIN.previousDRNQty = Qty;
                }
            }
            FGIN.updatedBy = updatedBy;
            const updatedFGINDetails = await FGIN.save();
            return updatedFGINDetails;
        }
    } catch (error) {
        console.error("updateFGINQtyOnDRNCreate::::: Error in updating Sale Order ======= ", error);
    }
};

exports.getAllFGINEntriesCounts = async company => {
    try {
        const result = await FGINRepository.filteredFGINList([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$FGINDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    // status: {$in: ["Created"]},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    count: {$sum: 1}
                }
            },
            {
                $project: {
                    _id: 0,
                    count: 1
                }
            }
        ]);
        return result[0]?.count || 0;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};
exports.getAllMonthlyFGINTrends = async company => {
    try {
        const monthsArray = getFiscalMonthsName();
        let data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let result = await FGINRepository.filteredFGINList([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$FGINDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$FGINDate", 0, 7]}},
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {"_id.year_month": 1}
            },
            {
                $project: {
                    _id: 0,
                    count: 1,
                    month_year: {
                        $concat: [
                            {
                                $arrayElemAt: [
                                    monthsArray,
                                    {
                                        $subtract: [{$toInt: {$substrCP: ["$_id.year_month", 5, 2]}}, 4]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    data: {$push: {k: "$month_year", v: "$count"}}
                }
            },
            {
                $project: {
                    data: {$arrayToObject: "$data"},
                    _id: 0
                }
            }
        ]);
        if (result.length > 0) {
            const propertyNames = Object.keys(result[0].data);
            const propertyValues = Object.values(result[0].data);
            let n = 0;
            propertyNames.forEach(elem => {
                let index = monthsArray.indexOf(elem);
                data[index] = propertyValues[n].toFixed(2);
                n++;
            });

            monthlyFGINTrends = {months: monthsArray, orders: data};
        } else {
            monthlyFGINTrends = {months: monthsArray, orders: []};
        }
        return monthlyFGINTrends;
    } catch (error) {
        console.error(error);
    }
};

exports.updateFGINOnRenameBatch = async (SKUId, FGINId, newBatchDate) => {
    try {
        await Model.findOneAndUpdate(
            {
                _id: ObjectId(FGINId),
                SKUId: ObjectId(SKUId)
            },
            {manufacturingDate: new Date(newBatchDate)}
        );
    } catch (error) {
        console.error("updateFGINOnRenameBatch::::: Error in updating FGINData ======= ", error);
    }
};
exports.updateFGINOnQuantityCorrection = async (SKUId, FGINId, newFGINQuantity) => {
    try {
        await Model.findOneAndUpdate(
            {
                _id: ObjectId(FGINId),
                SKUId: ObjectId(SKUId)
            },
            {FGINQuantity: newFGINQuantity}
        );
    } catch (error) {
        console.error("updateFGINOnQuantityCorrection::::: Error in updating FGINData ======= ", error);
    }
};
exports.updateFGINOnBatchTransfer = async (SKUId, fromFGINId, toFGINId, transferQty) => {
    try {
        await Model.findOneAndUpdate(
            {
                _id: ObjectId(fromFGINId),
                SKUId: ObjectId(SKUId)
            },
            {$inc: {FGINQuantity: -transferQty}}
        );
        await Model.findOneAndUpdate(
            {
                _id: ObjectId(toFGINId),
                SKUId: ObjectId(SKUId)
            },
            {$inc: {FGINQuantity: transferQty}}
        );
    } catch (error) {
        console.error("updateFGINOnBatchTransfer::::: Error in updating FGINData ======= ", error);
    }
};

exports.checkFGINValidation = async (FGINData, column, company) => {
    try {
        const SKUOptions = await filteredSKUMasterList([
            {$match: {company: ObjectId(company), isActive: "A"}},
            {
                $project: {
                    _id: 0,
                    label: "$SKUNo",
                    value: "$SKUNo"
                }
            }
        ]);
        const requiredFields = ["FGINDate", "SKUName", "FGINQuantity", "batchNo", "manufacturingDate"];
        const falseArr = OPTIONS.falsyArray;
        let {location} = await dropDownOptions(company);
        let dropdownCheck = [
            {
                key: "location",
                options: location
            },
            {
                key: "UOM",
                options: UNIT_JSON
            },
            {
                key: "SKUNo",
                options: SKUOptions
            }
        ];
        for await (const x of FGINData) {
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
            }
        }
        const inValidRecords = FGINData.filter(x => !x.isValid);
        const validRecords = FGINData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertFGINByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        const SKUOptions = await filteredSKUMasterList([
            {$match: {company: ObjectId(company), isActive: "A"}},
            {
                $project: {
                    label: "$SKUNo",
                    value: "$_id"
                }
            }
        ]);
        let SKUOptionsMap = new Map(SKUOptions.map(x => [x.label, x.value]));
        let missingSKUNo = [];
        for (const ele of jsonData) {
            ele.SKUId = SKUOptionsMap.get(ele?.SKUNo?.trim());
            if (!ele.SKUNo || !ele.SKUId) {
                missingSKUNo.push(ele.SKUNo ? ele.SKUNo : ele.SKUName);
            }
        }
        let FGINData = jsonData.map(x => {
            x.company = company;
            x.createdBy = createdBy;
            x.updatedBy = updatedBy;
            x.producedQty = x.FGINQuantity;
            return x;
        });
        for await (const item of FGINData) {
            await FGINRepository.createDoc(item);
        }
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

exports.getSKUListForReco = async (req, res) => {
    try {
        const {customerId = null} = req.query;
        let SKUList = await FGINRepository.filteredFGINList([
            {
                $match: {company: ObjectId(req.user.company), FGINQuantity: {$gt: 0}}
            },
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SKUId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $addFields: {
                                customerInfo: {$first: "$customerInfo"}
                            }
                        },
                        {
                            $unwind: {
                                path: "$customerInfo",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {$project: {customer: "$customerInfo.customer"}}
                    ],
                    as: "SKUInfo"
                }
            },
            {$unwind: "$SKUInfo"},
            {
                $match: {
                    ...(!!customerId && {"SKUInfo.customer": ObjectId(customerId)})
                }
            },
            {
                $project: {
                    _id: 1,
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    partNo: 1,
                    UOM: 1,
                    manufacturingDate: {$dateToString: {format: "%d-%m-%Y", date: "$manufacturingDate"}},
                    previousRecoQty: "$FGINQuantity",
                    recoQtyPlusMinus: {$literal: 0},
                    recoQty: {$literal: 0},
                    FGINQuantity: 1,
                    batchNo: 1
                }
            },
            {
                $sort: {
                    SKUNo: 1
                }
            }
        ]);
        return res.success({
            SKUList
        });
    } catch (error) {
        console.error("getAllMasterData   Finished Goods Inward Entry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

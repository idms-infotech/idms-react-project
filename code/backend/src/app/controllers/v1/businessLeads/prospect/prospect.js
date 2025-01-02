const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/businessLeads/prospectMasterModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {
    getFirstDayOfFiscalYear,
    getLastDayOfFiscalYear,
    getLastDateOfMonth,
    getFirstDateOfMonth,
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFiscalMonthsName
} = require("../../../../utilities/utility");
const {
    getAllProspectAttributes,
    getAllProspectExcelAttributes
} = require("../../../../models/businessLeads/helpers/prospectHelper");
const {dateToAnyFormat} = require("../../../../helpers/dateTime");
const {PROSPECT_MASTER} = require("../../../../mocks/schemasConstant/businessLeadsConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const ProspectRepository = require("../../../../models/businessLeads/repository/prospectMasterRepository");
const {getAllCustomerCategory} = require("../../settings/customerCategory/customerCategory");
const { getAllModuleMaster } = require("../../settings/module-master/module-master");
const ObjectId = mongoose.Types.ObjectId;

exports.create = asyncHandler(async (req, res) => {
    try {
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
                message: MESSAGES.apiSuccessStrings.ADDED("Prospect")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Prospect", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllProspectAttributes();
        if (req.query.excel == "true") {
            project = getAllProspectExcelAttributes();
        }
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$nin: ["Converted to Customer"]}
                }
            },
            {
                $addFields: {
                    contactDetails: {$first: "$contactDetails"}
                }
            },
            {
                $unwind: {
                    path: "$contactDetails",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];
        let rows = await ProspectRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllProspect", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Prospect");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Prospect", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Prospect")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Prospect");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Prospect", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await generateCreateData(itemDetails, req.body);
        if (req.body.contactDetails) {
            itemDetails.contactDetails = req.body.contactDetails;
        }
        itemDetails = await itemDetails.save();
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Prospect has been")
        });
    } catch (e) {
        console.error("update Prospect", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let salesCategoryOptions = await getAllCustomerCategory(req.user.company);
        let currenciesOptions = await getAllModuleMaster( req.user.company, "CURRENCY");
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...PROSPECT_MASTER.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        return res.success({
            autoIncrementNo,
            salesCategoryOptions: salesCategoryOptions.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            }),
            currenciesOptions
        });
    } catch (error) {
        console.error("getAllMasterData Prospect", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllProspectsForNPD = async company => {
    try {
        let rows = await Model.find(
            {
                status: OPTIONS.defaultStatus.ACTIVE,
                company: company
            },
            {name: "$prospectName", type: "Prospect", currency: ""}
        );
        return rows;
    } catch (e) {
        console.error("getAllProspects", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return errors;
    }
};

exports.getAllCountsOfProspect = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$prospectRegistrationDate"}}
            }
        },
        {
            $match: {
                company: ObjectId(company)
            }
        },
        {
            $facet: {
                YTDProspect: [
                    {
                        $match: {
                            matchDate: {
                                $gte: dateToAnyFormat(getFirstDayOfFiscalYear(), "YYYY-MM-DD"),
                                $lte: dateToAnyFormat(getLastDayOfFiscalYear(), "YYYY-MM-DD")
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
                            prospectCount: "$count"
                        }
                    }
                ],
                MTDProspect: [
                    {
                        $match: {
                            matchDate: {
                                $gte: dateToAnyFormat(getFirstDateOfMonth(), "YYYY-MM-DD"),
                                $lte: dateToAnyFormat(getLastDateOfMonth(), "YYYY-MM-DD")
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
                            prospectCount: "$count"
                        }
                    }
                ],
                totalProspectPerDay: [
                    {
                        $match: {
                            matchDate: currentDate
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            count: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.ACTIVE]}, 1, 0]}}
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            prospectCount: "$count"
                        }
                    }
                ]
            }
        }
    ]);
    let obj = {
        MTDProspect: rows[0]?.MTDProspect[0]?.prospectCount || 0,
        YTDProspect: rows[0]?.YTDProspect[0]?.prospectCount || 0,
        totalProspectPerDay: rows[0]?.totalProspectPerDay[0]?.prospectCount || 0
    };
    return obj;
};

exports.getMonthlyProspectMaster = async company => {
    try {
        const monthsArray = getFiscalMonthsName();
        const prospectData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}}
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
                    _id: {year_month: {$substrCP: ["$createdAt", 0, 7]}},
                    count: {$sum: 1}
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
                prospectData[index] = propertyValues[n];
                n++;
            });
            let monthlyProspectVolume = {months: monthsArray, orders: prospectData};
            return monthlyProspectVolume;
        } else {
            let monthlyProspectVolume = {months: monthsArray, orders: []};
            return monthlyProspectVolume;
        }
    } catch (error) {
        console.error(error);
    }
};
exports.updateProspectOnCustomerCreate = async (prospectId, company) => {
    await Model.findOneAndUpdate(
        {
            _id: prospectId,
            company: company
        },
        {
            $set: {
                status: "Converted to Customer"
            }
        }
    );
};

exports.getAllProspectsFiltered = async match => {
    try {
        let rows = await Model.find(
            {status: OPTIONS.defaultStatus.ACTIVE, ...match},
            {
                customerName: "$prospectName",
                customerCategory: 1,
                currency: 1,
                reference: "$_id",
                referenceModel: "Prospect"
            }
        ).sort({customerName: 1});
        return rows;
    } catch (e) {
        console.error("getAllProspectsFiltered", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return errors;
    }
};

exports.getAllProspects = async (company, project = {}) => {
    try {
        let rows = await Model.find(
            {
                status: OPTIONS.defaultStatus.ACTIVE,
                company: company
            },
            project
        ).sort({customerName: 1});
        return rows;
    } catch (e) {
        console.error("getAllProspects", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return errors;
    }
};

const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/finance/assetMasterModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {outputData, getAutoIncrementNumber, getAllAggregationFooter} = require("../../../../helpers/utility");
const {generateCreateData, getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getAllAssetClassList} = require("../../settings/assetClass/assetClass");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {
    getAllAssetMasterAttributes,
    getAllAssetMasterExcelAttributes,
    getAllAssetMasterReportsAttributes
} = require("../../../../models/finance/helpers/assetMasterHelper");
const AssetMasterRepository = require("../../../../models/finance/repository/assetMasterRepository");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");

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
                message: MESSAGES.apiSuccessStrings.ADDED("Asset")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Asset", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllAssetMasterAttributes();
        if (req.query.excel == "true") {
            project = getAllAssetMasterExcelAttributes();
        }
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1}}],
                    as: "supplier"
                }
            },
            {
                $unwind: {
                    path: "$supplier",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    expiryDate: {
                        $dateAdd: {
                            startDate: "$assetPurchaseDate",
                            unit: "year",
                            amount: "$costingInput.estimatedUsefulLifeInYear"
                        }
                    }
                }
            }
        ];
        let rows = await AssetMasterRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllAsset", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("asset");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById asset", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("asset")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("asset");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Asset", e);
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
        if (req.body.costingInput) {
            itemDetails.costingInput = req.body.costingInput;
        }
        itemDetails = await itemDetails.save();

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Asset has been")
        });
    } catch (e) {
        console.error("update Asset", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const purchaseCountryOptions = await getAllModuleMaster(req.user.company, "PURCHASE_COUNTRY");
        const options = await dropDownOptions(req.user.company);
        let assetClassOptions = await getAllAssetClassList(req.user.company, {
            assetClassName: 1,
            depreciation: 1,
            energySpecification: 1,
            digit: 1,
            nextAutoIncrement: 1,
            prefix: 1
        });
        let autoIncValues = {};
        if (assetClassOptions.length > 0) {
            for (const ele of assetClassOptions) {
                autoIncValues[ele.assetClassName] = getAutoIncrementNumber(
                    ele.prefix,
                    "",
                    ele.nextAutoIncrement,
                    ele.digit
                );
            }
        }
        const assetConfigurationOptions = await getAllModuleMaster(req.user.company, "ASSET_MASTER_CONF");
        return res.success({
            autoIncValues,
            assetClassOptions,
            purchaseCountryOptions,
            assetConfigurationOptions,
            ...options
        });
    } catch (error) {
        console.error("getAllMasterData Asset", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const dropDownOptions = async company => {
    try {
        let locationOptions = await getAllModuleMaster(company, "LOCATION");
        return {
            locationOptions
        };
    } catch (error) {
        console.error(error);
    }
};
exports.getAllAssetMasterList = async (company, assetClassName, project = {}) => {
    try {
        let rows = await Model.find(
            {
                status: OPTIONS.defaultStatus.ACTIVE,
                company: company,
                assetType: assetClassName
            },
            project
        ).sort({assetCode: -1});
        return rows;
    } catch (e) {
        console.error("getAllAssetClassList", e);
    }
};

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let project = getAllAssetMasterReportsAttributes();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([
            {
                $addFields: {
                    createdAt: {$dateToString: {format: "%d-%m-%Y", date: "$createdAt"}}
                }
            },
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            ...outputData(rows)
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllAssetData = asyncHandler(async company => {
    try {
        const result = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $group: {
                    _id: null,
                    count: {$sum: 1},
                    totalPurchaseCost: {$sum: "$assetPurchaseCost"}
                }
            },
            {
                $project: {
                    _id: 0,
                    count: 1,
                    totalPurchaseCost: 1
                }
            }
        ]);
        if (result.length > 0) {
            return result[0];
        } else {
            return [];
        }
    } catch (error) {
        console.error("Not able to get record ", error);
    }
});

exports.checkAssetValidation = async (assetData, column, company) => {
    try {
        const assetOptions = await AssetMasterRepository.filteredAssetMasterList([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {
                    assetName: 1,
                    assetDescription: 1
                }
            }
        ]);
        const requiredFields = ["assetName", "assetDescription", "assetPurchaseCost"];
        const falseArr = OPTIONS.falsyArray;
        let {locationOptions} = await dropDownOptions(company);
        let dropdownCheck = [
            {
                key: "location",
                options: locationOptions
            }
        ];
        for await (const x of assetData) {
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
                for (const ele of assetOptions) {
                    if (ele.assetName == x["assetName"] && ele.assetDescription == x["assetDescription"]) {
                        x.isValid = false;
                        x.message = `${x["assetName"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = assetData.filter(x => !x.isValid);
        const validRecords = assetData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertAssetByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        let assetClassOptions = await getAllAssetClassList(req.user.company, {
            assetClassName: 1,
            depreciation: 1,
            energySpecification: 1,
            digit: 1,
            nextAutoIncrement: 1,
            prefix: 1
        });
        let missingAssetClassName = [];
        for (const ele of jsonData) {
            for (const asset of assetClassOptions) {
                if (ele.assetType.trim() == asset.assetClassName) {
                    ele.assetClassId = asset._id.valueOf();
                }
            }
            if (!ele.assetType || !ele.assetClassId) {
                missingAssetClassName.push(ele.assetType ? ele.assetType : ele.assetClassName);
            }
        }
        console.log("missingAssetClassName", missingAssetClassName);
        let assetData = jsonData.map(x => {
            const {
                assetPurchaseCost,
                financeCost,
                totalAssetClass,
                estimatedUsefulLifeInYear,
                noOfOperationalDaysPerYear,
                noOfShiftsRunPerDays,
                machineEfficiencyPercentage,
                depreciatedAssetCostPerYear,
                ...rest
            } = x;
            let details = {
                assetPurchaseCost,
                financeCost,
                totalAssetClass,
                estimatedUsefulLifeInYear,
                noOfOperationalDaysPerYear,
                noOfShiftsRunPerDays,
                machineEfficiencyPercentage,
                depreciatedAssetCostPerYear
            };
            rest.costingInput = details;
            rest.company = company;
            rest.createdBy = createdBy;
            rest.updatedBy = updatedBy;
            return rest;
        });
        for await (const item of assetData) {
            await AssetMasterRepository.createDoc(item);
        }
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

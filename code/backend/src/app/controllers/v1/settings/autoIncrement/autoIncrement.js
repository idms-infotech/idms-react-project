const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/settings/autoIncrementModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {outputData, getAllAggregationFooter, getIncrementNumWithPrefix} = require("../../../../helpers/utility");
const {generateCreateData, getMatchData} = require("../../../../helpers/global.options");
const {getAllAutoIncrementsAttributes} = require("../../../../models/settings/helpers/autoIncrementHelper");
const {default: mongoose} = require("mongoose");
const AutoIncrementRepository = require("../../../../models/settings/repository/autoIncrementRepository");
const {AUTO_INCREMENT} = require("../../../../mocks/schemasConstant/settingsConstant");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        // var searchValues = [
        //     "GR",
        //     "SR",
        //     "SJC",
        //     "JC",
        //     "Q-SKU",
        //     "Q-SKU",
        //     "FC",
        //     "SO",
        //     "DRN",
        //     "PI",
        //     "DTS ",
        //     "CN ",
        //     "DN",
        //     "GI",
        //     "GTR",
        //     "PO",
        //     "SPO",
        //     "DN",
        //     "PI",
        //     "GRN",
        //     "GTR",
        //     "FGIN",
        //     "FG",
        //     "GTR",
        //     "MRN",
        //     "PE"
        // ];
        // var regexPatterns = searchValues.map(value => new RegExp(value, "i"));

        // let records = await Model.find(
        //     {$or: [{modulePrefix: {$in: regexPatterns}}, {module: {$in: regexPatterns}}]},
        //     {_id: 1, module: 1, modulePrefix: 1, autoIncrementValue: 1, moduleName: 1}
        // );
        // console.log("records", records, records.length);
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let project = getAllAutoIncrementsAttributes();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([
            {$match: {company: ObjectId(req.user.company)}},
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            ...outputData(rows)
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
            company: req.user.company,
            ...req.body
        };
        const saveObj = new Model(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("AutoIncrement")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await generateCreateData(itemDetails, req.body);

        itemDetails = await itemDetails.save();
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await generateCreateData(itemDetails, req.body);

        itemDetails = await itemDetails.save();

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("AutoIncrement has been")
        });
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("AutoIncrement")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("AutoIncrement");
            res.preconditionFailed(errors);
        }
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
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("AutoIncrement");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await this.getAndSetAutoIncrementNo(
            AUTO_INCREMENT.AUTO_INCREMENT_DATA(),
            req.user.company
        );
        res.success({autoIncrementNo});
    } catch (error) {
        console.error("getAllMasterDataForUser", error);
        res.status(400);
        throw new Error("Invalid Model data");
    }
});
exports.updateTicketAutoIncrement = asyncHandler(async (req, res) => {
    try {
        await Model.findOneAndUpdate(
            {
                module: "IMP"
            },
            {$inc: {autoIncrementValue: 1}},
            {new: true}
        );
        res.success("Success");
    } catch (error) {
        console.error("updateTicketAutoIncrement", error);
        res.status(400);
        throw new Error("Invalid Model data");
    }
});

exports.getNextAutoIncrementNo = async ({
    moduleName,
    module,
    company,
    modulePrefix,
    digit = 4,
    subAutoIncrement = null
}) => {
    let autoIncrement = await AutoIncrementRepository.findOneDoc({module, company});
    if (!autoIncrement) {
        autoIncrement = await AutoIncrementRepository.createDoc({
            module,
            moduleName,
            company,
            modulePrefix,
            digit,
            locationCounters: []
        });
    }
    if (subAutoIncrement) {
        let locationAutoIncrement = autoIncrement.locationCounters.find(
            ele => ele.location == subAutoIncrement.location
        );
        if (!locationAutoIncrement) {
            autoIncrement.locationCounters.push({...subAutoIncrement, counter: 1});
            await autoIncrement.save();
            return {
                modulePrefix: subAutoIncrement.modulePrefix,
                autoIncrementValue: subAutoIncrement?.counter || 1,
                digit: subAutoIncrement?.digit ?? 4
            };
        }
        return {
            modulePrefix: locationAutoIncrement.modulePrefix,
            autoIncrementValue: locationAutoIncrement?.counter || 1,
            digit: locationAutoIncrement?.digit ?? 4
        };
    }
    return {
        modulePrefix: autoIncrement.modulePrefix,
        autoIncrementValue: autoIncrement.autoIncrementValue || 1,
        digit: autoIncrement?.digit ?? 4
    };
};

exports.setNextAutoIncrementNo = async function ({
    moduleName,
    module,
    company,
    modulePrefix,
    digit = 4,
    subAutoIncrement = null
}) {
    let autoIncrement = await AutoIncrementRepository.findOneDoc({module, company});
    if (!autoIncrement) {
        autoIncrement = await AutoIncrementRepository.createDoc({
            module,
            moduleName,
            company,
            modulePrefix,
            digit,
            locationCounters: []
        });
    }
    if (subAutoIncrement) {
        let locationAutoIncrement = null;
        for (const ele of autoIncrement.locationCounters) {
            if (ele.location == subAutoIncrement.location) {
                ele.counter++;
                locationAutoIncrement = ele;
            }
        }
        await autoIncrement.save();
        return {
            modulePrefix: locationAutoIncrement.modulePrefix,
            autoIncrementValue: locationAutoIncrement?.counter || 1,
            digit: locationAutoIncrement?.digit ?? 4
        };
    } else {
        await AutoIncrementRepository.updateDoc(autoIncrement, autoIncrement.autoIncrementValue++);
    }
    return {
        modulePrefix: autoIncrement.modulePrefix,
        autoIncrementValue: autoIncrement.autoIncrementValue,
        digit: autoIncrement?.digit ?? 4
    };
};

exports.getAndSetAutoIncrementNo = async (data, company, incrementFlag = false) => {
    data.company = company;
    await updatePrefix(data);
    const autoIncrementedObj = await this.getNextAutoIncrementNo(data);
    const autoIncrementNo = getIncrementNumWithPrefix(autoIncrementedObj);
    if (incrementFlag) {
        await this.setNextAutoIncrementNo(data);
    }
    return autoIncrementNo;
};

const updatePrefix = async ({module, company, modulePrefix, digit = 4, subAutoIncrement = null}) => {
    try {
        await AutoIncrementRepository.findAndUpdateDoc(
            {modulePrefix: {$exists: false}, module, company},
            {
                $set: {
                    modulePrefix: modulePrefix,
                    digit
                }
            }
        );
        if (subAutoIncrement) {
            await AutoIncrementRepository.findAndUpdateDoc(
                {
                    module,
                    company,
                    "locationCounters.modulePrefix": {$exists: false},
                    "locationCounters.location": subAutoIncrement.location
                },
                {
                    $set: {
                        "locationCounters.$.modulePrefix": subAutoIncrement.modulePrefix,
                        "locationCounters.$.digit": subAutoIncrement?.digit ?? digit
                    }
                }
            );
        }
    } catch (error) {
        console.error("error", error);
    }
};

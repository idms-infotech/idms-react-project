const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/settings/reportQMSMappingModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {outputData, getAllAggregationFooter} = require("../../../../helpers/utility");
const {generateCreateData, getMatchData} = require("../../../../helpers/global.options");
const {getAllSubModule} = require("../subModuleManagement/subModuleManagement");
const {getAllReportQmsAttributes} = require("../../../../models/settings/helpers/reportQMSMappingHelper");
const {default: mongoose} = require("mongoose");
const {getAndSetAutoIncrementNo} = require("../autoIncrement/autoIncrement");
const {REPORT_QMS_MAPPING} = require("../../../../mocks/schemasConstant/settingsConstant");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "issueNumber",
            direction = -1
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let project = getAllReportQmsAttributes();
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
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.create = asyncHandler(async (req, res) => {
    try {
        let existingUser = await Model.findOne(
            {
                report: req.body.report
            },
            {
                _id: 1
            }
        );
        if (existingUser) {
            let errors = "Mapping already exists with this same Report";
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const saveObj = new Model(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            res.success({
                message: "Report QMS Mapping has been created successfully"
            });
        }
    } catch (e) {
        console.error("create ReportQMSMapping", e);
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
        itemDetails = await itemDetails.save();
        if (itemDetails) {
            res.success({
                message: "Report QMS Mapping has been updated successfully"
            });
        }
    } catch (e) {
        console.error("update ReportQMSMapping", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("ReportQMSMapping")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("ReportQMSMapping");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Report QMS Mapping", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Report QMS Mapping");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Report QMS Mapping", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            REPORT_QMS_MAPPING.AUTO_INCREMENT_DATA(),
            req.user.company
        );
        res.success(autoIncrementNo);
    } catch (error) {
        console.error(error);
        res.status(400);
        throw new Error("Invalid Model data");
    }
});
exports.getFilterSubmoduleForQMS = asyncHandler(async (req, res) => {
    try {
        const subModuleList = await getAllSubModule(req.query.module);
        res.success(subModuleList);
    } catch (error) {
        console.error(error);
        res.status(400);
        throw new Error("Invalid Model data");
    }
});
exports.getAllReportQMSMapping = async (company, reportId) => {
    try {
        let rows = await Model.find({
            company: company,
            report: reportId
        });
        return rows;
    } catch (e) {
        console.error("getAllReportQMSMapping", e);
    }
};

exports.getQMSMappingByModuleAndTitle = async (company, module, title) => {
    try {
        let rows = await Model.findOne(
            {
                company: company,
                module: module,
                reportTitle: title
            },
            {displayText: 1, _id: 0}
        );
        return rows;
    } catch (e) {
        console.error("getQMSMappingByModuleAndTitle", e);
    }
};

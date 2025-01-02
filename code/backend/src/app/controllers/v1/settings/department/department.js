const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const Company = require("../company/company");
const {getAllDepartmentAttributes} = require("../../../../models/settings/helpers/departmentHelper");
const {default: mongoose} = require("mongoose");
const {getAndSetAutoIncrementNo} = require("../autoIncrement/autoIncrement");
const {DEPARTMENT} = require("../../../../mocks/schemasConstant/settingsConstant");
const DepartmentRepository = require("../../../../models/settings/repository/departmentRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllDepartmentAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await DepartmentRepository.getAllPaginate({
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
        const itemDetails = await DepartmentRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: "Department has been created successfully"
            });
        }
    } catch (e) {
        console.error("create Department", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await DepartmentRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await DepartmentRepository.updateDoc(itemDetails, req.body);
        if (itemDetails) {
            res.success({
                message: "Department has been updated successfully"
            });
        }
    } catch (e) {
        console.error("update Department", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await DepartmentRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Department")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Department");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Department", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await DepartmentRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Department");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Department", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(DEPARTMENT.AUTO_INCREMENT_DATA(), req.user.company);
        const locationOptions = await Company.getCompanyLocations(req.user.company);
        res.success({
            autoIncrementNo,
            locationOptions: locationOptions?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            })
        });
    } catch (error) {
        console.error(error);
        res.status(400);
        throw new Error("Invalid Model data");
    }
});

exports.getAllDepartments = async (company, project = {company: 0}) => {
    try {
        let rows = await DepartmentRepository.filteredDepartmentList([
            {
                $match: {
                    company: ObjectId(company)
                }
            },
            {
                $project: project
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllDepartments", e);
    }
};

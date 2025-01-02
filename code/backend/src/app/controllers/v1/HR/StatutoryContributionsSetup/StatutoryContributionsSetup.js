const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/HR/statutoryContributionsSetup");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getAllProfessionalTax} = require("../../settings/professionalTax/professionalTax");
const ObjectId = mongoose.Types.ObjectId;

// @desc    create Statutory Contributions Setup new Record
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
                message: MESSAGES.apiSuccessStrings.ADDED("Statutory Contributions Setup")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Statutory Contributions Setup", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update Statutory Contributions Setup  Record
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
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Statutory Contributions Setup has been")
        });
    } catch (e) {
        console.error("update Statutory Contributions Setup", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById Statutory Contributions Setup Record
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Statutory Contributions Setup")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Statutory Contributions Setup");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Statutory Contributions Setup", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById Statutory Contributions Setup Record
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Statutory Contributions Setup");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Statutory Contributions Setup", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getByCompanyId = asyncHandler(async (req, res) => {
    try {
        let professionalTax = await getAllProfessionalTax(req.user.company);
        const itemDetails = await Model.findOne({
            company: req.user.company
        }).populate("company");
        if (itemDetails) {
            res.success({itemDetails, professionalTax});
        } else {
            res.success({});
        }
    } catch (error) {
        console.error("getByCompanyId Statutory Contributions Setup", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllStatutoryContributionsSetups Statutory Contributions Setup Record
exports.getAllStatutoryContributionsSetups = asyncHandler(async company => {
    try {
        let rows = await Model.findOne({company: company}).sort({createdAt: -1});
        return rows;
    } catch (e) {
        console.error("getAllStatutoryContributionsSetups", e);
    }
});
// @desc    getAllData Statutory Contributions Setup Record
const getAllData = asyncHandler(async (req, query, excel) => {
    try {
        const {page = 1, pageSize = 10, column = "createdAt", direction = -1} = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let rows = [];
        if (excel == "false") {
            rows = await Model.aggregate([
                {$match: query},
                {
                    $lookup: {
                        from: "Employee",
                        localField: "employeeId",
                        foreignField: "_id",
                        pipeline: [{$project: {empCode: 1, empInfo: 1}}],
                        as: "employeeId"
                    }
                },
                {$sort: {[column]: +direction}},
                {$skip: +skip},
                {$limit: +pageSize}
            ]);
        } else {
            rows = await Model.aggregate([
                {$match: query},
                {
                    $lookup: {
                        from: "Employee",
                        localField: "employeeId",
                        foreignField: "_id",
                        pipeline: [{$project: {empCode: 1, empInfo: 1}}],
                        as: "employeeId"
                    }
                },
                {$sort: {[column]: +direction}}
            ]);
        }
        return rows;
    } catch (e) {
        console.error("getAllData Salary Component", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.createOrUpdate = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findOne({
            company: req.user.company
        });
        if (itemDetails) {
            itemDetails.updatedBy = req.user.sub;
            itemDetails = await generateCreateData(itemDetails, req.body);
            await itemDetails.save();
            return res.success({message: MESSAGES.apiSuccessStrings.UPDATE("Statutory Contributions Setup has been")});
        } else {
            let createObj = req.body;
            createObj.company = req.user.company;
            createObj.createdBy = req.user.sub;
            createObj.updatedBy = req.user.sub;
            createObj.userId = req.user.sub;
            const item = await Model.create(createObj);
            if (item) {
                res.success({message: MESSAGES.apiSuccessStrings.ADDED("Statutory Contributions Setup")});
            } else {
                const errors = "Invalid Statutory Contributions Setup data";
                return res.preconditionFailed(errors);
            }
        }
    } catch (error) {
        console.error(error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getPTForSalaryPayroll = async company => {
    try {
        const result = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company)
                }
            },
            {
                $project: {
                    statePlaceOfWork: "$professionalTax.statePlaceOfWork",
                    _id: 0
                }
            },
            {
                $lookup: {
                    from: "ProfessionalTax",
                    let: {state: "$state"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {$eq: ["$$state", "$statePlaceOfWork"]}
                            }
                        },
                        {
                            $project: {state: 1, gender: 1, minSalary: 1, maxSalary: 1, amount: 1, isFebAmount: 1}
                        }
                    ],
                    as: "professionalTax"
                }
            },
            {
                $project: {
                    professionalTax: 1
                }
            }
        ]);
        return result.length ? result[0].professionalTax : [];
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};

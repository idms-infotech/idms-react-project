const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/settings/customerPDIRMappingModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {outputData, getAllAggregationFooter} = require("../../../../helpers/utility");
const {generateCreateData, getMatchData} = require("../../../../helpers/global.options");
const {getAllCustomerPDIRMappingAttributes} = require("../../../../models/settings/helpers/customerPDIRMappingHelper");
const {default: mongoose} = require("mongoose");
const {getAndSetAutoIncrementNo} = require("../autoIncrement/autoIncrement");
const {CUSTOMER_PDIR_MAPPING} = require("../../../../mocks/schemasConstant/settingsConstant");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
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
        let project = getAllCustomerPDIRMappingAttributes();
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
                customer: req.body.customer
            },
            {
                _id: 1
            }
        );
        if (existingUser) {
            let errors = "PDIR Mapping already exists for same Customer";
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
                message: "Customer PDIR Mapping has been created successfully"
            });
        }
    } catch (e) {
        console.error("create Customer PDIR Mapping", e);
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
                message: "Customer PDIR Mapping has been updated successfully"
            });
        }
    } catch (e) {
        console.error("update Customer PDIR Mapping", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Customer PDIR Mapping")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Customer PDIR Mapping");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Customer PDIR Mapping", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Customer PDIR Mapping");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Customer PDIR Mapping", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            CUSTOMER_PDIR_MAPPING.AUTO_INCREMENT_DATA(),
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
                    customerBillingPinCode: "$customerBillingAddress.pinCode"
                }
            }
        ]);
        res.success({
            autoIncrementNo,
            customersOptions
        });
    } catch (error) {
        console.error(error);
        res.status(400);
        throw new Error("Invalid Model data");
    }
});

exports.getAllCustomerPDIRMapping = async (company, customerId) => {
    try {
        let rows = await Model.find({
            company: company,
            customer: customerId
        });
        return rows;
    } catch (e) {
        console.error("getAllCustomerPDIRMapping", e);
    }
};

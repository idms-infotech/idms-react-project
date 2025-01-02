const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllDeliveryChallanLocAttributes} = require("../../../../models/settings/helpers/deliveryChallanLocHelper");
const DeliveryChallanLocRepository = require("../../../../models/settings/repository/deliveryChallanLocRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {filteredCompanyList} = require("../../../../models/settings/repository/companyRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllDeliveryChallanLocAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await DeliveryChallanLocRepository.getAllPaginate({
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
        const itemDetails = await DeliveryChallanLocRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Delivery Challan Location")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Delivery Challan Location", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await DeliveryChallanLocRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await DeliveryChallanLocRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Delivery Challan Location has been")
        });
    } catch (e) {
        console.error("update Delivery Challan Location", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await DeliveryChallanLocRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Delivery Challan Location")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Delivery Challan Location");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Delivery Challan Location", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await DeliveryChallanLocRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Delivery Challan Location");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Delivery Challan Location", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const consigneeLocOptions = await filteredCompanyList([
            {
                $match: {
                    _id: ObjectId(req.user.company)
                }
            },
            {
                $project: {
                    placesOfBusiness: 1
                }
            },
            {$unwind: "$placesOfBusiness"},
            {
                $project: {
                    _id: 0,
                    label: "$placesOfBusiness.locationID",
                    value: "$placesOfBusiness.locationID"
                }
            }
        ]);
        return res.success({consigneeLocOptions});
    } catch (error) {
        console.error("getAllMasterData Delivery Challan Location", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllDCLocations = async (company, project = {__v: 0}) => {
    try {
        let rows = await DeliveryChallanLocRepository.filteredDeliveryChallanLocList([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {$project: project},
            {$sort: {order: 1}}
        ]);
        return rows;
    } catch (e) {
        console.error("getAllDCLocations", e);
    }
};
exports.setDCLocNextAutoIncrementNo = async location => {
    try {
        await DeliveryChallanLocRepository.findAndUpdateDoc(
            {
                location: location
            },
            {$inc: {nextAutoIncrement: 1}}
        );
    } catch (e) {
        console.error("setDCLocNextAutoIncrementNo", e);
    }
};

const {ObjectId} = require("../../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../../helpers/messages.options");
const {getAllWeedingAttributes} = require("../../../../../models/production/helpers/weedingHelper");
const WeedingRepository = require("../../../../../models/production/repository/prodHouseRepo/weedingRepository");
const {getAllModuleMaster} = require("../../../settings/module-master/module-master");
const {filteredSKUMasterList} = require("../../../../../models/sales/repository/SKUMasterRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllWeedingAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await WeedingRepository.getAllPaginate({
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

exports.createOrUpdate = asyncHandler(async (req, res) => {
    try {
        let exists = await WeedingRepository.findOneDoc({
            SKUProcessFlow: req.body.SKUProcessFlow,
            jobCard: req.body.jobCard,
            SKU: req.body.SKU
        });
        if (exists) {
            exists.updatedBy = req.user.sub;
            exists = await WeedingRepository.updateDoc(exists, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            delete createdObj._id;
            await WeedingRepository.createDoc(createdObj);
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Weeding")
        });
    } catch (e) {
        console.error("create Weeding", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let weeding = {};
        weeding = await WeedingRepository.findOneDoc({
            jobCard: ObjectId(req.query.jobCard),
            SKU: ObjectId(req.query.SKU),
            SKUProcessFlow: ObjectId(req.query.SKUProcessFlow)
        });
        if (!weeding) {
            rows = await filteredSKUMasterList([
                {
                    $match: {
                        _id: ObjectId(req.query.SKU)
                    }
                },
                {
                    $sort: {SKUNo: 1}
                },
                {
                    $project: {
                        jobCard: req.query.jobCard,
                        jobCardNo: req.query.jobCardNo,
                        SKU: "$_id",
                        SKUNo: 1,
                        SKUName: 1,
                        SKUDescription: 1,
                        logDetails: {
                            prodSource: {$literal: null},
                            prodDate: {$literal: null},
                            prodShift: {$literal: null},
                            operatingStaff: {$literal: null},
                            remarks: {$literal: null},
                            authorizedBy: {$literal: null}
                        }
                    }
                }
            ]);
            weeding = rows.length ? rows[0] : null;
        }
        const shiftOptions = await getAllModuleMaster(req.user.company, "PRODUCTION_SHIFT");
        return res.success({
            weedingLog: weeding,
            shiftOptions
        });
    } catch (error) {
        console.error("getAllMasterData Weeding", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

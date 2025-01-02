const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllJobCardOutputAttributes} = require("../../../../models/production/helpers/jobCardOutputHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {JOB_CARD_OUTPUT} = require("../../../../mocks/schemasConstant/productionConstant");
const JobCardOutputRepository = require("../../../../models/production/repository/prodHouseRepo/jobCardOutputRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {JOB_ORDER_TYPE} = require("../../../../mocks/constantData");
const {getCompanyLocations} = require("../../settings/company/company");
const SKUMasterRepository = require("../../../../models/sales/repository/SKUMasterRepository");
const {getExpiryDate} = require("../../../../helpers/dateTime");
const FGINRepository = require("../../../../models/stores/repository/FGINRepository");
const JCRepository = require("../../../../models/planning/repository/jobCardRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllJobCardOutputAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), status: {$nin: [OPTIONS.defaultStatus.REPORT_GENERATED]}}}
        ];
        let rows = await JobCardOutputRepository.getAllPaginate({
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
        const itemDetails = await JobCardOutputRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Job Card Output")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Job Card Output", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await JobCardOutputRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        if (req.body.status && req.body.status == OPTIONS.defaultStatus.APPROVED) {
            req.body.approvedDate = new Date();
        }
        itemDetails = await JobCardOutputRepository.updateDoc(itemDetails, req.body);
        if (itemDetails.status == OPTIONS.defaultStatus.REPORT_GENERATED) {
            let SKUDetails = await SKUMasterRepository.getDocById(itemDetails.SKU, {shelfLife: 1, customerInfo: 1});
            let fginData = {
                company: itemDetails.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                FGINNo: "FGIN000",
                SKUId: itemDetails.SKU,
                SKUNo: itemDetails.SKUNo,
                SKUName: itemDetails.SKUName,
                SKUDescription: itemDetails.SKUDescription,
                UOM: itemDetails.UOM,
                partNo: SKUDetails?.customerInfo[0].customerPartNo,
                FGINDate: itemDetails.approvedDate,
                manufacturingDate: itemDetails.manufacturingDate,
                expiryDate: getExpiryDate(SKUDetails.shelfLife, new Date()),
                FGINQuantity: itemDetails.batchOutputQty,
                previousDRNQty: 0,
                batchNo: itemDetails.batchNumber,
                location: itemDetails.location
            };
            await FGINRepository.createDoc(fginData);
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Job Card Output has been")
        });
    } catch (e) {
        console.error("update Job Card Output", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await JobCardOutputRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Job Card Output")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Job Card Output");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Job Card Output", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await JobCardOutputRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Job Card Output");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Job Card Output", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const jobCardDetails = await JCRepository.filteredJobCardList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    orderType: {$ne: JOB_ORDER_TYPE.NPD},
                    status: OPTIONS.defaultStatus.REPORT_GENERATED
                }
            },
            {
                $project: {
                    jobCardNo: 1
                }
            }
        ]);
        const location = await getCompanyLocations(req.user.company);
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            JOB_CARD_OUTPUT.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        return res.success({
            autoIncrementNo,
            jobCardDetails,
            location: location?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            })
        });
    } catch (error) {
        console.error("getAllMasterData Job Card Output", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getJCDetailsByJCId = asyncHandler(async (req, res) => {
    try {
        const jobCardDetails = await JCRepository.filteredJobCardList([
            {
                $match: {
                    _id: ObjectId(req.params.id)
                }
            },
            {
                $unwind: "$SKUDetails"
            },
            {
                $group: {
                    _id: "$SKUDetails.SKU",
                    SKUNo: {$first: "$SKUDetails.SKUNo"},
                    SKUName: {$first: "$SKUDetails.SKUName"},
                    SKUDescription: {$first: "$SKUDetails.SKUDescription"},
                    UOM: {$first: "$SKUDetails.UOM"},
                    batchQty: {$first: "$batchInfo.totalBatchQuantity"},
                    batchNumber: {$first: "$batchInfo.batchNumber"},
                    batchDate: {$first: "$batchInfo.manufacturingDate"},
                    manufacturingDate: {$first: "$batchInfo.manufacturingDate"}
                }
            },
            {
                $project: {
                    SKU: "$_id",
                    SKUNo: "$SKUNo",
                    SKUName: "$SKUName",
                    SKUDescription: "$SKUDescription",
                    batchDate: {$dateToString: {format: "%Y-%m-%d", date: "$batchDate"}},
                    UOM: "$UOM",
                    batchInputQty: "$batchQty",
                    manufacturingDate: {$dateToString: {format: "%Y-%m-%d", date: "$manufacturingDate"}},
                    batchNumber: "$batchNumber",
                    _id: 0
                }
            }
        ]);
        return res.success(jobCardDetails.length > 0 ? jobCardDetails[0] : []);
    } catch (error) {
        console.error("getJCDetailsByJCId Job Card Output", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

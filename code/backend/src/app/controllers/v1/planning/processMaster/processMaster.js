const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getAllProcessMasterAttributes} = require("../../../../models/planning/helpers/processMasterHelper");
const {ASSET_CLASS_NAMES, PROCESS, IPQA, DEFECT_TYPES} = require("../../../../mocks/constantData");
const {getAllLabourRateMasterList} = require("../../finance/labour-rate-master/labour-rate-master");
const {default: mongoose} = require("mongoose");
const {PROCESS_MASTER} = require("../../../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const ProcessRepository = require("../../../../models/planning/repository/processMasterRepository");
const {filteredAssetMasterList} = require("../../../../models/finance/repository/assetMasterRepository");
const {filteredProcessListConfigList} = require("../../../../models/settings/repository/processListConfigRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllProcessMasterAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            }
        ];
        let rows = await ProcessRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllProcessMaster", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.create = asyncHandler(async (req, res) => {
    try {
        let existingProcess = await ProcessRepository.findOneDoc({
            processName: req.body.processName
        });
        if (existingProcess) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("Process Name");
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        // let reqObj = {
        //     allocationOfSkilledLabour: req.body.allocationOfSkilledLabour,
        //     allocationOfSemiSkilledLabour: req.body.allocationOfSemiSkilledLabour,
        //     allocationOfUnSkilledLabour: req.body.allocationOfUnSkilledLabour
        // };
        // createdObj.labourRatePerHr = await calculateLabourSalarySum(req.user.company, reqObj);
        const itemDetails = await ProcessRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Process Master")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Process Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ProcessRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        // let reqObj = {
        //     allocationOfSkilledLabour: req.body.allocationOfSkilledLabour,
        //     allocationOfSemiSkilledLabour: req.body.allocationOfSemiSkilledLabour,
        //     allocationOfUnSkilledLabour: req.body.allocationOfUnSkilledLabour
        // };
        // itemDetails.labourRatePerHr = await calculateLabourSalarySum(req.user.company, reqObj);
        itemDetails = await ProcessRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Process Master has been")
        });
    } catch (e) {
        console.error("update Process Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await ProcessRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Process Master");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Process Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await ProcessRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Process Master")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Process Master");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Process Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...PROCESS_MASTER.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        const labourList = await getAllLabourRateMasterList(req.user.company, {category: 1, salaryPerHour: 1});
        const assetMasterList = await filteredAssetMasterList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE,
                    assetType: {$in: [ASSET_CLASS_NAMES.MACHINES, ASSET_CLASS_NAMES.EQUIPMENT]}
                }
            },
            {
                $project: {
                    assetCode: 1,
                    assetName: 1,
                    assetDescription: 1,
                    location: 1,
                    totalAssetCostPerHr: 1,
                    asset: "$_id",
                    isSelect: {$literal: false}
                }
            },
            {
                $sort: {
                    assetCode: 1
                }
            }
        ]);
        const processList = await filteredProcessListConfigList([
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            },
            {
                $sort: {
                    _id: -1
                }
            },
            {
                $limit: 1
            },
            {
                $unwind: "$processDetails"
            },
            {
                $sort: {SN: 1}
            },
            {
                $project: {
                    _id: 0,
                    processName: "$processDetails.processName"
                }
            }
        ]);
        return res.success({
            autoIncrementNo,
            assetMasterList,
            labourList,
            processList
        });
    } catch (error) {
        console.error("getAllMasterData Process Master", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllProcessMasterForDirectCost = async company => {
    try {
        let rows = await ProcessRepository.filteredProcessMasterList([
            {
                $match: {
                    company: ObjectId(company)
                }
            },
            {
                $project: {
                    process: "$_id",
                    processId: 1,
                    processName: 1,
                    unitProcessOutput: "$unitProcessOutput",
                    labourRatePerHr: "$totalRatePerHr",
                    assetRatePerHr: "$totalAllocatedAssetCostPerHr"
                }
            },
            {
                $addFields: {
                    PFSeq: null,
                    specQuantity: 0,
                    processHrs: 0,
                    labourCost: 0,
                    CAUnitsOfLabour: 0,
                    labourCostPerUnit: 0,
                    assetCost: 0,
                    CAUnitsOfAssets: 0,
                    assetCostPerUnit: 0
                }
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllProcessMaster", e);
    }
};

// async function calculateLabourSalarySum(company, reqObj) {
//     let labourList = await getAllLabourRateMasterList(company, {category: 1, salaryPerHour: 1});
//     let totalLabourSalary = 0;
//     for (const ele of labourList) {
//         if (ele.category == "Skilled Labour") {
//             totalLabourSalary += reqObj.allocationOfSkilledLabour * ele.salaryPerHour;
//         }
//         if (ele.category == "Semi-Skilled Labour") {
//             totalLabourSalary += reqObj.allocationOfSemiSkilledLabour * ele.salaryPerHour;
//         }
//         if (ele.category == "Un-Skilled Labour") {
//             totalLabourSalary += reqObj.allocationOfUnSkilledLabour * ele.salaryPerHour;
//         }
//     }
//     return totalLabourSalary;
// }

exports.getAllMapProcessNames = asyncHandler(async (req, res) => {
    try {
        let project = {
            _id: 1,
            processOriginalName: {$ifNull: ["$processOriginalName", null]},
            qualityOriginalName: {$ifNull: ["$qualityOriginalName", null]},
            processName: 1,
            processId: 1
        };
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ];
        let rows = await ProcessRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success({
            ...rows,
            processOptions: PROCESS,
            IPQAOptions: IPQA
        });
    } catch (error) {
        console.error("getAllMapProcessNames Process Master", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

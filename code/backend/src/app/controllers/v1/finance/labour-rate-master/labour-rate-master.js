const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/finance/labourRateModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {LABOUR_RATE_MASTER_ARRAY} = require("../../../../mocks/constantData");
const {ObjectId} = require("../../../../../config/mongoose");

exports.update = asyncHandler(async (req, res) => {
    try {
        for (const ele of req.body) {
            await Model.update(
                {_id: ele._id},
                {$set: {company: req.user.company, createdBy: req.user.sub, updatedBy: req.user.sub, ...ele}},
                {upsert: true}
            );
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Labour Rate has been")
        });
    } catch (e) {
        console.error("update Labour Rate", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let rows = await Model.find();
        if (rows && rows.length == 0) {
            rows = LABOUR_RATE_MASTER_ARRAY;
        }
        return res.success(rows);
    } catch (error) {
        console.error("getAllMasterData Labour Rate", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllLabourRateMasterList = async (company, project = {}) => {
    try {
        let rows = await Model.find(
            {
                company: company
            },
            project
        ).sort({createdAt: -1});
        return rows;
    } catch (e) {
        console.error("getAllLabourRateMasterList", e);
    }
};
// exports.getSumOfLabourSalary = async (company, obj) => {
//     try {
//         let {noOfSkilledLabour, noOfSemiSkilledLabour, noOfUnSkilledLabour} = obj;
//         let rows = await Model.aggregate([
//             {
//                 $match: {company: ObjectId(company)}
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalSum: {
//                         $sum: {
//                             $cond: [
//                                 {$eq: ["$category", "Skilled Labour"]},
//                                 {$multiply: [noOfSkilledLabour, "$salaryPerHour"]},
//                                 {
//                                     $cond: [
//                                         {$eq: ["$category", "Skilled Labour"]},
//                                         {$multiply: [noOfSkilledLabour, "$salaryPerHour"]},
//                                     ]
//                                 }
//                             ]
//                         }
//                     }
//                 }
//             }
//             // {
//             //     $project: {
//             //         skilledLabourSalary: {
//             //             $cond: [
//             //                 {$eq: ["$category", "Skilled Labour"]},
//             //                 {$multiply: [noOfSkilledLabour, "$salaryPerHour"]}
//             //             ]
//             //         }
//             //     }
//             // }
//         ]);
//         return rows;
//     } catch (e) {
//         console.error("getAllLabourRateMasterList", e);
//     }
// };

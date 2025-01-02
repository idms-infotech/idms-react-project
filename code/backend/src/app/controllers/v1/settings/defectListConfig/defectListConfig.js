const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const DefectListConfigRepository = require("../../../../models/settings/repository/defectListConfigRepository");
const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let rows = await DefectListConfigRepository.filteredDefectListConfigList([
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            },
            {
                $project: {
                    SN: 1,
                    defectName: 1
                }
            }
        ]);
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.createOrUpdate = asyncHandler(async (req, res) => {
    try {
        await DefectListConfigRepository.deleteManyDoc({});
        let docArray = req.body.map(ele => {
            ele.company = req.user.company;
            ele.createdBy = req.user.sub;
            ele.updatedBy = req.user.sub;
            return ele;
        });
        await DefectListConfigRepository.insertManyDoc(docArray);

        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED(`Defect List Config`)
        });
    } catch (e) {
        console.error(`Defect List Config`, e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

const Model = require("../calibrationStandardModel");
module.exports = {
    createCalibrationStandard: async obj => {
        return await Model.create(obj);
    },
    findOneCalibrationStandard: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllCalibrationStandardAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateCalibrationStandard: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteCalibrationStandard: async match => {
        return await Model.deleteOne(match);
    },
    filteredCalibrationStandardList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

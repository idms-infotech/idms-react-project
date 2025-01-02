const Model = require("../salaryMasterModel");
module.exports = {
    createSalaryMaster: async obj => {
        return await Model.create(obj);
    },
    findOneSalaryMaster: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllSalaryMasterAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateSalaryMaster: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteSalaryMaster: async match => {
        return await Model.deleteOne(match);
    },
    filteredSalaryMasterList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

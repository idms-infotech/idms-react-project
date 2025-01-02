const Model = require("../salaryComponentsModel");
module.exports = {
    createSalaryComponents: async obj => {
        return await Model.create(obj);
    },
    findOneSalaryComponents: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllSalaryComponentsAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateSalaryComponents: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteSalaryComponents: async match => {
        return await Model.deleteOne(match);
    },
    filteredSalaryComponentsList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

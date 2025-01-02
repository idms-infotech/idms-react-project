const Model = require("../empLeaveModel");
module.exports = {
    createEmpLeave: async obj => {
        return await Model.create(obj);
    },
    findOneEmpLeave: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllEmpLeaveAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateEmpLeave: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteEmpLeave: async match => {
        return await Model.deleteOne(match);
    },
    filteredEmpLeaveList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

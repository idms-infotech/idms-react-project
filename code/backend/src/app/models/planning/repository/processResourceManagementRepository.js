const Model = require("../processResourceManagementModel");
module.exports = {
    createProcessResourceManagement: async obj => {
        return await Model.create(obj);
    },
    findOneProcessResourceManagement: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllProcessResourceManagementAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateProcessResourceManagement: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteProcessResourceManagement: async match => {
        return await Model.deleteOne(match);
    },
    filteredProcessResourceManagementList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

const Model = require("../maintenanceTaskModel");
module.exports = {
    createMaintenanceTask: async obj => {
        return await Model.create(obj);
    },
    findOneMaintenanceTask: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllMaintenanceTaskAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateMaintenanceTask: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteMaintenanceTask: async match => {
        return await Model.deleteOne(match);
    },
    filteredMaintenanceTaskList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

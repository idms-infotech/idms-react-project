const Model = require("../maintenanceMetricsModel");
module.exports = {
    createMaintenanceMetrics: async obj => {
        return await Model.create(obj);
    },
    findOneMaintenanceMetrics: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllMaintenanceMetricsAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateMaintenanceMetrics: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteMaintenanceMetrics: async match => {
        return await Model.deleteOne(match);
    },
    filteredMaintenanceMetricsList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

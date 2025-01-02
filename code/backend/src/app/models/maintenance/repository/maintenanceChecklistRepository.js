const Model = require("../maintenanceChecklistModel");
module.exports = {
    createMaintenanceChecklist: async obj => {
        return await Model.create(obj);
    },
    findOneMaintenanceChecklist: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllMaintenanceChecklistAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateMaintenanceChecklist: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteMaintenanceChecklist: async match => {
        return await Model.deleteOne(match);
    },
    filteredMaintenanceChecklistList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

const Model = require("../maintenanceTechnicianModel");
module.exports = {
    createMaintenanceTechnician: async obj => {
        return await Model.create(obj);
    },
    findOneMaintenanceTechnician: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllMaintenanceTechnicianAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateMaintenanceTechnician: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteMaintenanceTechnician: async match => {
        return await Model.deleteOne(match);
    },
    filteredMaintenanceTechnicianList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

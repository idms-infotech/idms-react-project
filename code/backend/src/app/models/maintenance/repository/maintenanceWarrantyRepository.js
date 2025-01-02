const Model = require("../maintenanceWarrantyModel");
module.exports = {
    createMaintenanceWarranty: async obj => {
        return await Model.create(obj);
    },
    findOneMaintenanceWarranty: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllMaintenanceWarrantyAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateMaintenanceWarranty: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteMaintenanceWarranty: async match => {
        return await Model.deleteOne(match);
    },
    filteredMaintenanceWarrantyList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

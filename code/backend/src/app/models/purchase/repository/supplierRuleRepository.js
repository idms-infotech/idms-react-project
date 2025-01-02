const Model = require("../supplierRuleModel");
module.exports = {
    createSupplierRule: async obj => {
        return await Model.create(obj);
    },
    findOneSupplierRule: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllPaginate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateSupplierRule: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteSupplierRule: async match => {
        return await Model.deleteOne(match);
    },
    filteredSupplierRuleList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

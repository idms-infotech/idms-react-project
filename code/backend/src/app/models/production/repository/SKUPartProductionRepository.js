const Model = require("../SKUPartProductionModel");
module.exports = {
    createSKUPartProd: async obj => {
        return await Model.create(obj);
    },
    findOneSKUPartProd: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllSKUPartProdAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateSKUPartProd: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteSKUPartProd: async match => {
        return await Model.deleteOne(match);
    },
    filteredSKUPartProdList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

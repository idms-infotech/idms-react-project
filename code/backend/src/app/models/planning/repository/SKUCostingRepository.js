const Model = require("../SKUCostingModel");
module.exports = {
    createSKUCosting: async obj => {
        return await Model.create(obj);
    },
    findOneSKUCosting: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllSKUCostingAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateSKUCosting: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteSKUCosting: async match => {
        return await Model.deleteOne(match);
    },
    filteredSKUCostingList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

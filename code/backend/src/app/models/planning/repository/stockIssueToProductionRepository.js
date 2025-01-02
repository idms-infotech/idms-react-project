const Model = require("../stockIssueToProductionModel");
module.exports = {
    createStockIssueToProduction: async obj => {
        return await Model.create(obj);
    },
    findOneStockIssueToProduction: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllStockIssueToProductionAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateStockIssueToProduction: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteStockIssueToProduction: async match => {
        return await Model.deleteOne(match);
    },
    filteredStockIssueToProductionList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

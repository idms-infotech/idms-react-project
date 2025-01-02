const Model = require("../stockTransferToStoreModel");
module.exports = {
    createStockTransferToStore: async obj => {
        return await Model.create(obj);
    },
    findOneStockTransferToStore: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllStockTransferToStoreAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateStockTransferToStore: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteStockTransferToStore: async match => {
        return await Model.deleteOne(match);
    },
    filteredStockTransferToStoreList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

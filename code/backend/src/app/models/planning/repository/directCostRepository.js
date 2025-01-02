const Model = require("../directCostModel");
module.exports = {
    createDirectCost: async obj => {
        return await Model.create(obj);
    },
    findOneDirectCost: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllDirectCostAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateDirectCost: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteDirectCost: async match => {
        return await Model.deleteOne(match);
    },
    filteredDirectCostList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

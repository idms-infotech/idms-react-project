const Model = require("../mapCategoryHSNModel");
module.exports = {
    createMapCategoryHSN: async obj => {
        return await Model.create(obj);
    },
    findOneMapCategoryHSN: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllMapCategoryHSNAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateMapCategoryHSN: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteMapCategoryHSN: async match => {
        return await Model.deleteOne(match);
    },
    filteredMapCategoryHSNList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

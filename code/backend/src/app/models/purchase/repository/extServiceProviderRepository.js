const Model = require("../externalServiceProviderModel");
module.exports = {
    createExtServiceProvider: async obj => {
        return await Model.create(obj);
    },
    findOneExtServiceProvider: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllPaginate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateExtServiceProvider: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteExtServiceProvider: async match => {
        return await Model.deleteOne(match);
    },
    filteredExtServiceProviderList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

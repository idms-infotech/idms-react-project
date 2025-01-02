const Model = require("../../billOfMaterialModels/BoMOfProductModel");

module.exports = {
    createBoMOfProduct: async obj => {
        return await Model.create(obj);
    },
    findOneBoMOfProduct: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllBoMOfProductAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateBoMOfProduct: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteBoMOfProduct: async match => {
        return await Model.deleteOne(match);
    },
    filteredBoMOfProductList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

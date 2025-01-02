const Model = require("../productMasterModel");
module.exports = {
    createProductMaster: async obj => {
        return await Model.create(obj);
    },
    findOneProductMaster: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllProductMasterAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateProductMaster: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteProductMaster: async match => {
        return await Model.deleteOne(match);
    },
    filteredProductMasterList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

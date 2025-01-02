const Model = require("../billOfMaterialModel");
module.exports = {
    createBOM: async obj => {
        return await Model.create(obj);
    },
    findOneBOM: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllBOMAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateBOM: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteBOM: async match => {
        return await Model.deleteOne(match);
    },
    filteredBOMList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

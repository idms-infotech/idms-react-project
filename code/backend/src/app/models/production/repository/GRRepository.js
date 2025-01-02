const Model = require("../goodsRequisitionModel");
module.exports = {
    createGR: async obj => {
        return await Model.create(obj);
    },
    findOneGR: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllPaginate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateGR: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteGR: async match => {
        return await Model.deleteOne(match);
    },
    filteredGRList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

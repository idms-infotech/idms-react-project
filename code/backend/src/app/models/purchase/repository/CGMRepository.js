const Model = require("../cgmModel");
module.exports = {
    createCGM: async obj => {
        return await Model.create(obj);
    },
    findOneCGM: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllPaginate: async aggregateObj => {
        const rows = await Model.paginate(aggregateObj);
        return rows;
    },
    updateCGM: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteCGM: async match => {
        return await Model.deleteOne(match);
    },
    filteredCGMList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

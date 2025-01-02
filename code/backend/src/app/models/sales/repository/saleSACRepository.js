const Model = require("../saleSACModel");
module.exports = {
    createSaleSAC: async obj => {
        return await Model.create(obj);
    },
    findOneSaleSAC: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllSaleSACAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateSaleSAC: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteSaleSAC: async match => {
        return await Model.deleteOne(match);
    },
    filteredSaleSACList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

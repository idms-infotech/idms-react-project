const Model = require("../sacModel");
module.exports = {
    createSAC: async obj => {
        return await Model.create(obj);
    },
    findOneSAC: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    findAndUpdateDoc: async (match, update) => {
        return await Model.findOneAndUpdate(match, update);
    },
    insertManySAC: async arr => {
        return await Model.insertMany(arr);
    },
    getAllPaginate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateSAC: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteSAC: async match => {
        return await Model.deleteOne(match);
    },
    filteredSACMasterList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

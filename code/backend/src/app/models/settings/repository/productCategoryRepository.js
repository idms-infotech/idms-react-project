const Model = require("../productCategoryModel");

module.exports = {
    createDoc: async obj => {
        return await Model.create(obj);
    },
    findOneDoc: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    findAndUpdateDoc: async (match, project = {}) => {
        return await Model.findOneAndUpdate(match, project);
    },
    getDocById: async (id, project = {}) => {
        return await Model.findById(id, project);
    },
    getAllPaginate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateDoc: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteDoc: async match => {
        return await Model.deleteOne(match);
    },
    filteredProductCategoryMasterList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

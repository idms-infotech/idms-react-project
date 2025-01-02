const Model = require("../SFGStockModel");

module.exports = {
    createDoc: async obj => {
        return await Model.create(obj);
    },
    findOneDoc: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    findAndUpdateDoc: async (match, update) => {
        return await Model.findOneAndUpdate(match, update);
    },
    findByIdAndUpdateDoc: async (
        id,
        updateObj,
        options = {
            new: true
        }
    ) => Model.findByIdAndUpdate(id, updateObj, options),

    getDocById: async (_id, project = {}) => {
        return await Model.findById(_id, project);
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
    filteredSFGStockList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

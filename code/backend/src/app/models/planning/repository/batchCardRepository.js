const Model = require("../batchCardModel");
const BatchCardRepository = {
    createDoc: async obj => {
        return await Model.create(obj);
    },
    findOneDoc: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    findAndUpdateDoc: async (match, update) => {
        return await Model.updateOne(match, update);
    },
    updateManyDoc: async (match, update) => {
        return await Model.updateMany(match, update);
    },
    getDocById: async (_id, project = {}) => {
        return await Model.findById(_id, project);
    },
    getAllPaginate: async ({pipeline, project, queryParams}) => {
        return await Model.paginate({pipeline, project, queryParams});
    },
    updateDoc: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteDoc: async match => {
        return await Model.deleteOne(match);
    },
    filteredBatchCardList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};
module.exports = BatchCardRepository;
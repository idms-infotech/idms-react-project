const Model = require("../rejectedMRNModel");
const RejectedMRNRepository = {
    createDoc: async obj => {
        return await Model.create(obj);
    },
    findOneDoc: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    findAndUpdateDoc: async (match, update, options) => {
        return await Model.updateOne(match, update, options);
    },
    updateManyDoc: async (match, update, options) => {
        return await Model.updateMany(match, update, options);
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
    filteredRejectedMRNList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};
module.exports = RejectedMRNRepository;

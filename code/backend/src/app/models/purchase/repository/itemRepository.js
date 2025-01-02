const Model = require("../itemModel");
const ItemRepository = {
    createDoc: async obj => {
        return await Model.create(obj);
    },
    findOneDoc: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    findAndUpdateDoc: async (match, update, options) => {
        return await Model.updateOne(match, update, options);
    },
    getDocById: async (_id, project = {}) => {
        return await Model.findById(_id, project);
    },
    getAllPaginate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    getAllReportsPaginate: async reportAggregateObj => {
        return Model.reportPaginate(reportAggregateObj);
    },
    updateDoc: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    updateManyDoc: async (match, update) => {
        return await Model.updateMany(match, update);
    },
    deleteDoc: async match => {
        return await Model.deleteOne(match);
    },
    filteredItemList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};
module.exports = ItemRepository;

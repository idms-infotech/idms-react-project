const Model = require("../prodItemMasterModel");

const ProdItemRepository = {
    createDoc: async obj => {
        return await Model.create(obj);
    },
    insertManyDoc: async docArr => {
        return await Model.insertMany(docArr);
    },
    findOneDoc: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    findAndUpdateDoc: async (match, update) => {
        return await Model.updateOne(match, update);
    },
    getDocById: async (_id, project = {}) => {
        return Model.findById(_id, project);
    },
    getAllPaginate: async ({pipeline, project, queryParams}) => {
        return await Model.paginate({pipeline, project, queryParams});
    },
    getAllReportsPaginate: async reportAggregateObj => {
        const rows = await Model.reportPaginate(reportAggregateObj);
        return rows;
    },
    updateDoc: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteDoc: async match => {
        return await Model.deleteOne(match);
    },
    filteredProdItemList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};
module.exports = ProdItemRepository;

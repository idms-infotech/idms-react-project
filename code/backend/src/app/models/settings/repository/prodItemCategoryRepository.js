const Model = require("../prodItemCategoryModel");
const ProdItemCategoryRepository = {
    createDoc: async obj => {
        return await Model.create(obj);
    },
    findOneDoc: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getDocById: async (_id, project = {}) => {
        return await Model.findById(_id, project);
    },
    findAndUpdateDoc: async (match, update) => {
        return await Model.updateOne(match, update);
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
    filteredProdItemCategoryList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};
module.exports = ProdItemCategoryRepository;

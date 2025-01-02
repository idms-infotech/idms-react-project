const Model = require("../transporterMasterModel");
module.exports = {
    createDoc: async obj => {
        return await Model.create(obj);
    },
    insertManyDoc: async docArr => {
        return await Model.insertMany(docArr);
    },
    findOneDoc: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
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
    filteredTransporterMasterList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

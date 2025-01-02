const Model = require("../WIPInventoryModel");

module.exports = {
    createDoc: async obj => {
        return await Model.create(obj);
    },
    findOneDoc: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    findAndUpdateDoc: async (match, updateObj) => {
        return await Model.updateOne(match, updateObj);
    },
    insertManyDoc: async docArr => {
        return await Model.insertMany(docArr);
    },
    bulkWriteDoc: async options => {
        return await Model.bulkWrite(options);
        // .then(result => {
        //     console.log(result);
        // })
        // .catch(error => {
        //     console.error("Error executing bulk write operation:", error);
        // });
    },
    findByIdAndUpdateDoc: async (
        id,
        updateObj,
        options = {
            new: true
        }
    ) => {
        return await Model.findByIdAndUpdate(id, updateObj, options);
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
    filteredWIPInventoryList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

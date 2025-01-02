const Model = require("../B2CustomerModel");
module.exports = {
    createB2Customer: async obj => {
        return await Model.create(obj);
    },
    findOneB2Customer: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllB2CustomerAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateB2Customer: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteB2Customer: async match => {
        return await Model.deleteOne(match);
    },
    filteredB2CustomerList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

const Model = require("../labourRateModel");
module.exports = {
    createLabourRate: async obj => {
        return await Model.create(obj);
    },
    findOneLabourRate: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllLabourRateAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateLabourRate: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteLabourRate: async match => {
        return await Model.deleteOne(match);
    },
    filteredLabourRateList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

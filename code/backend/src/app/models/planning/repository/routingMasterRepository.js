const Model = require("../routingMasterModel");
module.exports = {
    createRoutingMaster: async obj => {
        return await Model.create(obj);
    },
    findOneRoutingMaster: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllRoutingMasterAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateRoutingMaster: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteRoutingMaster: async match => {
        return await Model.deleteOne(match);
    },
    filteredRoutingMasterList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

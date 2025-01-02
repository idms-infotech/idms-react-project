const Model = require("../mapProcessAndMachineModel");
module.exports = {
    createMapProcessAndMachine: async obj => {
        return await Model.create(obj);
    },
    findOneMapProcessAndMachine: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllMapProcessAndMachineAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateMapProcessAndMachine: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteMapProcessAndMachine: async match => {
        return await Model.deleteOne(match);
    },
    filteredMapProcessAndMachineList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

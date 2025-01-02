const Model = require("../taskSchedulingModel");
module.exports = {
    createTaskScheduling: async obj => {
        return await Model.create(obj);
    },
    findOneTaskScheduling: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllTaskSchedulingAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateTaskScheduling: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteTaskScheduling: async match => {
        return await Model.deleteOne(match);
    },
    filteredTaskSchedulingList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

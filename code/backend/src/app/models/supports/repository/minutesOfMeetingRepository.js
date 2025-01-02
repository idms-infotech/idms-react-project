const Model = require("../minutesOfMeetingModel");
module.exports = {
    createMinutesOfMeeting: async obj => {
        return await Model.create(obj);
    },
    findOneMinutesOfMeeting: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllMinutesOfMeetingAggregate: async ({pipeline, project, match, column, direction, pagination}) => {
        const rows = await Model.paginate({pipeline, project, match, column, direction, pagination});
        return rows;
    },
    updateMinutesOfMeeting: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteMinutesOfMeeting: async match => {
        return await Model.deleteOne(match);
    },
    filteredMinutesOfMeetingList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

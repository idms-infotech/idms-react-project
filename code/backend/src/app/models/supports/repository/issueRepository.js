const Model = require("../issueModel");
module.exports = {
    createIssue: async obj => {
        return await Model.create(obj);
    },
    findOneIssue: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllIssueAggregate: async ({pipeline, project, match, column, direction, pagination}) => {
        const rows = await Model.paginate({pipeline, project, match, column, direction, pagination});
        return rows;
    },
    updateIssue: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteIssue: async match => {
        return await Model.deleteOne(match);
    },
    filteredIssueList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

const Model = require("../statutoryContributionsSetup");
module.exports = {
    createStatutoryContribution: async obj => {
        return await Model.create(obj);
    },
    findOneStatutoryContribution: async (match, project = {}) => {
        return await Model.findOne(match, project).lean();
    },
    getAllStatutoryContributionAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateStatutoryContribution: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteStatutoryContribution: async match => {
        return await Model.deleteOne(match);
    },
    filteredStatutoryContributionList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

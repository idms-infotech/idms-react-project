const Model = require("../advanceSalaryRequestModel");
module.exports = {
    createAdvSalaryRequest: async obj => {
        return await Model.create(obj);
    },
    findOneAdvSalaryRequest: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllAdvSalaryRequestAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateAdvSalaryRequest: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteAdvSalaryRequest: async match => {
        return await Model.deleteOne(match);
    },
    filteredAdvSalaryRequestList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

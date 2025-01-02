const Model = require("../costHeadModel");

module.exports = {
    createCostHead: async obj => {
        return await Model.create(obj);
    },
    insertManyCostHead: async arr => {
        return await Model.insertMany(arr);
    },
    countCostHead: async () => {
        return await Model.countDocuments();
    },
    findOneCostHead: async (match, project) => {
        return await Model.findOne(match, project);
    },
    updateCostHead: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    }
};

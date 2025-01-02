const Model = require("../../finance/operatingExpensesModel");

module.exports = {
    createOPEX: async obj => {
        return await Model.create(obj);
    },
    countOPEX: async () => {
        return await Model.countDocuments();
    },
    findOneOPEX: async (match, project) => {
        return await Model.findOne(match, project);
    },
    updateOPEX: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    }
};

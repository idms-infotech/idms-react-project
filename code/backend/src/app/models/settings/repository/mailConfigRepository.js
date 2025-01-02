const Model = require("../mailConfigModel");

module.exports = {
    createMailConfig: async obj => {
        return await Model.create(obj);
    },
    findOneMailConfig: async (match, project) => {
        return await Model.findOne(match, project);
    },
    updateMailConfig: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    }
};

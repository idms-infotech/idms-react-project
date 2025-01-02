const {MenuItem: Model} = require("../index");

module.exports = {
    createMenuItemModel: async obj => {
        return await Model.create(obj);
    },
    findOneMenuItemModel: async (match, project) => {
        return await Model.findOne(match, project);
    },
    updateMenuItemModel: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    }
};

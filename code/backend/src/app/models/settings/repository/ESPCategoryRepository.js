const Model = require("../ESPCategoryModel");

module.exports = {
    filteredESPCategoryList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

const Model = require("../qualityEquipmentModel");
module.exports = {
    createQualityEquipment: async obj => {
        return await Model.create(obj);
    },
    findOneQualityEquipment: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllQualityEquipmentAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateQualityEquipment: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteQualityEquipment: async match => {
        return await Model.deleteOne(match);
    },
    filteredQualityEquipmentList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

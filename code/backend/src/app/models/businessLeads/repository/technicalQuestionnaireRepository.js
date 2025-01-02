const Model = require("../technicalQuestionnaireModel");
module.exports = {
    createTechnicalQuestionnaire: async obj => {
        return await Model.create(obj);
    },
    findOneTechnicalQuestionnaire: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllTechnicalQuestionnaireAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateTechnicalQuestionnaire: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteTechnicalQuestionnaire: async match => {
        return await Model.deleteOne(match);
    },
    filteredTechnicalQuestionnaireList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

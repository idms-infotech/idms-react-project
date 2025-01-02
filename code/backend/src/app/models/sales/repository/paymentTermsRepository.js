const Model = require("../paymentTermsModel");
module.exports = {
    createPaymentTerms: async obj => {
        return await Model.create(obj);
    },
    findOnePaymentTerms: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllPaymentTermsAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updatePaymentTerms: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deletePaymentTerms: async match => {
        return await Model.deleteOne(match);
    },
    filteredPaymentTermsList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

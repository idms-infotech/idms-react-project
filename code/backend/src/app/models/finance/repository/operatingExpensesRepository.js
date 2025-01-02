const Model = require("../operatingExpensesModel");
module.exports = {
    createOperatingExpenses: async obj => {
        return await Model.create(obj);
    },
    findOneOperatingExpenses: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getAllOperatingExpensesAggregate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateOperatingExpenses: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteOperatingExpenses: async match => {
        return await Model.deleteOne(match);
    },
    filteredOperatingExpensesList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};

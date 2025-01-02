const Model = require("../servicePurchaseOrderModel");
module.exports = {
    createServicePurchaseOrder: async obj => {
        return await Model.create(obj);
    },
    findOneServicePurchaseOrder: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getDocById: async (id, project = {}) => {
        return await Model.findById(id, project);
    },
    getAllPaginate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateDoc: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteServicePurchaseOrder: async match => {
        return await Model.deleteOne(match);
    },
    filteredServicePurchaseOrderList: async pipeline => {
        return await Model.aggregate(pipeline);
    },
    getAllReportsPaginate: async reportAggregateObj => {
        const rows = await Model.reportPaginate(reportAggregateObj);
        return rows;
    }
};

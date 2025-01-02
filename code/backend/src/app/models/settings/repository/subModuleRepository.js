const {ObjectId} = require("../../../../config/mongoose");
const Model = require("../subModuleManagementModel");

const SubModuleRepository = {
    createDoc: async obj => {
        return await Model.create(obj);
    },
    findOneDoc: async (match, project = {}) => {
        return await Model.findOne(match, project);
    },
    getDocById: async (_id, project = {}) => {
        return await Model.findById(_id, project);
    },
    getAllPaginate: async ({pipeline, project, queryParams}) => {
        const rows = await Model.paginate({pipeline, project, queryParams});
        return rows;
    },
    updateDoc: async (existing, updateBody) => {
        Object.assign(existing, updateBody);
        return existing.save();
    },
    deleteDoc: async match => {
        return await Model.deleteOne(match);
    },
    featureConfig: async (subModuleId = null, menuItemIdFlag = false, featureCode = null) => {
        return Model.aggregate([
            {
                $match: {
                    ...(!!subModuleId && {
                        _id: ObjectId(subModuleId)
                    }),
                    ...(!!menuItemIdFlag && {
                        menuItemId: null
                    })
                }
            },
            {
                $unwind: "$featureConfig"
            },
            {
                $match: {
                    "featureConfig.status": true,
                    ...(!!featureCode && {
                        "featureConfig.featureCode": featureCode
                    })
                }
            },
            {
                $project: {
                    _id: 0,
                    featureCode: "$featureConfig.featureCode",
                    value: "$featureConfig.value"
                }
            }
        ]);
    },
    filteredSubModuleManagementList: async pipeline => {
        return await Model.aggregate(pipeline);
    }
};
module.exports = SubModuleRepository;

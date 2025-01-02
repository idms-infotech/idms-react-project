const {salesCategoryManipulation} = require("../../../../helpers/utility");
const JobCardRepository = require("../../../../models/planning/repository/jobCardRepository");

exports.migrateJobCardData = async () => {
    try {
        let bulkJSON = await JobCardRepository.filteredJobCardList([
            {
                $project: {_id: 1}
            }
        ]);
        for (const ele of bulkJSON) {
            let obj = await JobCardRepository.getDocById(ele._id);
            const {categoryType, category} = salesCategoryManipulation(obj.customerCategory);
            obj.customerCategory = category;
            obj.categoryType = categoryType;
            await obj.save();
        }
        console.log("Job Card Update SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};

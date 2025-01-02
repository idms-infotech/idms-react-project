const {salesCategoryManipulation} = require("../../../../helpers/utility");
const SampleJCCreationRepository = require("../../../../models/businessLeads/repository/sampleJCCreationRepository");

exports.migrateSampleJCData = async () => {
    try {
        let bulkJSON = await SampleJCCreationRepository.filteredSampleJCCreationList([
            {
                $project: {_id: 1}
            }
        ]);
        for (const ele of bulkJSON) {
            let obj = await SampleJCCreationRepository.getDocById(ele._id);
            const {categoryType, category} = salesCategoryManipulation(obj.customerCategory);
            obj.customerCategory = category;
            obj.categoryType = categoryType;
            await obj.save();
        }
        console.log("Sample JC Update SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};

const {salesCategoryManipulation} = require("../../../../helpers/utility");
const SampleRequestRepository = require("../../../../models/businessLeads/repository/sampleRequestRepository");

exports.migrateSampleRequestData = async () => {
    try {
        let bulkJSON = await SampleRequestRepository.filteredSampleRequestList([
            {
                $project: {_id: 1}
            }
        ]);
        for (const ele of bulkJSON) {
            let obj = await SampleRequestRepository.getDocById(ele._id);
            const {categoryType, category} = salesCategoryManipulation(obj.salesCategory);
            obj.salesCategory = category;
            obj.categoryType = categoryType;
            await obj.save();
        }
        console.log("Sample Request Update SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};

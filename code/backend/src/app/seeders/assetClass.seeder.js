const assetClassJson = require("../mocks/assetClass.json");
const AssetClassRepository = require("../models/settings/repository/assetClassRepository");
exports.assetClassInsert = async companyId => {
    try {
        const existing = await AssetClassRepository.findOneDoc({});
        if (!existing) {
            for await (const ele of assetClassJson) {
                ele.company = companyId;
                await AssetClassRepository.createDoc(ele);
            }
        }
        console.info("Asset Class Inserted successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

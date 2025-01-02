const {OPTIONS} = require("../../../../helpers/global.options");
const {getIncrementNumWithPrefix} = require("../../../../helpers/utility");
const {LOGISTICS_PROVIDER} = require("../../../../mocks/schemasConstant/planningConstant");
const LogisticsProviderRepository = require("../../../../models/planning/repository/logisticsProviderRepository");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {getAllLSPCategory, setLSPNextAutoIncrementNo} = require("../../settings/LSPCategory/LSPCategory");

exports.bulkMigrateLogistics = async () => {
    try {
        let list = await LogisticsProviderRepository.filteredLogisticsProviderList([
            {
                $project: {
                    _id: 1,
                    LSPCode: 1,
                    company: 1,
                    categoryType: 1
                }
            }
        ]);
        for await (const ele of list) {
            const categoryList = await getAllLSPCategory([
                {
                    $match: {
                        categoryStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                }
            ]);
            if (categoryList?.length) {
                let category = categoryList.find(x => ele.LSPCategory == x.category);
                if (!!category) {
                    ele.LSPCode = getIncrementNumWithPrefix({
                        modulePrefix: category.prefix,
                        autoIncrementValue: category.nextAutoIncrement,
                        digit: category.digit
                    });
                    await setLSPNextAutoIncrementNo(ele.LSPCategory);
                }
            } else {
                ele.LSPCode = await getAndSetAutoIncrementNo(
                    {...LOGISTICS_PROVIDER.AUTO_INCREMENT_DATA()},
                    ele.company,
                    true
                );
            }
            await LogisticsProviderRepository.findAndUpdateDoc({_id: ele._id}, [
                {
                    $set: {LSPCode: ele.LSPCode}
                }
            ]);
        }
        console.log("ItemsCode And Category Updated");
    } catch (error) {
        console.error("error", error);
    }
};


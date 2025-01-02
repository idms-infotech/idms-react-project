const {default: mongoose} = require("mongoose");
const {getIncrementNumWithPrefix} = require("../../../../helpers/utility");
const AssetMasterRepository = require("../../../../models/finance/repository/assetMasterRepository");
const AssetClassRepository = require("../../../../models/settings/repository/assetClassRepository");
const {getAllAssetClassList, setAssetsClassNextAutoIncrementNo} = require("../../settings/assetClass/assetClass");
const {CATEGORY_JSON} = require("./constantFile");

const bulkMigrateAssetCodeByCategory = async () => {
    try {
        let missingCat = [];
        let assetList = await AssetMasterRepository.filteredAssetMasterList([
            {
                $project: {
                    _id: 1,
                    assetCode: 1,
                    assetClassId: 1,
                    company: 1,
                    assetType: 1
                }
            }
        ]);
        const categoryMap = new Map(CATEGORY_JSON.map(z => [z.oldClassName, z.newClassName]));
        for await (const ele of assetList) {
            if (!categoryMap.get(ele.assetType)) missingCat.push(ele.assetType);
            ele.assetType = categoryMap.get(ele.assetType);
            let categoryList = await getAllAssetClassList(ele.company, {
                assetClassName: 1,
                digit: 1,
                nextAutoIncrement: 1,
                prefix: 1
            });
            if (categoryList?.length) {
                let categoryObj = categoryList.find(x => ele.assetType == x.assetClassName);
                if (!!categoryObj) {
                    ele.assetClassId = categoryObj._id;
                    ele.assetCode = getIncrementNumWithPrefix({
                        modulePrefix: categoryObj.prefix,
                        autoIncrementValue: categoryObj.nextAutoIncrement,
                        digit: categoryObj.digit
                    });
                } else {
                    missingCat.push(ele.assetType);
                }
                await AssetClassRepository.findAndUpdateDoc(
                    {
                        assetClassName: ele.assetType
                    },
                    {$inc: {nextAutoIncrement: 1}}
                );
            }
            console.log("ele.assetCode", ele.assetCode);
            let output = await AssetMasterRepository.findAndUpdateDoc(
                {_id: ele._id},
                {
                    assetCode: ele.assetCode,
                    assetType: ele.assetType,
                    assetClassId: ele.assetClassId
                }
            );
            // console.log("output", output);
        }
        console.log("missingCat", missingCat);
        console.log("Asset Prefix Updated  Updated");
    } catch (error) {
        console.error("error", error);
    }
};

// bulkMigrateAssetCodeByCategory().then(console.log("ASSET PREFIX"));

const updateAssetCodePrefixBulk = async () => {
    try {
        let assetList = await AssetMasterRepository.filteredAssetMasterList([
            {
                $project: {
                    _id: 0,
                    value: "$assetCode",
                    label: "$_id"
                }
            }
        ]);
        /** ---------------ProcessMaster -------------------------*/
        let ProcessMasterCount = await mongoose.connection.collection("ProcessMaster").countDocuments();
        console.log("ProcessMasterCount", ProcessMasterCount);

        for await (const ele of assetList) {
            /** ---------------ProcessMaster -------------------------*/
            if (ProcessMasterCount > 0) {
                let output = await mongoose.connection.collection("ProcessMaster").updateMany(
                    {"assetAllocationDetails.asset": ele.label},
                    {
                        $set: {
                            "assetAllocationDetails.$[elem].assetCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.asset": ele.label}]
                    }
                );
                console.log("ProcessMaster output", output);
            }
        }
        console.log("Successfully Asset Prefix saved");
    } catch (error) {
        console.error("error", error);
    }
};

// updateAssetCodePrefixBulk().then(console.log("ASSET BULK CODE UPDATE"));

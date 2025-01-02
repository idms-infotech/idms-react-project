const {OPTIONS} = require("../../../../helpers/global.options");
const {getIncrementNumWithPrefix} = require("../../../../helpers/utility");
const {PROD_ITEM_CATEGORY_TYPE} = require("../../../../mocks/constantData");
const JobWorkItemMasterRepository = require("../../../../models/purchase/repository/jobWorkItemMasterRepository");
const {
    getAllProdItemCategory,
    setProdItemNextAutoIncrementNo
} = require("../../settings/prodItemCategory/prodItemCategory");
const mongoose = require("mongoose");
exports.updateJobWorkItem = async () => {
    try {
        let bulkJSON = await JobWorkItemMasterRepository.filteredJobWorkItemMasterList([
            {
                $project: {
                    itemCategory: 1,
                    jobWorkItemCode: 1,
                    _id: 1
                }
            }
        ]);
        for (const obj of bulkJSON) {
            obj.itemCategory = "JP05 - Job Work SF Goods";
            const itemCategoryList = await getAllProdItemCategory([
                {
                    $match: {
                        type: PROD_ITEM_CATEGORY_TYPE.JW_ITEM,
                        categoryStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                }
            ]);
            let category = itemCategoryList.find(x => obj.itemCategory == x.category);
            if (!!category) {
                obj.jobWorkItemCode = getIncrementNumWithPrefix({
                    modulePrefix: category.prefix,
                    autoIncrementValue: category.nextAutoIncrement,
                    digit: category.digit
                });
                await setProdItemNextAutoIncrementNo(obj.itemCategory);
            }
            await JobWorkItemMasterRepository.findAndUpdateDoc(
                {_id: obj._id},
                {
                    jobWorkItemCode: obj.jobWorkItemCode,
                    itemCategory: obj.itemCategory
                }
            );
        }
        console.log("Job Work Item Updated SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};

const updateJWItemCodeBulk = async () => {
    try {
        const JWItem = mongoose.model("JobWorkItemMaster");
        let JWItemList = await JWItem.find(
            {},
            {
                _id: 0,
                value: "$jobWorkItemCode",
                label: "$_id"
            }
        ).lean();
        /** ---------------JobWorkChallan -------------------------*/
        let JobWorkChallanCount = await mongoose.connection.collection("JobWorkChallan").countDocuments();
        console.log("JobWorkChallanCount", JobWorkChallanCount);
        /** ---------------JobWorkOrder -------------------------*/
        let JobWorkOrderCount = await mongoose.connection.collection("JobWorkOrder").countDocuments();
        console.log("JobWorkOrderCount", JobWorkOrderCount);

        for await (const ele of JWItemList) {
            console.log("ele", ele);
            /** ---------------JobWorkChallan -------------------------*/
            if (JobWorkChallanCount > 0) {
                let output = await mongoose.connection.collection("JobWorkChallan").updateMany(
                    {"jobWorkDetails.jobWorkItem": ele.label},
                    {
                        $set: {
                            "jobWorkDetails.jobWorkItemCode": ele.value
                        }
                    }
                );

                console.log("JobWorkChallan output", output);
            }
            /** ---------------JobWorkOrder -------------------------*/
            if (JobWorkOrderCount > 0) {
                let output = await mongoose.connection.collection("JobWorkOrder").updateMany(
                    {"WODetails.jobWorkItem": ele.label},
                    {
                        $set: {
                            "WODetails.$[elem].jobWorkItemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.jobWorkItem": ele.label}]
                    }
                );
                console.log("JobWorkOrder output", output);
            }
        }
        console.log("Successfully item code saved");
    } catch (error) {
        console.error("error", error);
    }
};

// updateJWItemCodeBulk().then(data => console.log("updateJWItemCodeBulk------------------"));

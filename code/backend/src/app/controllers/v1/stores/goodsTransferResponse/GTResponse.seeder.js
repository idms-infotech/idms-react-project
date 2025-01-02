const {ObjectId} = require("../../../../../config/mongoose");
const GoodsTransferRequestRepository = require("../../../../models/planning/repository/goodsTransferRequestRepository");
const {
    filteredGoodsTransferResponseList
} = require("../../../../models/stores/repository/goodsTransferResponseRepository");

const GTResFaultList = async () => {
    try {
        const faultedList = await filteredGoodsTransferResponseList([
            {
                $unwind: "$GTDetails"
            },
            {
                $sort: {
                    createdAt: 1
                }
            },
            {
                $group: {
                    _id: {GTReqId: "$GTRequest", itemId: "$GTDetails.item"},
                    toTransferQty: {$first: "$GTDetails.GTRQty"},
                    transferredQty: {$sum: "$GTDetails.GTQty"}
                }
            },
            {
                $project: {
                    _id: 0,
                    GTReqId: "$_id.GTReqId",
                    itemId: "$_id.itemId",
                    toTransferQty: 1,
                    transferredQty: 1
                }
            },
            {
                $match: {
                    $expr: {
                        $or: [{$gte: ["$transferredQty", "$toTransferQty"]}]
                    }
                }
            }
        ]);
        console.log("faultedList", faultedList);
        for await (const ele of faultedList) {
            await GoodsTransferRequestRepository.findAndUpdateDoc(
                {_id: ele.GTReqId, "GTRequestDetails.item": ele.itemId},
                {
                    $set: {
                        "GTRequestDetails.$[elem].balancedQty": 0
                    }
                },
                {
                    arrayFilters: [{"elem.item": ele.itemId}]
                }
            );
        }
        console.log("GTR Updated");
    } catch (error) {
        console.error("error", error);
    }
};

// GTResFaultList().then(console.log("GTReq update on Response"));

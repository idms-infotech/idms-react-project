exports.getAllRMSpecificationAttributes = () => {
    return {
        itemCategory: "$itemType",
        status: {$ifNull: ["$RMSpecification.status", "Red"]},
        itemCode: 1,
        itemName: 1,
        QCLevels: 1,
        itemDescription: 1,
        UOM: "$orderInfoUOM"
    };
};

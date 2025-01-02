exports.getAllProductSpecificationAttributes = () => {
    return {
        productCategory: "$productCategory",
        SKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        UOM: "$primaryUnit",
        status: {$ifNull: ["$productSpecification.status", "Red"]}
    };
};

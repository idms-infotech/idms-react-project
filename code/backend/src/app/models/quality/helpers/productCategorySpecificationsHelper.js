exports.getAllProductCategorySpecificationsAttributes = extra => {
    return {
        productNumber: 1,
        productCode: 1,
        displayProductCategoryName: 1,
        application: 1,
        status: 1,
        ...extra
    };
};

exports.getAllSubModuleManagementAttributes = itemsCondition => {
    return {
        title: 1,
        isDisplay: 1,
        order: 1,
        roles: 1,
        displayName: 1,
        disabled: 1,
        url: 1,
        roles: 1,
        items: itemsCondition
    };
};

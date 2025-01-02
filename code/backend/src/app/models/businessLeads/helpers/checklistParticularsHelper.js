exports.getAllChecklistParticularsAttributes = extra => {
    return {
        order: 1,
        name: 1,
        status: 1,
        ...extra
    };
};

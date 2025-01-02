exports.getSupportAttributes = extra => {
    return {
        _id: 1,
        id: "$_id",
        firstName: 1,
        lastName: 1,
        email: 1,
        description: 1,
        createdAt: 1,
        ...extra
    };
};

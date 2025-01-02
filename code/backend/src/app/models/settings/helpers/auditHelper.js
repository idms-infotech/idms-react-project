exports.getAllAuditAttributes = () => {
    return {
        user: "$user.name",
        date: {$dateToString: {format: "%d-%m-%Y", date: "$date"}},
        action: 1,
        fieldsModified: 1,
        sensitiveInfo: 1,
        data: 1,
        createdAt: {$dateToString: {format: "%d-%m-%Y", date: "$createdAt"}}
    };
};

exports.getAllInvZoneConfigAttributes = () => {
    return {
        srNo: 1,
        invZoneName: 1,
        invZoneCode: 1,
        status: 1,
        revisionHistory: 1,
        revisionNo: {$concat: ["Rev", " ", "$revisionNo"]}
    };
};

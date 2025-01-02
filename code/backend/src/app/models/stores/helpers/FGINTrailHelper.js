exports.getAllFGINTrailAttributes = () => {
    return {
        SKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        openingQty: {$round: ["$openingQty", 2]},
        inwardQty: 1,
        invQty: 1,
        invReturnedQty: 1,
        recoQty: 1,
        UOM: 1,
        closingQty: {$round: ["$closingQty", 2]},
        createdAt: {$dateToString: {format: "%d-%m-%Y", date: "$createdAt"}}
    };
};

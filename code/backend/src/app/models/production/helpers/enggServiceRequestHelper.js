exports.getAllEnggServiceRequestAttributes = () => {
    return {
        ESRNo: 1,
        ESRDate: {$dateToString: {format: "%d-%m-%Y", date: "$ESRDate"}},
        asset: 1,
        assetCode: 1,
        assetName: 1,
        assetDescription: 1,
        location: 1,
        breakdownDate: {$dateToString: {format: "%d-%m-%Y", date: "$breakdownDate"}},
        breakdownTime: {$concat: ["$breakdownTime", " Hrs"]},
        status: 1
    };
};
exports.getAllMainBDAttributes = () => {
    return {
        ESRNo: 1,
        ESRDate: {$dateToString: {format: "%d-%m-%Y", date: "$ESRDate"}},
        asset: 1,
        assetCode: 1,
        assetName: 1,
        assetDescription: 1,
        location: 1,
        breakdownDate: {$dateToString: {format: "%d-%m-%Y", date: "$breakdownDate"}},
        breakdownTime: {$concat: ["$breakdownTime", " Hrs"]},
        status: 1
    };
};
exports.getAllEnggServiceReportsAttributes = () => {
    return {
        ESRNo: 1,
        maintenanceStatus: 1,
        issueCategory: 1,
        assetRestorationDate: {$dateToString: {format: "%d-%m-%Y", date: "$assetRestorationDate"}},
        totalDownTime: 1
    };
};

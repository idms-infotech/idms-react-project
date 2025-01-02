exports.getAllNPDAttributes = () => {
    return {
        NPDNo: 1,
        NPDDate: {$dateToString: {format: "%d-%m-%Y", date: "$NPDDate"}},
        name: {
            $cond: [{$eq: ["$referenceModel", "Prospect"]}, "$prospects.prospectName", "$customers.customerName"]
        },
        referenceModel: 1,
        productCategory: 1,
        projectName: 1,
        createdAt: 1,
        expectedDeliveryDate: {$dateToString: {format: "%d-%m-%Y", date: "$expectedDeliveryDate"}},
        expProductionStartDate: {$dateToString: {format: "%d-%m-%Y", date: "$expProductionStartDate"}},
        status: 1
    };
};
exports.getAllNPDExcelAttributes = () => {
    return {
        NPDNo: 1,
        NPDDate: {$dateToString: {format: "%d-%m-%Y", date: "$NPDDate"}},
        name: {
            $cond: [{$eq: ["$referenceModel", "Prospect"]}, "$prospects.prospectName", "$customers.customerName"]
        },
        referenceModel: 1,
        productCategory: 1,
        projectName: 1,
        createdAt: 1,
        expectedDeliveryDate: {$dateToString: {format: "%d-%m-%Y", date: "$expectedDeliveryDate"}},
        expProductionStartDate: {$dateToString: {format: "%d-%m-%Y", date: "$expProductionStartDate"}},
        status: 1
    };
};

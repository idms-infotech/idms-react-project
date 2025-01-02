exports.getAllMaintenanceWarrantyAttributes = () => {
    return {
        warrantyCode: 1,
        warrantyName: 1,
        equipmentName: "$equipment.assetName",
        supplier: "$supplier.supplierName",
        warrantyStartDate: {$dateToString: {format: "%d-%m-%Y", date: "$warrantyStartDate"}},
        warrantyEndDate: {$dateToString: {format: "%d-%m-%Y", date: "$warrantyEndDate"}},
        AMCStartDate: {$dateToString: {format: "%d-%m-%Y", date: "$AMCStartDate"}},
        AMCEndDate: {$dateToString: {format: "%d-%m-%Y", date: "$AMCEndDate"}},
        warrantyType: 1,
        warrantyDescription: 1,
        contactPerson: 1,
        warrantyStatus: 1,
        createdAt: 1
    };
};

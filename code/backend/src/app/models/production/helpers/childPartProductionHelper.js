exports.getAllChildPartProductionAttributes = () => {
    return {
        productionDate: {$dateToString: {format: "%d-%m-%Y", date: "$productionDate"}},
        productionShift: 1,
        processName: 1,
        machineName: 1,
        operatingStaff: 1,
        remarks: 1,
        status: 1,
        createdAt: 1
    };
};

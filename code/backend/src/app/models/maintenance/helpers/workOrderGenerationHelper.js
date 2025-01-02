exports.getAllWorkOrderGenerationAttributes = () => {
    return {
        workOrderCode: 1,
        workOrderExecutionDate: {$dateToString: {format: "%d-%m-%Y", date: "$workOrderExecutionDate"}},
        equipmentName: 1,
        taskCode: "$schedule.taskCode",
        technicianCode: "$technician.technicianCode",
        priority: 1,
        startDateS: 1,
        endDateS: 1,
        description: 1,
        scheduleCode: "$schedule.scheduleCode",
        materials: 1,
        maintenanceCost: 1,
        status: 1,
        createdAt: 1
    };
};
exports.getAllWorkOrderGenerationReportsAttributes = () => {
    return {
        workOrderCode: 1,
        priority: 1,
        status: 1,
        equipmentCode: "$equipment.assetCode",
        equipmentName: "$equipment.assetName",
        technicianName: "$technician.technicianName",
        scheduleDate: {$dateToString: {format: "%d-%m-%Y", date: "$startDate"}},
        completionDate: {$dateToString: {format: "%d-%m-%Y", date: "$endDate"}},
        createdAtS: 1
    };
};

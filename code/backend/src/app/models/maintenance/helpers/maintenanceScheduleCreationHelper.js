exports.getAllMaintenanceScheduleAttributes = () => {
    return {
        createdAt: 1,
        scheduleCode: 1,
        scheduleName: 1,
        equipment: "$equipment.assetName",
        maintenanceTask: "$maintenanceTask.taskName",
        frequency: 1,
        startDate: 1,
        endDate: 1,
        description: 1,
        startDateS: 1,
        endDateS: 1
    };
};
exports.getAllMaintenanceScheduleReportsAttributes = () => {
    return {
        equipmentCode: "$equipment.assetCode",
        equipmentName: "$equipment.assetName",
        equipmentType: "$equipment.assetType",
        taskCategory: "$maintenanceTask.taskCategory",
        createdAt: "$maintenanceTask.createdAt",
        createdAt: {$dateToString: {format: "%d-%m-%Y", date: "$createdAt"}}
    };
};

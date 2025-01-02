exports.getAllMaintenanceTaskAttributes = () => {
    return {
        taskCode: 1,
        taskName: 1,
        taskDescription: 1,
        createdAt: 1
    };
};
exports.getAllMaintenanceTaskExcelAttributes = () => {
    return {
        taskCode: 1,
        taskName: 1,
        taskDescription: 1,
        equipment: "$equipment.equipmentName",
        priority: 1,
        frequency: 1,
        estimatedTime: 1,
        taskCategory: 1,
        maintenanceChecklist: "$maintenanceChecklist.checklistName",
        taskStatus: 1,
        createdAt: 1
    };
};

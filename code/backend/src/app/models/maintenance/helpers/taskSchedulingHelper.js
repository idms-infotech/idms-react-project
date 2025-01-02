exports.getAllTaskSchedulingAttributes = () => {
    return {
        createdAt: 1,
        scheduleCode: 1,
        scheduleName: 1,
        equipmentName: 1,
        maintenanceTaskCode: "$maintenanceTask.taskCode",
        frequency: 1,
        priority: 1,
        scheduleDate: {$dateToString: {format: "%d-%m-%Y", date: "$scheduleDate"}},
        startDate: 1,
        endDate: 1,
        description: 1,
        startDateS: 1,
        endDateS: 1,
        status: 1
    };
};

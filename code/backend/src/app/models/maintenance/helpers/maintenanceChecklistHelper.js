exports.getAllMaintenanceChecklistAttributes = () => {
    return {
        checklistCode: 1,
        checklistName: 1,
        equipmentName: "$equipment.equipment",
        checklistDescription: 1,
        checklistCategory: 1,
        checklistNotes: 1,
        status: 1,
        createdAt: 1
    };
};

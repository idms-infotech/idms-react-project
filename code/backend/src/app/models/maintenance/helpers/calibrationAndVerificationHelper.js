exports.getAllCalibrationAndVerificationAttributes = () => {
    return {
        equipmentCode: "$equipment.equipmentCode",
        calibrationDate: {$dateToString: {format: "%d-%m-%Y", date: "$calibrationDate"}},
        calibrationDue: {$dateToString: {format: "%d-%m-%Y", date: "$calibrationDue"}},
        calibrationAgency: 1,
        calibrationResult: 1,
        remarks: 1,
        createdAt: 1
    };
};
exports.getAllCalibrationAndVerificationReportsAttributes = () => {
    return {
        equipmentCode: "$equipment.assetCode",
        equipmentName: "$equipment.assetName",
        equipmentType: "$equipment.assetType",
        calibrationDate: {$dateToString: {format: "%d-%m-%Y", date: "$calibrationDate"}},
        calibrationAgency: 1
    };
};

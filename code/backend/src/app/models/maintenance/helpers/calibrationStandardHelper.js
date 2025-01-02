exports.getAllCalibrationStandardAttributes = () => {
    return {
        standardCode: 1,
        standardName: 1,
        standardType: 1,
        status: 1,
        createdAt: 1
    };
};
exports.getAllCalibrationStandardExcelAttributes = () => {
    return {
        standardCode: 1,
        standardName: 1,
        standardType: 1,
        measurementRange: 1,
        calibrationMethod: 1,
        calibrationInterval: 1,
        traceability: 1,
        lastCalibrationDateS: {$dateToString: {format: "%d-%m-%Y", date: "$lastCalibrationDate"}},
        calibrationAgency: 1,
        standardLocation: 1,
        calibrationCost: 1,
        status: 1,
        createdAt: 1
    };
};

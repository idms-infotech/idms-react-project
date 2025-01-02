exports.getAllMaintenanceMetricsAttributes = () => {
    return {
        metricCode: 1,
        metricName: 1,
        metricDescription: 1,
        unitOfMeasure: 1,
        metricFormula: 1,
        calculationMethod: 1,
        createdAt: 1
    };
};
exports.getAllMaintenanceMetricsExcelAttributes = () => {
    return {
        metricCode: 1,
        metricName: 1,
        metricCategory: 1,
        calculationMethod: 1,
        metricDescription: 1,
        unitOfMeasure: 1,
        targetValue: 1,
        thresholds: 1,
        frequency: 1,
        refRangeFrom: 1,
        refRangeTo: 1,
        formula: 1,
        targetDescription: 1,
        lastUpdated: 1,
        metricStatus: 1,
        createdAt: 1
    };
};

const {getAllQualityEquipmentCount} = require("../../maintenance/qualityEquipment/qualityEquipment");
const {
    getAllWorkOrderCompletedRate,
    getMonthlyMaintenanceCost,
    getMonthlyWOStatusCount,
    getYTDMaintenanceCost
} = require("../../maintenance/workOrderGeneration/workOrderGeneration");
const {getAllCompletedTaskSchedule} = require("../../maintenance/taskSchedule/taskSchedule");
const {
    getAllCalibrationDueCount,
    getTotalNoOfInstrumentDueForCalibrationPerDay
} = require("../../maintenance/calibrationAndVerification/calibrationAndVerification");
const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");
exports.maintenance = async company => {
    try {
        const [
            qualityEquipmentCount,
            ytdEquipmentCost,
            taskScheduleCompleted,
            workOrderCompletedRate,
            calibrationDueCount,
            monthlyMaintenanceCost,
            monthlyWOStatusCount,
            totalNoOfDueCalibration
        ] = await Promise.all([
            getAllQualityEquipmentCount(company),
            getYTDMaintenanceCost(company),
            getAllCompletedTaskSchedule(company),
            getAllWorkOrderCompletedRate(company),
            getAllCalibrationDueCount(company),
            getMonthlyMaintenanceCost(company),
            getMonthlyWOStatusCount(company),
            getTotalNoOfInstrumentDueForCalibrationPerDay(company)
        ]);
        let output = {
            barMonthlyMaintenanceCost: {
                labels: monthlyMaintenanceCost?.months || [],
                datasets: [{data: monthlyMaintenanceCost?.orders || []}]
            },
            barMonthlyWOStatusCount: {
                labels: monthlyWOStatusCount?.status || [],
                datasets: [{data: monthlyWOStatusCount?.data || []}]
            },
            equipmentsData: 0,
            equipmentsDataCount: 0,
            assetsDataCount: 0,
            assetsDataCost: 0,
            qualityEquipmentCount: qualityEquipmentCount || 0,
            ytdEquipmentCost: ytdEquipmentCost || 0,
            workOrderCompletedRate: workOrderCompletedRate || 0,
            calibrationDueCount: calibrationDueCount || 0,
            taskScheduleCompleted: taskScheduleCompleted?.percentage || 0,
            taskScheduleEfficiency: taskScheduleCompleted?.efficiency || 0,
            ytdCreditNote: 0,
            totalNoOfDueCalibrationPerDay: totalNoOfDueCalibration || 0,
            unit: "Lakh"
        };
        memoryCacheHandler.put("maintenance", {});
        memoryCacheHandler.put("maintenance", output);
        return output;
    } catch (e) {
        console.error(e);
    }
};

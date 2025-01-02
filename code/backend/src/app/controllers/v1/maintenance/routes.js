const router = require("express").Router();

const maintenanceTask = require("./maintenanceTask/routes");
const calibrationStandard = require("./calibrationStandard/routes");
const qualityEquipment = require("./qualityEquipment/routes");
const maintenanceTechnician = require("./maintenanceTechnician/routes");
const maintenanceChecklist = require("./maintenanceChecklist/routes");
const maintenanceWarranty = require("./maintenanceWarranty/routes");
const maintenanceMetrics = require("./maintenanceMetrics/routes");
const maintenanceScheduleCreation = require("./maintenanceScheduleCreation/routes");
const workOrderGeneration = require("./workOrderGeneration/routes");
const calibrationAndVerification = require("./calibrationAndVerification/routes");
const taskSchedule = require("./taskSchedule/routes");

router.use("/maintenanceTask", maintenanceTask);
router.use("/calibrationStandard", calibrationStandard);
router.use("/qualityEquipment", qualityEquipment);
router.use("/maintenanceTechnician", maintenanceTechnician);
router.use("/maintenanceChecklist", maintenanceChecklist);
router.use("/maintenanceWarranty", maintenanceWarranty);
router.use("/maintenanceMetrics", maintenanceMetrics);
router.use("/maintenanceScheduleCreation", maintenanceScheduleCreation);
router.use("/workOrderGeneration", workOrderGeneration);
router.use("/calibrationAndVerification", calibrationAndVerification);
router.use("/taskSchedule", taskSchedule);

module.exports = router;

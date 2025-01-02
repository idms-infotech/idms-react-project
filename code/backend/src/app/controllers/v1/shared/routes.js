const router = require("express").Router();
const awsRepository = require("../../../helpers/AWSHelpers");

const SharedCtrl = require("./shared");

router.post("/upload", awsRepository.postS3Upload.single("file"), SharedCtrl.postUpload);

router.get("/url", SharedCtrl.getSignUrlToDownload);

router.put("/remove", SharedCtrl.deleteMedia);

module.exports = router;

const MESSAGES = require("../../../helpers/messages.options");
const OPTIONS = require("../../../helpers/global.options").OPTIONS;
const {generateURl, generateResponse} = require("../../../helpers/global.options");
const {resCode} = MESSAGES;
let AWS_OPTIONS = require("../../../../config/aws");
const AWS = require("aws-sdk");
const awsRepository = require("../../../helpers/AWSHelpers");

let accessKeyId = AWS_OPTIONS.AWS_ACCESS_KEY;
let secretAccessKey = AWS_OPTIONS.AWS_SECRET_KEY;
let s3Bucket = AWS_OPTIONS.AWS_S3_BUCKET;

AWS.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: AWS_OPTIONS.s3Region
});
let s3 = new AWS.S3();

exports.postUpload = async (req, res) => {
    if (req.file) {
        req.file["location"] = generateURl(req.file.key);
        return res.status(resCode.HTTP_OK).json(
            generateResponse(resCode.HTTP_OK, {
                data: req.file,
                url: generateURl(req.file.key)
            })
        );
    } else {
        console.error(errors);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.status(resCode.HTTP_INTERNAL_SERVER_ERROR).json(
            generateResponse(resCode.HTTP_INTERNAL_SERVER_ERROR, errors)
        );
        throw new Error(e);
    }
};

exports.getSignUrlToDownload = async (req, res) => {
    try {
        let splitPaths = req.query.filePath;
        let params = {
            Bucket: s3Bucket,
            Key: splitPaths
        };
        const filename = req.query.filePath.split("post/");
        const metaData = await s3.headObject(params).promise();

        params.ResponseContentDisposition = `attachment; filename=${filename[1]}`;
        const source = s3.getSignedUrl("getObject", params);
        metaData.fileSize = 0;
        if (metaData && metaData.ContentLength) {
            metaData.fileSize = (metaData.ContentLength / (1024 * 1024)).toPrecision(2);
            metaData.fileType = metaData.ContentType;
        }
        return res.status(resCode.HTTP_OK).json(generateResponse(resCode.HTTP_OK, {source, metaData}));
    } catch (e) {
        customErrorLogger(e);
        const errors = "Oops! something went wrong.";
        res.status(resCode.HTTP_INTERNAL_SERVER_ERROR).json(
            generateResponse(resCode.HTTP_INTERNAL_SERVER_ERROR, errors)
        );
    }
};

exports.deleteMedia = async (req, res) => {
    try {
        if (req.body.type) {
            await awsRepository.removeAllFiles(req.body.data);
        }
        return res
            .status(resCode.HTTP_OK)
            .json(generateResponse(resCode.HTTP_OK, {message: MESSAGES.apiSuccessStrings.DELETED("Images")}));
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.status(resCode.HTTP_INTERNAL_SERVER_ERROR).json(
            generateResponse(resCode.HTTP_INTERNAL_SERVER_ERROR, errors)
        );
        throw new Error(e);
    }
};

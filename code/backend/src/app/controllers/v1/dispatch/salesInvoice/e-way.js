const axios = require("axios");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {updateSalesInvoiceOnEwayBillGenerate} = require("./salesInvoice");
const {CONSTANTS} = require("../../../../../config/config");
const {appendFile} = require("../../../../helpers/utility");
exports.eWayBillGenerate = asyncHandler(async (req, res) => {
    try {
        console.info("req.body", req.body);
        const config = {
            method: "post",
            url: "https://my.gstzen.in/~gstzen/a/ewbapi/generate/",
            headers: {
                "Content-Type": "application/json",
                Token: CONSTANTS.eWayToken,
                gstin: req.body.fromGstin
            },
            data: req.body
        };
        let response = await axios(config);
        console.info("response", response.status);
        console.info("response", response.data);
        appendFile("../../../../../../response.log", JSON.stringify(response.data));

        if (response.data.ewayBillNo) {
            await updateSalesInvoiceOnEwayBillGenerate(req.body.salesInvoiceId, {
                validUpto: response.data.validUpto,
                ewayBillNo: response.data.ewayBillNo,
                ewayBillDate: response.data.ewayBillDate,
                EWayBillPdfUrl: response.data.EWayBillPdfUrl,
                EWayBillQrCodeUrl: response.data.EWayBillQrCodeUrl,
                eWayBillStatus: response.data.eWayBillStatus
            });
        }
        res.success({
            message: response.data.message
        });
    } catch (e) {
        console.error("Generate E-Way", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.eInvoiceGenerate = asyncHandler(async (req, res) => {
    try {
        console.log("req.body", req.body);
        const config = {
            method: "post",
            url: "https://my.gstzen.in/~gstzen/a/post-einvoice-data/einvoice-json/",
            headers: {
                "Content-Type": "application/json",
                Token: CONSTANTS.eWayToken
            },
            data: req.body
        };
        let response = await axios(config);
        console.log("response", response.status);
        console.log("response", response.data);
        appendFile("../../../../../../response.log", JSON.stringify(response.data));
        if (response.data.Irn) {
            await updateSalesInvoiceOnEwayBillGenerate(req.body.salesInvoiceId, {
                Irn: response.data.Irn,
                AckDt: response.data.AckDt,
                AckNo: response.data.AckNo,
                SignedQrCodeImgUrl: response.data.SignedQrCodeImgUrl,
                InvoicePdfUrl: response.data.InvoicePdfUrl,
                IrnStatus: response.data.IrnStatus
            });
        }
        res.success({
            message: response.data.message
        });
    } catch (e) {
        console.error("Generate E-Invoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

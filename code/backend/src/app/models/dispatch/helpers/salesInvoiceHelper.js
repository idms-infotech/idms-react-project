exports.getAllReportsAttributes = () => {
    return {
        salesInvoiceNumber: 1,
        salesInvoiceTotalTaxAmount: "$salesInvoiceTotalTaxAmount",
        salesInvoiceTotalCGSTAmount: 1,
        salesInvoiceTotalSGSTAmount: 1,
        salesInvoiceTotalIGSTAmount: 1,
        salesInvoiceTotalUGSTAmount: 1,
        salesInvoiceTotalAmount: "$salesInvoiceTotalAmount",
        salesInvoiceTotalAmountWithTax: {$round: ["$salesInvoiceTotalAmountWithTax", 2]},
        salesInvoiceDate: 1,
        salesInvoiceDateS: 1,
        customerName: "$customer.customerName",
        GSTIN: "$customer.GSTIN",
        customer: "$customer._id",
        company: 1,
        createdAt: 1,
        EWayBillPdfUrl: 1,
        EWayBillQrCodeUrl: 1,
        ewayBillNo: 1,
        InvoicePdfUrl: 1,
        SignedQrCodeImgUrl: 1,
        Irn: 1,
        AckNo: 1,
        eInvoiceStatus: 1,
        eWayBillStatus: 1
    };
};
exports.getAllSalesRegisterReportsAttributes = () => {
    return {
        salesInvoiceNumber: 1,
        salesInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$salesInvoiceDate"}},
        customerName: "$customer.customerName",
        GSTIN: "$customer.GSTIN",
        totalTaxableAmt: "$salesInvoiceTotalAmount",
        RCM: "No",
        salesInvoiceTotalCGSTAmount: {$round: ["$salesInvoiceTotalCGSTAmount", 2]},
        salesInvoiceTotalSGSTAmount: {$round: ["$salesInvoiceTotalSGSTAmount", 2]},
        salesInvoiceTotalIGSTAmount: {$round: ["$salesInvoiceTotalIGSTAmount", 2]},
        salesInvoiceTotalUGSTAmount: {$round: ["$salesInvoiceTotalUGSTAmount", 2]},
        salesInvoiceTotalAmountWithTax: {$round: ["$salesInvoiceTotalAmountWithTax", 2]},
        netAmount: {$round: ["$salesInvoiceTotalAmountWithTax", 2]},
        roundedOff: 1
    };
};
exports.getAllSalesInvoiceAttributes = () => {
    return {
        salesInvoiceNumber: 1,
        salesInvoiceTotalAmountWithTax: 1,
        salesInvoiceDate: 1,
        salesInvoiceDateS: 1,
        customerName: "$customer.customerName"
    };
};

exports.getAllSILineDetailsAttributes = () => {
    return {
        salesInvoiceNumber: 1,
        salesInvoiceDate: 1,
        customerPartNo: "$customerInfo.customerPartNo",
        SKUDescription: "$SKU.SKUDescription",
        SKUName: "$SKU.SKUName",
        SKUCode: "$SKU.SKUNo",
        UOM: "$SKU.primaryUnit",
        HSNCode: "$salesInvoiceDetails.HSNCode",
        dispatchQty: {$round: ["$salesInvoiceDetails.dispatchQty", 2]},
        salesInvoiceUnitRate: {$round: ["$salesInvoiceDetails.salesInvoiceUnitRate", 2]},
        salesInvoiceLineValue: {$round: ["$salesInvoiceDetails.salesInvoiceLineValue", 2]},
        IGSTAmount: {$round: ["$IGSTAmount", 2]},
        SGSTAmount: {$round: ["$SGSTAmount", 2]},
        CGSTAmount: {$round: ["$CGSTAmount", 2]},
        salesInvoiceTotalAmount: {$round: ["$salesInvoiceTotalAmount", 2]},
        salesInvoiceTotalCGSTAmount: {$round: ["$salesInvoiceTotalCGSTAmount", 2]},
        salesInvoiceTotalSGSTAmount: {$round: ["$salesInvoiceTotalSGSTAmount", 2]},
        salesInvoiceTotalIGSTAmount: {$round: ["$salesInvoiceTotalIGSTAmount", 2]},
        salesInvoiceTotalUGSTAmount: {$round: ["$salesInvoiceTotalUGSTAmount", 2]},
        salesInvoiceTotalTaxAmount: {$round: [{$add: ["$IGSTAmount", "$CGSTAmount", "$SGSTAmount"]}, 2]},
        salesInvoiceTotalAmountWithTax: {$round: ["$salesInvoiceTotalAmountWithTax", 2]},
        lineValueWithTax: {
            $round: [
                {$add: ["$IGSTAmount", "$CGSTAmount", "$SGSTAmount", "$salesInvoiceDetails.salesInvoiceLineValue"]},
                2
            ]
        },
        salesInvoiceDateS: 1,
        customerName: "$customer.customerName",
        region: "$customer.region",
        GSTIN: "$customer.GSTIN",
        customer: "$customer._id",
        shipToGSTIN: "$customer.GSTIN",
        shipToCustomer: "$customer.customerName",
        company: 1,
        igst: "$salesInvoiceDetails.igst",
        cgst: "$salesInvoiceDetails.cgst",
        sgst: "$salesInvoiceDetails.sgst",
        batchDate: {$dateToString: {format: "%d-%m-%Y", date: "$salesInvoiceDetails.batchDate"}},
        tBatchNo: "$salesInvoiceDetails.tBatchNo",
        IGSTAmountWithTD: {$round: ["$IGSTAmountWithTD", 2]},
        SGST_CGSTAmountWithTD: {$round: ["$SGST_CGSTAmountWithTD", 2]},
        TD: 1,
        createdAt: 1
    };
};

exports.getAllSalesReportByBatchAttributes = () => {
    return {
        salesInvoiceNumber: 1,
        salesInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$salesInvoiceDate"}},
        region: "$customer.region",
        SKUDescription: "$SKU.SKUDescription",
        SKUName: "$SKU.SKUName",
        SKUCode: "$SKU.SKUNo",
        UOM: "$salesInvoiceDetails.unit",
        dispatchQty: {$round: ["$salesInvoiceDetails.dispatchQty", 2]},
        tBatchNo: "$salesInvoiceDetails.tBatchNo",
        customerName: "$customer.customerName",
        FGStockDetails: {
            $map: {
                input: "$salesInvoiceDetails.FGStockDetails",
                as: "details",
                in: {
                    batchDate: {$dateToString: {format: "%d-%m-%Y", date: "$$details.FGBatchDate"}},
                    batchQty: "$$details.dispatchQty"
                }
            }
        }
    };
};

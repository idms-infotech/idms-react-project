exports.poCreate = {
    purchaseCategory: "Domestic",
    supplier: "65b0be8b505bdb42ec097fdd",
    changedPaymentTerms: "30 Days",
    POType: "Standard PO",
    PONumber: "DP/2324/0018",
    PODate: "2024-01-24",
    POValidity: "2024-02-24",
    orderReference: "1",
    currency: "INR",
    deliveryLocation: "Factory",
    freightTerms: "FOR - Free On Road",
    transporter: "Blue Dart Express ",
    deliveryDate: "2024-01-24",
    PODetails: [
        {
            itemCode: "M10/0117",
            gst: 6,
            igst: 6,
            cgst: 6,
            sgst: 9,
            ugst: 6,
            primaryUnit: "Can",
            secondaryUnit: "Mtr",
            secondaryToPrimaryConversion: "1",
            POQty: 10,
            balancedQty: 10,
            lineValue: 20,
            linePPV: 210,
            unitConversion: "1 Mtr - 1 Can",
            item: "65b0bf5e2ec59f4dfa0d2828",
            name: "chair",
            description: "ok",
            UOM: "Can",
            standardRate: 23,
            purchaseRate: 2,
            deliveryDate: "2024-01-24",
            POLineNumber: 1
        }
    ],
    remarks: "",
    PORemarks: "ok",
    totalLineValue: "20.00",
    netPOValue: "70.00",
    totalPPV: "210.00",
    cancellationReason: "",
    POStatus: "Awaiting Approval",
    otherCharges: {
        action: "create",
        packagingAndForwarding: 10,
        freight: 10,
        insurance: 10,
        loadingAndUnloading: 10,
        miscellaneous: 10,
        totalAmount: "50.00"
    }
};
exports.poInvalid = {
    purchaseCategory: "",
    supplier: "",
    changedPaymentTerms: "",
    POType: "",
    PONumber: "",
    PODate: "",
    POValidity: "",
    orderReference: "",
    currency: "",
    deliveryLocation: "",
    freightTerms: "",
    deliveryDate: "",
    PODetails: [
        {
            itemCode: "",
            gst: 6,
            igst: 6,
            cgst: 6,
            sgst: 9,
            ugst: 6,
            primaryUnit: "",
            secondaryUnit: "",
            secondaryToPrimaryConversion: "",
            POQty: 10,
            balancedQty: 10,
            lineValue: 20,
            linePPV: 210,
            unitConversion: "",
            item: "",
            name: "",
            description: "ok",
            UOM: "",
            standardRate: 23,
            purchaseRate: 2,
            deliveryDate: "2024-01-24",
            POLineNumber: 1
        }
    ],
    remarks: "",
    PORemarks: "k",
    totalLineValue: "20.00",
    netPOValue: "70.00",
    totalPPV: "210.00",
    cancellationReason: "",
    POStatus: "",
    otherCharges: {
        action: "",
        packagingAndForwarding: 10,
        freight: 10,
        insurance: 10,
        loadingAndUnloading: 10,
        miscellaneous: 10,
        totalAmount: "50.00"
    }
};

exports.poUpdate = {
    purchaseCategory: "Domestic",
    supplier: "65b0be8b505bdb42ec097fdd",
    changedPaymentTerms: "30 Days",
    POType: "Standard PO",
    PONumber: "DP/2324/0018",
    PODate: "2024-01-24",
    POValidity: "2024-02-24",
    orderReference: "1",
    currency: "INR",
    deliveryLocation: "Factory",
    freightTerms: "FOR - Free On Road",
    transporter: "Blue Dart Express ",
    deliveryDate: "2024-01-24",
    PODetails: [
        {
            itemCode: "M10/0117",
            gst: 6,
            igst: 6,
            cgst: 6,
            sgst: 9,
            ugst: 6,
            primaryUnit: "Can",
            secondaryUnit: "Mtr",
            secondaryToPrimaryConversion: "1",
            POQty: 10,
            balancedQty: 10,
            lineValue: 20,
            linePPV: 210,
            unitConversion: "1 Mtr - 1 Can",
            item: "65b0bf5e2ec59f4dfa0d2828",
            name: "chair",
            description: "ok",
            UOM: "Can",
            standardRate: 23,
            purchaseRate: 2,
            deliveryDate: "2024-01-24",
            POLineNumber: 1
        }
    ],
    remarks: "",
    PORemarks: "ok",
    totalLineValue: "20.00",
    netPOValue: "70.00",
    totalPPV: "210.00",
    cancellationReason: "",
    POStatus: "Awaiting Approval",
    otherCharges: {
        action: "create",
        packagingAndForwarding: 10,
        freight: 10,
        insurance: 10,
        loadingAndUnloading: 10,
        miscellaneous: 10,
        totalAmount: "50.00"
    }
};

exports.grnData = {
    GRNNumber: "GRN/0123",
    GRNDate: "2024-01-29",
    PONumber: "65b7551771278ced22a2bbec",
    PODate: "2024-01-24",
    supplier: "65b0be8b505bdb42ec097fdd",
    supplierInvoiceRef: "1",
    supplierInvoiceRefDate: "2024-01-29",
    GRNStatus: "Awaiting Approval",
    remarks: "ok",
    transporterName: "Blue Dart Express ",
    goodsDeliveryDate: "2024-01-29",
    freightChargesPaid: 3,
    otherChargesPaid: 3,
    AWB_LR_BR: 3,
    GRNDetails: [
        {
            POLineNumber: 1,
            GRNLineNumber: 1,
            item: "65b0bf5e2ec59f4dfa0d2828",
            itemCode: "M10/0117",
            itemName: "chair",
            itemDescription: "ok",
            conversionOfUnits: "1 Mtr - 1 Can",
            standardRate: 23,
            purchaseRate: 2,
            UOM: "Can",
            POQty: 10,
            GRNQty: 10,
            invoicedQty: 10,
            balancedQty: 10,
            canceledQty: 0,
            batchDate: "2024-01-29"
        }
    ],
    isTaxInvoice: true,
    isEWayBill: false,
    isDeliveryChallan: false,
    isPackingList: false,
    isCOATC: false,
    deliveryLocation: "Factory",
    cancellationReason: null,
    storageLocationMapping: {
        subLocation: "2",
        rowNo: "2",
        rackNo: "2",
        binNo: "2",
        otherId: "2"
    }
};

exports.grnInvalidData = {
    GRNNumber: "",
    GRNDate: "",
    PONumber: "",
    PODate: "",
    supplier: "",
    supplierInvoiceRef: "",
    supplierInvoiceRefDate: "",
    GRNStatus: "",
    remarks: "",
    transporterName: " ",
    goodsDeliveryDate: ""
};

exports.grnUpdate = {
    GRNNumber: "GRN/0123",
    GRNDate: "2024-01-29",
    PONumber: "65b4af2c64da91f054ff65ef",
    PODate: "2024-01-24",
    supplier: "65b0be8b505bdb42ec097fdd",
    supplierInvoiceRef: "1",
    supplierInvoiceRefDate: "2024-01-29",
    GRNStatus: "Awaiting Approval",
    remarks: "ok",
    transporterName: "Blue Dart Express ",
    goodsDeliveryDate: "2024-01-29",
    freightChargesPaid: 3,
    otherChargesPaid: 3,
    AWB_LR_BR: 3,
    GRNDetails: [
        {
            POLineNumber: 1,
            GRNLineNumber: 1,
            item: "65b0bf5e2ec59f4dfa0d2828",
            itemCode: "M10/0117",
            itemName: "chair",
            itemDescription: "ok",
            conversionOfUnits: "1 Mtr - 1 Can",
            standardRate: 23,
            purchaseRate: 2,
            UOM: "Can",
            POQty: 10,
            GRNQty: 10,
            invoicedQty: 10,
            balancedQty: 10,
            canceledQty: 0,
            batchDate: "2024-01-29"
        }
    ],
    isTaxInvoice: true,
    isEWayBill: false,
    isDeliveryChallan: false,
    isPackingList: false,
    isCOATC: false,
    deliveryLocation: "Factory",
    cancellationReason: null,
    storageLocationMapping: {
        subLocation: "2",
        rowNo: "2",
        rackNo: "2",
        binNo: "2",
        otherId: "2"
    }
};

exports.mrnCreate = {
    MRNNumber: "MRN/0114",
    MRNDate: "2024-01-29",
    supplier: "65b0be8b505bdb42ec097fdd",
    supplierInvoice: "1",
    supplierDate: "2024-01-29",
    MRNStatus: "Released",
    MRNDetails: [
        {
            MRNLineNumber: 1,
            item: "65b0bf5e2ec59f4dfa0d2828",
            itemCode: "M10/0117",
            itemName: "chair",
            shelfLife: 3,
            QCLevels: "L2",
            QCLevelsDetails: [],
            itemDescription: "ok",
            conversionOfUnits: "1 Mtr - 1 Can",
            batchNo: "1",
            batchDate: "2024-01-29",
            UOM: "Can",
            GRNQty: 10,
            balancedQty: 10,
            standardRate: 23,
            purchaseRate: 2,
            rejectedQty: 0,
            releasedQty: 10
        }
    ],
    deliveryLocation: "Factory",
    GRNRemarks: "ok",
    MRNRemarks: null
};

exports.mrnInvalid = {
    MRNNumber: "",
    MRNDate: "",
    GRNNumber: "",
    supplier: "",
    supplierInvoice: "",
    supplierDate: "",
    MRNStatus: ""
};

exports.mrnREJECTUpdate = {
    MRNNumber: "MRN/0114",
    MRNDate: "2024-01-29",
    supplier: "65b0be8b505bdb42ec097fdd",
    supplierInvoice: "1",
    supplierDate: "2024-01-29",
    MRNStatus: "Rejected",
    MRNDetails: [
        {
            MRNLineNumber: 1,
            item: "65b0bf5e2ec59f4dfa0d2828",
            itemCode: "M10/0117",
            itemName: "chair",
            shelfLife: 3,
            QCLevels: "L2",
            QCLevelsDetails: [],
            itemDescription: "ok",
            conversionOfUnits: "1 Mtr - 1 Can",
            batchNo: "1",
            batchDate: "2024-01-29",
            UOM: "Can",
            rejectedQty: 10
        }
    ]
};

exports.mrnPartialRelease = {
    MRNNumber: "MRN/0114",
    MRNDate: "2024-01-29",
    supplier: "65b0be8b505bdb42ec097fdd",
    supplierInvoice: "1",
    supplierDate: "2024-01-29",
    MRNStatus: "Partially Released",
    MRNDetails: [
        {
            MRNLineNumber: 1,
            item: "65b0bf5e2ec59f4dfa0d2828",
            itemCode: "M10/0117",
            itemName: "chair",
            shelfLife: 3,
            QCLevels: "L2",
            QCLevelsDetails: [],
            itemDescription: "ok",
            conversionOfUnits: "1 Mtr - 1 Can",
            batchNo: "1",
            batchDate: "2024-01-29",
            UOM: "Can",
            rejectedQty: 8,
            releasedQty: 2
        }
    ]
};

exports.mrnRelease = {
    MRNNumber: "MRN/0114",
    MRNDate: "2024-01-29",
    supplier: "65b0be8b505bdb42ec097fdd",
    supplierInvoice: "1",
    supplierDate: "2024-01-29",
    MRNStatus: "Released",
    MRNDetails: [
        {
            MRNLineNumber: 1,
            item: "65b0bf5e2ec59f4dfa0d2828",
            itemCode: "M10/0117",
            itemName: "chair",
            shelfLife: 3,
            QCLevels: "L2",
            QCLevelsDetails: [],
            itemDescription: "ok",
            conversionOfUnits: "1 Mtr - 1 Can",
            batchNo: "1",
            batchDate: "2024-01-29",
            UOM: "Can",
            GRNQty: 10,
            balancedQty: 10,
            standardRate: 23,
            purchaseRate: 2,
            rejectedQty: 0,
            releasedQty: 10
        }
    ]
};

exports.GINCreate = {
    GINDate: "2024-02-07",
    GINNumber: "GIN0105",
    MRNNumber: "65c27bdfe7e8114a8e833406",
    MRNDate: "2024-01-29",
    purchaseCategory: "Domestic",
    supplier: "65b0be8b505bdb42ec097fdd",
    supplierInvoice: "1",
    supplierInvoiceDate: "2024-01-29",
    currency: "INR",
    GINDetails: [
        {
            item: "65b0bf5e2ec59f4dfa0d2828",
            GINLineNumber: 1,
            MRNLineNumber: 1,
            itemCode: "M10/0117",
            itemName: "chair",
            itemSubCategory: "General",
            itemType: "M10 - (RM) Print Media",
            UOM: "Can",
            GINQty: 10,
            standardRate: 23,
            purchaseRate: 2,
            purchaseRateUSD: 2,
            purchaseRatINR: 2,
            lineValueINR: 20,
            batchDate: "2024-02-07",
            balancedQty: 0,
            rejectedQty: 0,
            releasedQty: 10
        }
    ],
    deliveryLocation: "Factory",
    remarks: null,
    storageLocationMapping: {
        subLocation: "2",
        rowNo: "2",
        rackNo: "2",
        binNo: "2",
        otherId: "2"
    },
    GRNDetails: {}
};

exports.GINInvalid = {
    GINDate: "",
    GINNumber: "",
    MRNNumber: "",
    MRNDate: "",
    purchaseCategory: "",
    supplier: "",
    supplierInvoice: "",
    supplierInvoiceDate: "",
    currency: "",
    GRNDetails: {}
};

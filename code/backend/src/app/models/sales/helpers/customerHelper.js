exports.getAllCustomerAttributes = () => {
    return {
        customerCode: 1,
        customerName: 1,
        customerCategory: 1,
        country: "$customerBillingAddress.country",
        GSTIN: 1,
        customerBillingAddress: 1,
        customerShippingAddress: 1,
        createdAt: 1,
        printQRCodeOnInvoice: 1,
        printDSOnInvoice: 1,
        venderCode: 1,
        showPANNo: 1,
        showEximCode: 1,
        TCSOnScrap: 1,
        TCSOnVendor: 1,
        customerType: 1,
        GSTClassification: 1,
        customerCurrency: 1,
        state: "$customerBillingAddress.state",
        isCustomerActive: 1
    };
};
exports.getAllCustomerExcelAttributes = () => {
    return {
        customerCode: 1,
        customerName: 1,
        customerType: 1,
        customerNickName: 1,
        customerCategory: 1,
        region: 1,
        customerPAN: 1,
        GSTClassification: 1,
        GSTIN: 1,
        customerCurrency: 1,
        printQRCodeOnInvoice: 1,
        printDSOnInvoice: 1,
        venderCode: 1,
        showPANNo: 1,
        showEximCode: 1,
        TCSOnScrap: 1,
        TCSOnVendor: 1,
        creditLimit: 1,
        customerPaymentTerms: 1,
        country: "$customerBillingAddress.country",
        state: "$customerBillingAddress.state",
        city: "$customerBillingAddress.city",
        pinCode: "$customerBillingAddress.pinCode",
        line1: "$customerBillingAddress.line1",
        line2: "$customerBillingAddress.line2",
        line3: "$customerBillingAddress.line3",
        line4: "$customerBillingAddress.line4",
        isCustomerActive: 1,
        contactPersonName: "$customerContactInfo.contactPersonName",
        contactPersonDesignation: "$customerContactInfo.contactPersonDesignation",
        contactPersonDepartment: "$customerContactInfo.contactPersonDepartment",
        contactPersonNumber: "$customerContactInfo.contactPersonNumber",
        contactPersonEmail: "$customerContactInfo.contactPersonEmail"
    };
};
exports.getAllCustomerReportsAttributes = () => {
    return {
        customerCode: 1,
        customerName: 1,
        createdAt: 1,
        customerCategory: 1,
        isCustomerActive: {$cond: [{$eq: ["$isCustomerActive", "A"]}, "Active", "Inactive"]},
        customerCity: "$customerBillingAddress.city",
        customerState: "$customerBillingAddress.state",
        customerPinCode: "$customerBillingAddress.pinCode",
        customerContactPersonName: "$customerContactInfo.contactPersonName",
        customerContactPersonNumber: "$customerContactInfo.contactPersonNumber",
        customerContactPersonEmail: "$customerContactInfo.contactPersonEmail"
    };
};

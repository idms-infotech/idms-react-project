const {CONSTANTS} = require("../../../../config/config");

exports.getAllSupplierAttributes = () => {
    return {
        supplierCode: 1,
        supplierName: 1,
        GSTClassification: 1,
        supplierGST: 1,
        supplierCurrency: 1,
        country: "$supplierBillingAddress.country",
        state: "$supplierBillingAddress.state",
        isSupplierActive: {$cond: [{$eq: ["$isSupplierActive", "A"]}, "Active", "Inactive"]},
    };
};
exports.getAllSupplierExcelAttributes = () => {
    return {
        supplierCode: 1,
        supplierName: 1,
        supplierNickName: 1,
        supplierCompanyType: 1,
        supplierPurchaseType: 1,
        supplierPAN: 1,
        GSTClassification: 1,
        supplierGST: 1,
        supplierUdyogAadhar: 1,
        MSMEClassification: 1,
        supplierCurrency: 1,
        supplierPaymentTerms: 1,
        supplierINCOTerms: 1,
        isSupplierActive: {$cond: [{$eq: ["$isSupplierActive", "A"]}, "Active", "Inactive"]},
        supplierLeadTimeInDays: 1,
        country: "$supplierBillingAddress.country",
        state: "$supplierBillingAddress.state",
        city: "$supplierBillingAddress.city",
        district: "$supplierBillingAddress.district",
        pinCode: "$supplierBillingAddress.pinCode",
        befName: "$supplierBankDetails.befName",
        bankName: "$supplierBankDetails.bankName",
        accountNumber: "$supplierBankDetails.accountNumber",
        accountType: "$supplierBankDetails.accountType",
        bankIFSCCode: "$supplierBankDetails.bankIFSCCode",
        bankSwiftCode: "$supplierBankDetails.bankSwiftCode",
        line1: "$supplierBillingAddress.line1",
        line2: "$supplierBillingAddress.line2",
        line3: "$supplierBillingAddress.line3",
        line4: "$supplierBillingAddress.line4",
        supplierContactPersonName: "$supplierContactMatrix.supplierContactPersonName",
        supplierContactPersonDesignation: "$supplierContactMatrix.supplierContactPersonDesignation",
        supplierContactPersonDepartment: "$supplierContactMatrix.supplierContactPersonDepartment",
        supplierContactPersonNumber: "$supplierContactMatrix.supplierContactPersonNumber",
        supplierContactPersonEmail: "$supplierContactMatrix.supplierContactPersonEmail",
        cpaFileUrl: {
            $cond: [{$not: ["$cpaFile"]}, "No", "Yes"]
        }
    };
};
exports.getAllSupplierReportsAttributes = () => {
    return {
        supplierCode: 1,
        supplierName: 1,
        createdAt: 1,
        supplierPurchaseType: 1,
        supplierCity: "$supplierBillingAddress.city",
        supplierState: "$supplierBillingAddress.state",
        supplierContactPersonName: "$supplierContactMatrix.supplierContactPersonName",
        supplierContactPersonNumber: "$supplierContactMatrix.supplierContactPersonNumber",
        supplierContactPersonEmail: "$supplierContactMatrix.supplierContactPersonEmail"
    };
};

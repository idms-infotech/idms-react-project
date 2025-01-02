const {SALES_CATEGORY, COMPANY_SUPPLIER_ID} = require("../mocks/constantData");
const SupplierRepository = require("../models/purchase/repository/supplierRepository");
const CompanyRepository = require("../models/settings/repository/companyRepository");

exports.companySupplierInsert = async function (companyId) {
    try {
        let companyObj = await CompanyRepository.getDocById(companyId);
        let companySupplierObj = {
            _id: COMPANY_SUPPLIER_ID,
            company: companyId ?? null,
            supplierCode: "S0000",
            supplierName: companyObj?.companyName ?? null,
            supplierPurchaseType: SALES_CATEGORY.DOMESTIC_JOB_MANUFACTURER ?? null,
            categoryType: SALES_CATEGORY.DOMESTIC ?? null,
            supplierNickName: companyObj?.companyName ?? null,
            GSTClassification: companyObj?.GSTClassification ?? null,
            // supplierType: "",
            MSMEClassification: "",
            // isSupplierActive: "",
            countryOfOrigin: null,
            supplierCompanyType: null,
            supplierCIN: null,
            supplierUdyogAadhar: companyObj?.udyamRegistrationNo ?? null,
            supplierGST: companyObj?.GSTIN ?? null,
            supplierURD: null,
            supplierPAN: companyObj?.companyPAN ?? null,
            supplierMSMENo: companyObj?.companyMSMENo ?? null,
            supplierVendorCode: null,
            supplierWebsite: null,
            supplierCurrency: companyObj?.accountsDetails?.reportingCurrency ?? null,
            supplierINCOTerms: null,
            supplierPaymentTerms: null,
            supplierUdyam: null,
            cpaFile: null,
            supplierLeadTimeInDays: null,
            supplierBillingAddress: [
                {
                    line1: companyObj?.companyBillingAddress?.addressLine1 ?? null,
                    line2: companyObj?.companyBillingAddress?.addressLine2 ?? null,
                    line3: companyObj?.companyBillingAddress?.addressLine3 ?? null,
                    line4: companyObj?.companyBillingAddress?.addressLine4 ?? null,
                    state: companyObj?.companyBillingAddress?.state ?? null,
                    city: companyObj?.companyBillingAddress?.city ?? null,
                    district: companyObj?.companyBillingAddress?.district ?? null,
                    pinCode: companyObj?.companyBillingAddress?.pinCode ?? null,
                    country: companyObj?.companyBillingAddress?.country ?? null,
                    zone: null
                }
            ],
            supplierShippingAddress: [
                {
                    line1: companyObj?.companyBillingAddress?.addressLine1 ?? null,
                    line2: companyObj?.companyBillingAddress?.addressLine2 ?? null,
                    line3: companyObj?.companyBillingAddress?.addressLine3 ?? null,
                    state: companyObj?.companyBillingAddress?.state ?? null,
                    city: companyObj?.companyBillingAddress?.city ?? null,
                    district: companyObj?.companyBillingAddress?.district ?? null,
                    pinCode: companyObj?.companyBillingAddress?.pinCode ?? null,
                    country: companyObj?.companyBillingAddress?.country ?? null,
                    zone: null
                }
            ],
            supplierContactMatrix: [
                {
                    supplierContactPersonName: companyObj?.contactInfo[0]?.contactPersonName ?? null,
                    supplierContactPersonDesignation: companyObj?.contactInfo[0]?.designation ?? null,
                    supplierContactPersonDepartment: companyObj?.contactInfo[0]?.department ?? null,
                    supplierContactPersonNumber: companyObj?.contactInfo[0]?.companyContactPersonNumber ?? null,
                    supplierContactPersonAltNum: companyObj?.contactInfo[0]?.companyContactPersonAltNum ?? null,
                    supplierContactPersonEmail: companyObj?.contactInfo[0]?.companyContactPersonEmail ?? null,
                    supplierTelNo: companyObj?.contactInfo[0]?.companyTelNo ?? null
                }
            ],
            supplierBankDetails: [
                {
                    befName: companyObj?.companyBefName ?? null,
                    bankName: companyObj?.companyBankName ?? null,
                    accountNumber: companyObj?.companyAccountNumber ?? null,
                    accountType: companyObj?.companyAccType ?? null,
                    bankIFSCCode: companyObj?.companyBankIFSCCode ?? null,
                    bankSwiftCode: companyObj?.swiftCode ?? null
                }
            ]
        };
        const existing = await SupplierRepository.getDocById(COMPANY_SUPPLIER_ID);
        if (!existing) {
            await SupplierRepository.createDoc(companySupplierObj);
            console.info("Company Supplier Created successfully!!");
        }
    } catch (error) {
        throw new Error(error);
    }
};

exports.B2C_CUSTOMER = {
    COLLECTION_NAME: "B2c",
    ADDED_ACTION: "B2C Customer Master created",
    UPDATED_ACTION: "B2C Customer Master updated",
    MODULE_NAME: "B2C Customer",
    MODULE: "BC",
    MODULE_PREFIX: "BC",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.CREDIT_NOTE = {
    COLLECTION_NAME: "CreditNote",
    ADDED_ACTION: "Credit Note Master created",
    UPDATED_ACTION: "Credit Note Master updated",
    MODULE_NAME: "Credit Note",
    MODULE: "CREDIT",
    MODULE_PREFIX: "CN",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.B2B_CUSTOMER = {
    COLLECTION_NAME: "Customer",
    ADDED_ACTION: "B2B Customer Master created",
    UPDATED_ACTION: "B2B Customer Master updated",
    MODULE_NAME: "Customer",
    MODULE: "CUST",
    MODULE_PREFIX: "C",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};

exports.DISPATCH_REQUEST_NOTE = {
    COLLECTION_NAME: "DispatchRequestNote",
    ADDED_ACTION: "DRN created",
    UPDATED_ACTION: "DRN updated",
    MODULE_NAME: "Dispatch Request Note",
    MODULE: "DRN",
    MODULE_PREFIX: "DRN",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.MAP_CATEGORY_HSN = {
    COLLECTION_NAME: "MapCategoryHSN",
    ADDED_ACTION: "Map Category HSN Master created",
    UPDATED_ACTION: "Map Category HSN Master updated",
    MODULE_NAME: "Map Category HSN",
    MODULE: "MAPHSN",
    MODULE_PREFIX: "MAPHSN",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.PAYMENT_TERMS = {
    COLLECTION_NAME: "PaymentTerms",
    ADDED_ACTION: "Payment Terms created",
    UPDATED_ACTION: "Payment Terms updated",
    MODULE_NAME: "Payment Terms",
    MODULE: "PTS",
    MODULE_PREFIX: "PTS",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.PROFORMA_INVOICE = {
    COLLECTION_NAME: "ProformaInvoice",
    ADDED_ACTION: "Proforma Invoice created",
    UPDATED_ACTION: "Proforma Invoice updated",
    MODULE_NAME: "Proforma Invoice",
    MODULE: "PI",
    MODULE_PREFIX: "PI",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.QUOTATION_DSKU = {
    COLLECTION_NAME: "QuotationDSKU",
    ADDED_ACTION: "Quotation created",
    UPDATED_ACTION: "Quotation updated",
    MODULE_NAME: "Quotation",
    MODULE: "Q/",
    MODULE_PREFIX: "Q/",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.QUOTATION_SKU = {
    COLLECTION_NAME: "QuotationSKU",
    ADDED_ACTION: "Quotation created",
    UPDATED_ACTION: "Quotation updated",
    MODULE_NAME: "Quotation",
    MODULE: "Q/",
    MODULE_PREFIX: "Q/",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SALES_HSN = {
    COLLECTION_NAME: "SaleHSN",
    ADDED_ACTION: "Sales HSN Master created",
    UPDATED_ACTION: "Sales HSN Master updated",
    MODULE_NAME: "HSN",
    MODULE: "HSN",
    MODULE_PREFIX: "HSN",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SALES_SAC = {
    COLLECTION_NAME: "SaleSAC",
    ADDED_ACTION: "Sales SAC Master created",
    UPDATED_ACTION: "Sales SAC Master updated",
    MODULE_NAME: "SAC",
    MODULE: "SAC",
    MODULE_PREFIX: "SAC",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SALES_DEBIT_NOTE = {
    COLLECTION_NAME: "SalesDebitNote",
    ADDED_ACTION: "Sales Debit Note Master created",
    UPDATED_ACTION: "Sales Debit Note Master updated",
    MODULE_NAME: "Sales Debit Note",
    MODULE: "SDEBIT",
    MODULE_PREFIX: "DN",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SALES_FORECAST = {
    COLLECTION_NAME: "SalesForecast",
    ADDED_ACTION: "Sales Forecast created",
    UPDATED_ACTION: "Sales Forecast updated",
    MODULE_NAME: "Sales Forecast",
    MODULE: "FC",
    MODULE_PREFIX: "FC",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SALES_ORDER = {
    COLLECTION_NAME: "SalesOrder",
    ADDED_ACTION: "Sales Order created",
    UPDATED_ACTION: "Sales Order updated",
    MODULE_NAME: "Sales Order",
    MODULE: "SO",
    MODULE_PREFIX: "SO/",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SALES_SERVICE_MASTER = {
    COLLECTION_NAME: "SalesServiceMaster",
    ADDED_ACTION: "Sales Service Master created",
    UPDATED_ACTION: "Sales Service Master updated",
    MODULE_NAME: "Sales Service Master",
    MODULE: "SSER",
    MODULE_PREFIX: "SER",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SERVICE_INVOICE = {
    COLLECTION_NAME: "ServiceInvoice",
    ADDED_ACTION: "Service Invoice created",
    UPDATED_ACTION: "Service Invoice updated",
    MODULE_NAME: "Service Invoice",
    MODULE: "SI",
    MODULE_PREFIX: "DTS",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SKU_MASTER = {
    COLLECTION_NAME: "SKUMaster",
    ADDED_ACTION: "SKU Master created",
    UPDATED_ACTION: "SKU Master updated",
    MODULE_NAME: "SKU Master",
    MODULE: "SKU",
    MODULE_PREFIX: "SKU",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.TRANSPORTER_MASTER = {
    COLLECTION_NAME: "Transporter",
    ADDED_ACTION: "Transporter Master created",
    UPDATED_ACTION: "Transporter Master updated",
    MODULE_NAME: "Transporter Master",
    MODULE: "T",
    MODULE_PREFIX: "T",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};

exports.SALES_PRODUCT_MASTER = {
    COLLECTION_NAME: "SalesProductMaster",
    ADDED_ACTION: "Mould Master created",
    UPDATED_ACTION: "Mould Master updated",
    MODULE_NAME: "Mould Master",
    MODULE: "SalesProductMaster",
    MODULE_PREFIX: "P/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
exports.CUSTOMER_DISCOUNT_MANAGEMENT = {
    COLLECTION_NAME: "CustomerDiscountManagement",
    ADDED_ACTION: "Customer Discount Management created",
    UPDATED_ACTION: "Customer Discount Management updated",
    MODULE_NAME: "Customer Discount Management",
    MODULE: "CustomerDiscountManagement",
    MODULE_PREFIX: "DM",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};

exports.DIRECT_TAX_INVOICE = {
    COLLECTION_NAME: "DirectTaxInvoice",
    ADDED_ACTION: "Direct Tax Invoice created",
    UPDATED_ACTION: "Direct Tax Invoice updated",
    MODULE_NAME: "Direct Tax Invoice",
    MODULE: "DirectTaxInvoice",
    MODULE_PREFIX: "DTI/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
exports.CUSTOMER_OPEN_PO = {
    COLLECTION_NAME: "CustomerOpenPO",
    ADDED_ACTION: "Customer Open PO created",
    UPDATED_ACTION: "Customer Open PO updated",
    MODULE_NAME: "Customer Open PO",
    MODULE: "CustomerOpenPO",
    MODULE_PREFIX: "COP/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};

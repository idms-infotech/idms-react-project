exports.BUSINESS_LEAD_MAIL_CONST = {
    NPD_REQUEST: {MODULE: "Business Leads", SUB_MODULE: "NPD Request", CREATE_TEMPLATE: "templates/NPD.html"},
    NPD_REVIEW: {
        MODULE: "Business Leads",
        SUB_MODULE: "NPD Review",
        CUSTOMER_INPUT_TEMPLATE: "templates/NPDReview/NPDReviewCustomer.html",
        REVIEW_TEMPLATE: "templates/NPDReview/NPDReview.html"
    }
};
exports.SALES_MAIL_CONST = {
    CREDIT_NOTE: {MODULE: "Sales", SUB_MODULE: "Credit Note", CREATE_TEMPLATE: "templates/creditNote.html"},
    DIRECT_TAX_INV: {
        MODULE: "Sales",
        SUB_MODULE: "Direct Tax Invoice",
        CREATE_TEMPLATE: "templates/taxInvoiceGeneration.html"
    },
    PROFORMA_INV: {
        MODULE: "Sales",
        SUB_MODULE: "Proforma Invoice",
        CREATE_TEMPLATE: "templates/PI/proformaInvoice.html"
    },
    DEBIT_NOTE: {MODULE: "Sales", SUB_MODULE: "Debit Note", CREATE_TEMPLATE: "templates/salesDebitNote.html"},
    SALES_ORDER: {MODULE: "Sales", SUB_MODULE: "Sales Order", CREATE_TEMPLATE: "templates/SOConfirmation.html"},
    SERVICE_INV: {MODULE: "Sales", SUB_MODULE: "Service Invoice", CREATE_TEMPLATE: "templates/serviceInvoice.html"}
};

exports.PURCHASE_MAIL_CONST = {
    DEBIT_NOTE: {MODULE: "Purchase", SUB_MODULE: "Debit Note", CREATE_TEMPLATE: "templates/debitNote.html"},
    GENERATE_PO: {
        MODULE: "Purchase",
        SUB_MODULE: "Generate PO",
        CREATE_TEMPLATE: "templates/PO/poCreate.html",
        APPROVE_TEMPLATE: "templates/PO/poApproval.html",
        REJECT_TEMPLATE: "templates/PO/poRejection.html"
    }
};

exports.STORES_MAIL_CONST = {
    GIN: {MODULE: "Stores", SUB_MODULE: "Goods Inward Note", CREATE_TEMPLATE: "templates/PO/ginCreate.html"},
    GRN: {MODULE: "Stores", SUB_MODULE: "Goods Receipt Note", CREATE_TEMPLATE: "templates/PO/grnCreate.html"}
};
exports.QUALITY_MAIL_CONST = {
    MRN: {MODULE: "Quality", SUB_MODULE: "MRN", CREATE_TEMPLATE: "templates/PO/mrnCreate.html"}
};
exports.DISPATCH_MAIL_CONST = {
    ASN: {MODULE: "Dispatch", SUB_MODULE: "Advance Shipment Notice", CREATE_TEMPLATE: "templates/asn.html"},
    TAX_INV: {MODULE: "Dispatch", SUB_MODULE: "Tax Invoice", CREATE_TEMPLATE: "templates/taxInvoiceGeneration.html"}
};
exports.HR_ADMIN_MAIL_CONST = {
    LEAVE_APP: {
        MODULE: "HR & Admin",
        SUB_MODULE: "Leave Application",
        CREATE_TEMPLATE: "templates/leaveApplication.html"
    },
    OD_APP: {
        MODULE: "HR & Admin",
        SUB_MODULE: "Outdoor Duty Application",
        CREATE_TEMPLATE: "templates/ODApplication.html"
    }
};
exports.SETTINGS_MAIL_CONST = {
    USER: {
        MODULE: "Settings",
        SUB_MODULE: "User",
        CREATE_TEMPLATE: "templates/User/userCreate.html",
        LOGIN_TEMPLATE: "templates/userloggedIn.html"
    }
};
exports.SUPPORT_MAIL_CONST = {
    RAISE_TICKET: {MODULE: "Support", SUB_MODULE: "Raise Ticket"}
};
exports.DEFAULT_MAIL_RECEIVER = "support@idmsinfotech.com";
exports.DEFAULT_MAIL_RECEIVER = null;

const WIP_INVENTORY_FILTER_FIELDS = ["Raw Material", "Backing Material"];
const RAW_MATERIAL_CATEGORIES = [
    "Raw Material",
    "Backing Material",
    "W10 - Backing Material",
    "W20 - Solid Chemicals",
    "W25 - Liquid Chemicals",
    "W30 - Inks"
];
const INPUT_SOURCE = ["PPIC - RM Stock", "PPIC - SFG"];
const CHILD_ITEM_CATEGORY_NAME = {
    CHILD_ITEM: "L20/Child Item",
    GRAND_CHILD: "L30/Grand Child"
};
const PO_RATE_DECIMAL = 4;
const PROD_ITEM_CATEGORY_TYPE = {
    PRODUCTION_ITEM: "ProductionItem",
    JW_ITEM: "JWItem",
    SFG_MASTER: "SFGMaster"
};
const BOOLEAN_VALUES = {
    TRUE: "true",
    FALSE: "false",
    YES: "Yes",
    NO: "No"
};
const E_INVOICE = {
    URL: "https://my.gstzen.in/~gstzen/a/post-einvoice-data/einvoice-json/"
};
const E_WAY_BILL = {
    URL: "https://my.gstzen.in/~gstzen/a/ewbapi/generate/"
};
const TEMPLATE = {
    PO_DOMESTIC_TEMPLATE: [
        {
            label: "Regular POD",
            value: "Regular POD"
        },
        {
            label: "PO Domestic",
            value: "PO Domestic"
        }
    ],
    PO_IMPORTS_TEMPLATE: [
        {
            label: "Regular POI",
            value: "Regular POI"
        },
        {
            label: "PO Imports",
            value: "PO Imports"
        }
    ],
    PI_DOMESTIC_TEMPLATE: [
        {
            label: "PI Domestic",
            value: "PI Domestic"
        }
    ],
    PI_EXPORTS_TEMPLATE: [
        {
            label: "PI Exports",
            value: "PI Exports"
        }
    ],
    TI_DOMESTIC_TEMPLATE: [
        {
            label: "Turnover less than 5 CR",
            value: "Turnover less than 5 CR"
        },
        {
            label: "Turnover less than 5 CR with Dispatch",
            value: "Turnover less than 5 CR with Dispatch"
        },

        {
            label: "E-Invoice",
            value: "E-Invoice"
        },
        {
            label: "AAS-AIDS Tax-Invoice",
            value: "AAS-AIDS Tax-Invoice"
        }
    ],
    TI_EXPORTS_TEMPLATE: [
        {
            label: "Turnover less than 5 CR",
            value: "Turnover less than 5 CR"
        },
        {
            label: "Turnover less than 5 CR",
            value: "Turnover less than 5 CR"
        },
        {label: "Turnover less than 5 CR with Dispatch", value: "Turnover less than 5 CR with Dispatch"},
        {label: "E-Invoice", value: "E-Invoice"},
        {label: "AAS-AIDS Tax-Invoice", value: "AAS-AIDS Tax-Invoice"}
    ]
};
const INK_ITEM_CATEGORY_NAME = {
    PRODUCTION_CONSUMABLE: "Production Consumable",
    MISCELLANEOUS: "Miscellaneous",
    ENGINEERING_CONSUMABLE: "Engineering Consumable"
};
const SALES_CATEGORY = {
    DOMESTIC_OEM: "Domestic – OEM",
    DOMESTIC_JOB_MANUFACTURER: "Domestic Goods Manufacturer",
    IMPORTS_GOODS_PROVIDER: "Imports Goods Provider",
    DOMESTIC_DEALER: "Domestic – Dealer",
    EXPORTS_DEALER: "Exports – Dealer",
    EXPORTS_OEM: "Exports – OEM",
    DOMESTIC: "Domestic",
    EXPORTS: "Exports",
    IMPORTS: "Imports",
    JW: "JW",
    JOB_WORK_PRINCIPAL: "Job Work Principal",
    DOMESTIC_REGEX: /domestic/i,
    EXPORTS_REGEX: /exports/i,
    IMPORTS_REGEX: /imports/i,
    getAllDomesticSalesCategory: function () {
        return [SALES_CATEGORY.DOMESTIC_OEM, SALES_CATEGORY.DOMESTIC_DEALER];
    },
    getAllExportsSalesCategory: function () {
        return [SALES_CATEGORY.EXPORTS_OEM, SALES_CATEGORY.EXPORTS_DEALER];
    }
};
const COMPANY_TYPE = {
    PRINTING_INDUSTRY: "Printing Industry",
    AUTOMOBILE_INDUSTRY: "Automobile Industry",
    INJECTION_MOULDING: "Injection Molding",
    CONTROL_PANEL: "Control Panel"
};
const EMPLOYEE_JOINING_LOCATION = {
    FACTORY: "factory",
    WORK: "work",
    OFFICE_FACTORY: "Office & Factory",
    getAllFilterLocationArray: function (array) {
        let locationArray = [];
        for (const ele of array) {
            locationArray.push(OPTIONS.defaultLocation[ele]);
        }
        return locationArray;
    }
};
const ASSET_CLASS_NAMES = {
    MACHINES: "Machines",
    EQUIPMENT: "Equipment"
};
const ITEM_CATEGORY_OPTIONS = [
    "Capital Goods",
    "Raw Material",
    "Production Consumable",
    "Engineering Consumable",
    "Packaging Material",
    "Office Stationery",
    "Miscellaneous",
    "Traded Goods"
];

const SACObj = {
    provisionType: "Service",
    isActive: "Y",
    sacCode: "996511",
    serviceDescription: "Other Charges",
    gstRate: 18,
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    ugstRate: 18,
    sacMasterEntryNo: "SAC0000",
    sacEntryDate: "2023-12-13",
    revision: [
        {
            revisionNo: "1",
            revisionDate: "2023-12-13"
        }
    ]
};
const OTHER_CHARGES_SAC_CODE = "996511";
const LABOUR_RATE_MASTER_ARRAY = [
    {
        _id: "6593b1cc6dfafb4767d7b688",
        category: "Skilled Labour",
        monthlySalary: 0,
        daysPerMonth: 0,
        shiftHrs: 0,
        salaryPerHour: 0,
        revisionDate: new Date()
    },
    {
        _id: "6593b1cc6dfafb4767d7b687",
        category: "Semi-Skilled Labour",
        monthlySalary: 0,
        daysPerMonth: 0,
        shiftHrs: 0,
        salaryPerHour: 0,
        revisionDate: new Date()
    },
    {
        _id: "6593b1cc6dfafb4767d7b689",
        category: "Un-Skilled Labour",
        monthlySalary: 0,
        daysPerMonth: 0,
        shiftHrs: 0,
        salaryPerHour: 0,
        revisionDate: new Date()
    }
];
const NPD_REVIEW_FIELDS = [
    "customerInputs",
    "technicalReview",
    "economicReview",
    "legalReview",
    "operationalReview",
    "schedulingReview"
];
const NPD_REVIEW_MAIL_ACTION = {
    customerInputs: "Customer Inputs",
    technicalReview: "Technical Review",
    economicReview: "Economic Review",
    legalReview: "Legal Review",
    operationalReview: "Operational Review",
    schedulingReview: "Scheduling Review"
};
const COST_HEADS = {
    RENT: "Rent",
    INDIRECT_SALARIES: "Indirect Salaries & benefits",
    INSURANCE: "Insurance",
    MAINTENANCE_REPAIRS: "Maintenance & Repairs",
    CONSUMABLES_SPARES: "Consumables & Spares",
    ELECTRICITY: "Electricity",
    UTILITY: "Utility",
    MARKETING: "Marketing",
    SALES_DISTRIBUTION: "Sales & Distribution",
    ADMIN_OTHER: "Admin & Other"
};
const JOB_CARD_STAGE = {
    PROTOTYPE: "Prototype",
    PILOT: "Pilot",
    PRODUCTION: "Production",
    getStages: function () {
        return [this.PROTOTYPE, this.PILOT, this.PRODUCTION];
    }
};
const JOB_ORDER_TYPE = {
    ALL: "All",
    SO: "SO",
    FC: "FC",
    NPD: "NPD",
    getOrders: function () {
        return [this.ALL, this.SO, this.FC, this.NPD];
    }
};
const STOCK_PREP_UOM = {
    SQM: "sqm",
    SHEET: "SHT",
    ROLL: "RL",
    getStockUOM: function () {
        return [this.SQM, this.SHEET, this.ROLL];
    }
};
const INK_MIXING_UOM = {
    LTR: "LTR",
    KG: "KGS",
    GRAM: "GMS",
    getInkMixingUOM: function () {
        return [this.LTR, this.KG, this.GRAM];
    }
};
const INV_FORM_TYPE = {
    PARENT: "Parent",
    CHILD: "Child"
};
const SKU_COST_SHEET_DETAILS = [
    {
        srNo: 1,
        costHead: "Direct Material",
        costPerUnit: 0,
        percentage: 0
    },
    {
        srNo: 2,
        costHead: "Direct Labour",
        costPerUnit: 0,
        percentage: 0
    },
    {
        srNo: 3,
        costHead: "Direct Expenses",
        costPerUnit: 0,
        percentage: 0
    },
    {
        srNo: 4,
        costHead: "Cost of Goods Sold(COGS)",
        costPerUnit: 0,
        percentage: 0
    },
    {
        srNo: 5,
        costHead: "Operating Expenses (OPEX)",
        costPerUnit: 0,
        percentage: 0
    },
    {
        srNo: 6,
        costHead: "Total Cost of Operation (COGS + OPEX)",
        costPerUnit: 0,
        percentage: 0
    },
    {
        srNo: 7,
        costHead: "Profit",
        costPerUnit: 0,
        percentage: 0
    },
    {
        srNo: 8,
        costHead: "Selling Price",
        costPerUnit: 0,
        percentage: 0
    }
];
const GOODS_TRANSFER_REQUEST_DEPT = {
    STORES: "Stores",
    PLANNING: "Planning",
    PRODUCTION: "Production",
    QUALITY: "Quality"
};
const PPIC_STAGES = {
    R2R: "Roll To Roll",
    R2S: "Roll To Sheet",
    getStages: function () {
        return [this.R2R, this.R2S];
    }
};
const PROCESS = [
    {
        label: "Stock Preparation",
        value: "Stock Preparation"
    },
    {
        label: "Ink Mixing",
        value: "Ink Mixing"
    },
    {
        label: "Screen Making",
        value: "Screen Making"
    },
    {
        label: "Printing on CPI",
        value: "Printing on CPI"
    },
    {
        label: "Weeding",
        value: "Weeding"
    },
    {
        label: "Lamination",
        value: "Lamination"
    },
    {
        label: "Through Punching",
        value: "Through Punching"
    },
    {
        label: "Packing",
        value: "Packing"
    },
    {
        label: "Stage Inspection",
        value: "Stage Inspection"
    },
    {
        label: "Generic Production Process",
        value: "Generic Production Process"
    },
    {
        label: "MTO Ink Mixing Log",
        value: "MTO Ink Mixing Log"
    },
    {
        label: "MTO Quality Log",
        value: "MTO Quality Log"
    },
    {
        label: "MTO Stock Log",
        value: "MTO Stock Log"
    }
];
const IPQA = [
    {
        label: "Stock Preparation IPQA",
        value: "Stock Preparation IPQA"
    },
    {
        label: "Ink Mixing IPQA",
        value: "Ink Mixing IPQA"
    },
    {
        label: "Screen Making IPQA",
        value: "Screen Making IPQA"
    },
    {
        label: "Printing on CPI IPQA",
        value: "Printing on CPI IPQA"
    },
    {
        label: "Weeding IPQA",
        value: "Weeding IPQA"
    },
    {
        label: "Lamination IPQA",
        value: "Lamination IPQA"
    },
    {
        label: "Through Punching IPQA",
        value: "Through Punching IPQA"
    },
    {
        label: "Packing IPQA",
        value: "Packing IPQA"
    },
    {
        label: "Stage Inspection IPQA",
        value: "Stage Inspection IPQA"
    },
    {
        label: "Generic IPQA Process",
        value: "Generic IPQA Process"
    },
    {
        label: "Generic IPQC Process",
        value: "Generic IPQC Process"
    }
];
const SOURCE_DOCUMENT = {
    MRN: "Material Release Note (MRN)",
    DC: "Delivery Challan (DC)",
    MRV: "Material Re-Validation (MRV)",
    OPTIONS: function () {
        return [
            {
                label: this.MRN,
                value: this.MRN
            },
            {
                label: this.DC,
                value: this.DC
            },
            {
                label: this.MRV,
                value: this.MRV
            }
        ];
    }
};
const EMP_GENDER = [
    {
        label: "Male",
        value: "Male"
    },
    {
        label: "Female",
        value: "Female"
    }
];
const EMP_MARITAL_STATUS = [
    {
        label: "Married",
        value: "Married"
    },
    {
        label: "Unmarried",
        value: "Unmarried"
    }
];
const EMP_ACCOUNT_TYPE = [
    {
        label: "Current",
        value: "Current"
    },
    {
        label: "Saving",
        value: "Saving"
    }
];
const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh (UT)",
    "Chhattisgarh",
    "Dadra and Nagar Haveli (UT)",
    "Daman and Diu (UT)",
    "Delhi (NCT)",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Lakshadweep (UT)",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry (UT)",
    "Punjab",
    "Rajasthan",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttarakhand",
    "Uttar Pradesh",
    "West Bengal"
];
const SKU_MASTER_DIMENSIONS_UNITS = {
    mm: "mm",
    cm: "cm",
    m: "m",
    ft: "ft",
    inch: "inch",
    getAllSKUMasterDimensionsUnit: function () {
        return [this.mm, this.cm, this.m, this.ft, this.inch];
    }
};
const SUPER_ADMIN_ID = "64a687b4e9143bffd820fb3d";
const MODULE_PARENT_ID = "000000000000000000000000";
const COMPANY_SUPPLIER_ID = "66b083fb5deb30da6ca8870d";
const COMPANY_DEPARTMENTS = {
    PURCHASE: "Purchase",
    SALES: "Sales"
};
const DEFECT_TYPES = {
    PROCESS: "Process",
    DEFECT: "Defect"
};
const GST_CLASSIFICATION = {
    UNREGISTER_DEALER: "Unregistered Dealer"
};
const QC_LEVELS = {
    L1: "L1",
    L2: "L2",
    L3: "L3",
    L4: "L4"
};
const CURRENCY = {
    USD: "USD",
    EUR: "EUR",
    GBP: "GBP",
    CAD: "CAD",
    AUD: "AUD",
    JPY: "JPY",
    CHF: "CHF",
    BRL: "BRL"
};
module.exports = {
    SALES_CATEGORY,
    CHILD_ITEM_CATEGORY_NAME,
    INK_ITEM_CATEGORY_NAME,
    RAW_MATERIAL_CATEGORIES,
    WIP_INVENTORY_FILTER_FIELDS,
    INPUT_SOURCE,
    COMPANY_TYPE,
    EMPLOYEE_JOINING_LOCATION,
    ASSET_CLASS_NAMES,
    ITEM_CATEGORY_OPTIONS,
    BOOLEAN_VALUES,
    SACObj,
    OTHER_CHARGES_SAC_CODE,
    LABOUR_RATE_MASTER_ARRAY,
    NPD_REVIEW_FIELDS,
    NPD_REVIEW_MAIL_ACTION,
    COST_HEADS,
    SKU_COST_SHEET_DETAILS,
    JOB_CARD_STAGE,
    JOB_ORDER_TYPE,
    STOCK_PREP_UOM,
    INK_MIXING_UOM,
    GOODS_TRANSFER_REQUEST_DEPT,
    PPIC_STAGES,
    PROCESS,
    IPQA,
    EMP_GENDER,
    SOURCE_DOCUMENT,
    EMP_MARITAL_STATUS,
    INDIAN_STATES,
    EMP_ACCOUNT_TYPE,
    INV_FORM_TYPE,
    SKU_MASTER_DIMENSIONS_UNITS,
    SUPER_ADMIN_ID,
    COMPANY_DEPARTMENTS,
    DEFECT_TYPES,
    GST_CLASSIFICATION,
    COMPANY_SUPPLIER_ID,
    PROD_ITEM_CATEGORY_TYPE,
    MODULE_PARENT_ID,
    TEMPLATE,
    QC_LEVELS,
    E_INVOICE,
    E_WAY_BILL,
    PO_RATE_DECIMAL,
    CURRENCY
};

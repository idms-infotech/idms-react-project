const {OPTIONS} = require("../helpers/global.options");
const {filteredAppParameterList} = require("../models/settings/repository/appParameterRepository");
const ModuleMasterRepository = require("../models/settings/repository/moduleMasterRepository");
const moduleCard = [
    "STATE",
    "DEFAULT_UNIT_VALUE",
    "SBU",
    "SUB_LOCATIONS",
    "CUSTOMER_TYPE",
    "NPD_PRODUCT_CATEGORY",
    "ORDER_TYPE",
    "BUILD_STAGE",
    "DEVELOPMENT_CHARGES",
    "JC_COLOUR_NAME",
    "NPD_INPUT",
    "GOODS_ISSUE_PPIC",
    "FREIGHT_SERVICES",
    "MFZ_CATEGORY",
    "CUSTOMER_TYPE",
    "JOB_WO_DISCOUNT",
    "PURCHASE_TYPE",
    "PRODUCTION_SHIFT",
    "STOCK_PROCESS_NAME",
    "STOCK_MACHINE_NAME",
    "SHOULDER_TYPE",
    "MOULD_TYPE",
    "CAP_FINISH",
    "ORIFICE",
    "THREAD_TYPE",
    "INK_MASTER_UOM",
    "ASSET_TYPES",
    "DEPRECIATION_METHOD",
    "CALIBRATION_AGENCY",
    "EQUIPMENT_TYPE",
    "CHECKLIST_CATEGORY",
    "METRIC_TYPE",
    "TECHNICIAN_ROLE",
    "QUALITY_EQUIPMENT_TYPE",
    "CALCULATION_METHOD",
    "STANDARD_STATUS",
    "TASK_SCHEDULING_STATUS",
    "CALIBRATION_RESULT",
    "WORK_ORDER_GENERATE_STATUS",
    "TASK_STATUS",
    "TASK_TYPE",
    "FREQUENCY",
    "SPECIFICATION_UOM",
    "QUALITY_CONTROL_LEVEL",
    "INSPECTION_TYPE",
    "INSPECTION_PARAMETER",
    "STATUS",
    "CALIBRATION_STANDARD_TYPE",
    "EQUIPMENT_TYPE",
    "EARNING_HEAD",
    "LOCATIONS",
    "PAYMENT_METHOD",
    "GST_CLASSIFICATION",
    "WARRANTY_TYPES",
    "ASSET_MASTER_CONF",
    "ACCOUNT_PURCHASE_CATEGORY",
    "CONSTITUTION_OF_BUSINESS",
    "COMPANY_TYPE",
    "REGION_ZONES",
    "DELIVERY_TYPE",
    "TI_DOMESTIC_TEMPLATE",
    "TI_EXPORTS_TEMPLATE",
    "CURRENCY",
    "LOCATION",
    "EXPORTS_TCS_OF_QUOTATION",
    "TCS_OF_QUOTATION",
    "SALES_COUNTRY",
    "PURCHASE_COUNTRY",
    "ITEM_SUB_CATEGORY",
    "EMP_DESIGN",
    "EMP_GRADE",
    "EMP_CADRE",
    "EMP_TYPE",
    "FREIGHT_TERMS"
];
exports.transferAppParamToModule = async companyId => {
    try {
        let appParameterList = await filteredAppParameterList([
            {
                $project: {
                    appParameterAppCode: 1,
                    label: "$appParameterName",
                    value: "$appParameterValue"
                }
            }
        ]);
        let moduleMasterList = await ModuleMasterRepository.filteredModuleMasterList([
            {
                $group: {
                    _id: "$type"
                }
            },
            {
                $project: {
                    type: "$_id"
                }
            }
        ]);
        for await (const app of appParameterList) {
            for await (const ele of moduleMasterList) {
                let newValues = app?.value?.split(",")?.map((y, index) => {
                    return {
                        company: companyId,
                        type: String(app.appParameterAppCode).toUpperCase(),
                        parameterName: y,
                        parameterLabel: y,
                        order: index + 1,
                        status: OPTIONS.defaultStatus.ACTIVE
                    };
                });
                for (const val of newValues) {
                    // console.log("val", val.type);

                    const moduleExists = await ModuleMasterRepository.findOneDoc({
                        type: val.type,
                        parameterName: val.parameterName
                    });
                    if (!moduleExists && moduleCard.find(z => z == val.type)) {
                        await ModuleMasterRepository.createDoc(val);
                    }
                }
            }
        }
        console.info("Transfer AppParam To Module Completed");
    } catch (error) {
        console.error("error", error);
    }
};

const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {CHILD_ITEM_CATEGORY_NAME, COMPANY_SUPPLIER_ID} = require("../../../../mocks/constantData");
const {getAllMapProcessMachine} = require("../map-process-machine/map-process-machine");
const {
    getAllGroupPartProductionAttributes
} = require("../../../../models/production/helpers/groupPartProductionHelper");
const {dateToAnyFormat} = require("../../../../helpers/dateTime");
const {GROUP_PART_PRODUCTION} = require("../../../../mocks/schemasConstant/productionConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const ProdItemRepository = require("../../../../models/planning/repository/prodItemRepository");
const GroupPartProdRepository = require("../../../../models/production/repository/groupPartProductionRepository");
const CompanyRepository = require("../../../../models/settings/repository/companyRepository");
const SupplierRepository = require("../../../../models/purchase/repository/supplierRepository");
const MRNController = require("../../quality/Mrn/Mrn");
const GINController = require("../../stores/goodsInwardEntry/goodsInwardEntry");
const ObjectId = mongoose.Types.ObjectId;

exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await GroupPartProdRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Group Part Production")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Group Part Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllGroupPartProductionAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            }
        ];
        let rows = await GroupPartProdRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await GroupPartProdRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Group Part Production");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById  Group Part Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await GroupPartProdRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Group Part Production")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Group Part Production");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById  Group Part Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await GroupPartProdRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await GroupPartProdRepository.updateDoc(itemDetails, req.body);
        if (itemDetails.status == OPTIONS.defaultStatus.APPROVED) {
            let companyData = await CompanyRepository.getDocById(itemDetails.company, {
                placesOfBusiness: 1,
                companyName: 1
            });
            let supplierData = await SupplierRepository.getDocById(COMPANY_SUPPLIER_ID);
            let MRN = await MRNController.createDirectMRN({
                company: itemDetails.company,
                createdBy: itemDetails.createdBy,
                updatedBy: itemDetails.updatedBy,
                MRNNumber: "MRC/0000",
                GRNNumber: null,
                supplier: supplierData?._id,
                referenceModel: "Supplier",
                supplierName: supplierData?.supplierName,
                currency: supplierData?.supplierCurrency,
                supplierInvoice: "-",
                supplierDate: new Date(),
                MRNStatus: OPTIONS.defaultStatus.CLOSED,
                deliveryLocation: companyData?.placesOfBusiness[0]?.locationID,

                GRNDetails: await Promise.all(
                    itemDetails.groupPartProductionDetails.map(async (ele, idx) => {
                        let itemsData = await ProdItemRepository.getDocById(ele.childItem, {
                            childItemCategory: 1,
                            primaryToSecondaryConversion: 1,
                            secondaryToPrimaryConversion: 1,
                            primaryUnit: 1,
                            secondaryUnit: 1,
                            conversionOfUnits: 1
                        });
                        return {
                            MRNLineNumber: idx + 1,
                            GRNLineNumber: idx + 1,
                            item: ele?.childItem,
                            referenceModel: "ProductionItem",
                            itemType: itemsData?.childItemCategory,
                            UOM: ele?.UOM,
                            primaryToSecondaryConversion: itemsData?.primaryToSecondaryConversion,
                            secondaryToPrimaryConversion: itemsData?.secondaryToPrimaryConversion,
                            primaryUnit: itemsData?.primaryUnit,
                            secondaryUnit: itemsData?.secondaryUnit,
                            conversionOfUnits: itemsData?.conversionOfUnits,
                            GRNQty: ele?.outputQty,
                            balancedQty: 0,
                            standardRate: 0,
                            purchaseRate: 0,
                            invoiceRate: 0,
                            QCLevels: null,
                            rejectedQty: ele?.rejectedQty ?? 0,
                            releasedQty: ele?.outputQty,
                            batchNo: ele?.batchNumber,
                            batchDate: new Date()
                        };
                    })
                )
            });

            await GINController.createDirectGIN(MRN, null);
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE(" Group Part Production has been")
        });
    } catch (e) {
        console.error("update  Group Part Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let GrChildItemListOptions = await ProdItemRepository.filteredProdItemList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE,
                    childItemCategory: CHILD_ITEM_CATEGORY_NAME.GRAND_CHILD
                }
            },
            {
                $project: {
                    childItem: "$_id",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: "$unitOfMeasurement",
                    orderRef: null,
                    jobCard: null,
                    batchNumber: null,
                    batchQty: null,
                    outputQty: null,
                    rejectedQty: null
                }
            }
        ]);
        const mapProcessMachineListOptions = await getAllMapProcessMachine(req.user.company);
        const productionShiftOptions = await getAllModuleMaster(req.user.company, "PRODUCTION_SHIFT");
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...GROUP_PART_PRODUCTION.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        return res.success({
            GrChildItemListOptions,
            autoIncrementNo,
            mapProcessMachineListOptions,
            productionShiftOptions
        });
    } catch (error) {
        console.error("getAllMasterData Child Part Production", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getTotalNoOfGrandChildPartProducedPerDay = async company => {
    try {
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        const rows = await GroupPartProdRepository.filteredGroupPartProdList([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$productionDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    matchDate: currentDate
                }
            },
            {
                $group: {
                    _id: null,
                    // count: {$sum: 1},
                    count: {$sum: {$cond: [{$eq: ["$status", "Awaiting Approval"]}, 1, 0]}}
                }
            },
            {
                $project: {
                    _id: 0,
                    count: 1
                }
            }
        ]);
        return rows[0]?.count || 0;
    } catch (error) {
        console.error("error", error);
    }
};

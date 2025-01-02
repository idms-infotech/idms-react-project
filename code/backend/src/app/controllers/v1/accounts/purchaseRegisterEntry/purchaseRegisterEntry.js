const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllPurchaseRegistryEntryAttributes,
    getAllPREReportsAttributes
} = require("../../../../models/accounts/helpers/purchaseRegisterEntryHelper");
const {getAndSetAutoIncrementNo, getNextAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {PURCHASE_REGISTER_ENTRY} = require("../../../../mocks/schemasConstant/accountsConstant");
const PurchaseRegistryEntryRepository = require("../../../../models/accounts/repository/purchaseRegisterEntryRepository");
const {ObjectId} = require("../../../../../config/mongoose");
const {filteredSupplierList} = require("../../../../models/purchase/repository/supplierRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {filteredMRNList} = require("../../../../models/quality/repository/mrnRepository");
const {getAllSuppliers} = require("../../purchase/suppliers/suppliers");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {OPTIONS} = require("../../../../helpers/global.options");
const autoIncrementRepository = require("../../../../models/settings/repository/autoIncrementRepository");
const {getIncrementNumWithPrefix} = require("../../../../helpers/utility");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllPurchaseRegistryEntryAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {
                        $nin: [OPTIONS.defaultStatus.REPORT_GENERATED]
                    }
                }
            }
        ];
        let rows = await PurchaseRegistryEntryRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await PurchaseRegistryEntryRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Purchase Registry Entry")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Purchase Registry Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await PurchaseRegistryEntryRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await PurchaseRegistryEntryRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Purchase Registry Entry has been")
        });
    } catch (e) {
        console.error("update Purchase Registry Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await PurchaseRegistryEntryRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Purchase Registry Entry")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Purchase Registry Entry");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Purchase Registry Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await PurchaseRegistryEntryRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Purchase Registry Entry");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Purchase Registry Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            PURCHASE_REGISTER_ENTRY.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        const options = await dropDownOptions(req.user.company);
        return res.success({autoIncrementNo, ...options});
    } catch (error) {
        console.error("getAllMasterData Purchase Registry Entry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

const dropDownOptions = async company => {
    try {
        const suppliersOptions = await filteredSupplierList([
            {$match: {company: ObjectId(company), isSupplierActive: "A"}},
            {$sort: {supplierName: 1}},
            {
                $project: {
                    _id: 0,
                    supplierName: 1,
                    supplier: "$_id",
                    supplierGST: 1,
                    supplierCurrency: 1
                }
            }
        ]);
        const purchaseCategoryOptions = await getAllModuleMaster(company, "ACCOUNT_PURCHASE_CATEGORY");
        return {
            purchaseCategoryOptions,
            suppliersOptions
        };
    } catch (error) {
        console.error(error);
    }
};

exports.getAllMRNBySupplierId = asyncHandler(async (req, res) => {
    try {
        let currentDate = new Date();
        let thirtyDaysAgoDate = new Date(currentDate);
        thirtyDaysAgoDate.setDate(currentDate.getDate() - 30);
        const MRNList = await filteredMRNList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    supplier: ObjectId(req.params.id),
                    MRNDate: {
                        $gte: thirtyDaysAgoDate
                    }
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"},
            {
                $project: {
                    _id: 1,
                    MRNNumber: 1,
                    MRNDate: {$dateToString: {format: "%d-%m-%Y", date: "$MRNDate"}},
                    supplierName: "$supplier.supplierName",
                    MRNStatus: 1,
                    deliveryLocation: 1
                }
            }
        ]);
        return res.success(MRNList);
    } catch (error) {
        console.error("getAllMasterData Purchase Registry Entry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const suppliersOptions = await getAllSuppliers(req.user.company, {supplierName: 1});
        const {supplier = null, toDate = null, fromDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            status: OPTIONS.defaultStatus.REPORT_GENERATED,
            ...(!!supplier && {
                supplier: ObjectId(supplier)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    PEntryDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = getAllPREReportsAttributes();
        let pipeline = [
            {
                $match: query
            }
        ];
        let rows = await PurchaseRegistryEntryRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        totalTaxableAmt: {$sum: "$roundOffTotalAmt"}
                    }
                },
                {
                    $project: {
                        totalTaxableAmt: {$round: ["$totalTaxableAmt", 2]},
                        _id: 0
                    }
                }
            ]
        });
        return res.success({
            suppliersOptions,
            ...rows
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.checkPurchaseRegisterEntryValidation = async (purchaseRegisterEntryData, column, company) => {
    try {
        const purchaseRegisterEntryOptions = await PurchaseRegistryEntryRepository.filteredPurchaseRegisterEntryList([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.AWAITING_APPROVAL
                }
            },
            {
                $project: {supplierName: 1, taxInvoiceNo: 1}
            }
        ]);
        const requiredFields = ["supplierName", "purchaseCategory", "taxInvoiceNo"];
        const falseArr = OPTIONS.falsyArray;
        let {suppliersOptions, purchaseCategoryOptions} = await dropDownOptions(company);
        let dropdownCheck = [
            {
                key: "supplierName",
                options: suppliersOptions.map(x => {
                    return {
                        label: x.supplierName,
                        value: x.supplierName
                    };
                })
            },
            {
                key: "purchaseCategory",
                options: purchaseCategoryOptions.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            }
        ];
        let uniquePurchaseRegisterEntry = [];
        for await (const x of purchaseRegisterEntryData) {
            x.isValid = true;
            x.message = null;
            let label = `${x["supplierName"]} - ${x["taxInvoiceNo"]}`;
            if (uniquePurchaseRegisterEntry.includes(label)) {
                x.isValid = false;
                x.message = `${x["supplierName"]} duplicate Entry`;
                break;
            }
            uniquePurchaseRegisterEntry.push(label);
            for (const ele of Object.values(column)) {
                if (requiredFields.includes(ele) && falseArr.includes(x[ele])) {
                    x.isValid = false;
                    x.message = validationJson[ele] ?? `${ele} is Required`;
                    break;
                }
                for (const dd of dropdownCheck) {
                    if (ele == dd.key && !dd.options.map(values => values.value).includes(x[ele])) {
                        x.isValid = false;
                        x.message = `${ele} is Invalid Value & Value Must be ${dd.options.map(values => values.value)}`;
                        break;
                    }
                }
                for (const item of purchaseRegisterEntryOptions) {
                    if (item.supplierName == x["supplierName"] && item.taxInvoiceNo == x["taxInvoiceNo"]) {
                        x.isValid = false;
                        x.message = `${x["supplierName"]} - ${x["taxInvoiceNo"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = purchaseRegisterEntryData.filter(x => !x.isValid);
        const validRecords = purchaseRegisterEntryData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertPurchaseRegisterEntryByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        let autoIncrementObj = await getNextAutoIncrementNo({
            ...PURCHASE_REGISTER_ENTRY.AUTO_INCREMENT_DATA(),
            company: company
        });
        let purchaseRegisterEntryData = jsonData.map(rest => {
            rest.jobWorkerCode = getIncrementNumWithPrefix(autoIncrementObj);
            rest.company = company;
            rest.createdBy = createdBy;
            rest.updatedBy = updatedBy;
            autoIncrementObj.autoIncrementValue++;
            return rest;
        });
        await PurchaseRegistryEntryRepository.createDoc(purchaseRegisterEntryData);
        await autoIncrementRepository.findAndUpdateDoc(
            {
                module: PURCHASE_REGISTER_ENTRY.MODULE,
                company: company
            },
            {
                $set: {
                    autoIncrementValue: autoIncrementObj.autoIncrementValue
                }
            }
        );
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

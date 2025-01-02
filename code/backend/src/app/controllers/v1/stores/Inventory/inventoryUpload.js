const {ObjectId} = require("../../../../../config/mongoose");
const {OPTIONS} = require("../../../../helpers/global.options");
const {filteredProdItemList} = require("../../../../models/planning/repository/prodItemRepository");
const unitJson = require("../../../../mocks/unit.json");
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
const {createInvOnBCEntry} = require("./Inventory");
const {filteredCompanyList} = require("../../../../models/settings/repository/companyRepository");
exports.checkProdItemsInvValidation = async (prodItemInvData, column, company) => {
    try {
        const prodItemOptions = await filteredProdItemList([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {
                    _id: 0,
                    label: "$itemCode",
                    value: "$itemCode"
                }
            }
        ]);
        const locationOptions = await filteredCompanyList([
            {
                $match: {
                    _id: ObjectId(company)
                }
            },
            {$unwind: "$placesOfBusiness"},
            {$group: {_id: null, locationIDs: {$addToSet: "$placesOfBusiness.locationID"}}},
            {
                $unwind: "$locationIDs"
            },
            {$project: {_id: 0, label: "$locationIDs", value: "$locationIDs"}}
        ]);
        const requiredFields = ["batchCardNo", "UOM", "itemCode", "batchCardClosureDate", "batchOutputQty", "location"];
        const falseArr = OPTIONS.falsyArray;
        let unitJsonMap = unitJson.map(x => {
            return {
                label: x.label,
                value: x.value
            };
        });
        let dropdownCheck = [
            {
                key: "itemCode",
                options: prodItemOptions
            },
            {
                key: "location",
                options: locationOptions
            },
            {
                key: "UOM",
                options: [
                    ...unitJsonMap,
                    {
                        value: "-",
                        label: "-"
                    }
                ]
            }
        ];
        for await (const x of prodItemInvData) {
            x.isValid = true;
            x.message = null;
            for (const ele of Object.values(column)) {
                if (requiredFields.includes(ele) && falseArr.includes(x[ele])) {
                    x.isValid = false;
                    x.message = validationJson[ele] ?? `${ele} is Required`;
                    break;
                }
                for (const dd of dropdownCheck) {
                    if (ele == dd.key && !dd.options.map(values => values.value).includes(x[ele])) {
                        x.isValid = false;
                        x.message = `${ele.toUpperCase()} is Invalid Value & Value Must be ${dd.options.map(
                            values => values.value
                        )}`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = prodItemInvData.filter(x => !x.isValid);
        const validRecords = prodItemInvData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertProdItemsInvByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        const prodItemOptions = await filteredProdItemList([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {
                    _id: 1,
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1
                }
            }
        ]);
        let batch = {
            item: null,
            company: company,
            createdBy: createdBy,
            updatedBy: updatedBy,
            _id: "000000000000000000000000",
            batchCardNo: null,
            generateReport: {
                batchCardClosureDate: null,
                batchOutputQty: null,
                location: null
            },
            UOM: null,
            item: null,
            itemCode: null,
            itemName: null,
            itemDescription: null
        };
        let prodItemIdMap = new Map(prodItemOptions.map(y => [y.itemCode, y]));
        for await (const ele of jsonData) {
            let itemObj = prodItemIdMap.get(ele.itemCode);
            if (itemObj) {
                batch.item = itemObj?._id;
                batch.batchCardNo = ele?.batchCardNo;
                batch.UOM = ele?.UOM;
                batch.itemCode = ele?.itemCode;
                batch.itemName = itemObj?.itemName;
                batch.itemDescription = itemObj?.itemDescription;
                batch.generateReport.batchCardClosureDate = ele?.batchCardClosureDate;
                batch.generateReport.batchOutputQty = ele?.batchOutputQty;
                batch.generateReport.location = ele?.location;
                await createInvOnBCEntry(batch);
            }
        }
        return {message: "Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

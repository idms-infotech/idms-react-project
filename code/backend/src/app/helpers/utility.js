const fs = require("fs");
const {getDateDiff, getExpiryDate, dateToAnyFormat} = require("./dateTime");
const {SALES_CATEGORY} = require("../mocks/constantData");

exports.randomNumber = function (length) {
    var text = "";
    var possible = "123456789";
    for (var i = 0; i < length; i++) {
        var sup = Math.floor(Math.random() * possible.length);
        text += i > 0 && sup == i ? "0" : possible.charAt(sup);
    }
    return Number(text);
};
const CHAR_LOWER = "abcdefghijklmnopqrstuvwxyz";
const CHAR_UPPER = CHAR_LOWER.toUpperCase();
const NUMBER = "0123456789";
const SPECIALS = "@";
const ALPHA_DATA = [CHAR_LOWER, CHAR_UPPER];
const RANDOM_DATA = [NUMBER, SPECIALS];

exports.generatePassword = function () {
    let password = "";
    for (let i = 0; i < 6; i++) {
        let rndAlphaAtArr = randomInt(1);
        let rndAlphaAt = randomInt(ALPHA_DATA[rndAlphaAtArr].toString().length);
        let rndAlpha = ALPHA_DATA[rndAlphaAtArr].charAt(rndAlphaAt);
        password += rndAlpha;
    }
    password += "@";
    for (let i = 0; i < 6; i++) {
        let rndDataAt = randomInt(RANDOM_DATA[0].length);
        let rndData = RANDOM_DATA[0].charAt(rndDataAt);
        password += rndData;
    }
    return password;
};
exports.getAutoIncrementNumber = (prefix, join = "", no, digit = 7) => {
    return `${prefix ? prefix + join : ""}${String(no).padStart(digit, "0")}`;
};
exports.getIncrementNumWithPrefix = ({modulePrefix, autoIncrementValue, digit}) => {
    return `${modulePrefix ? modulePrefix : ""}${String(autoIncrementValue).padStart(digit, "0")}`;
};
function randomInt(max) {
    return Math.floor(Math.random() * (max + 1));
}
exports.removeFile = destination => {
    if (fs.existsSync(destination)) {
        fs.unlinkSync(destination);
    }
};
exports.removeFilesInError = file => {
    if (file && file.length > 0) {
        this.removeFile(file[0].path);
    }
};
exports.removeSingleFileInError = file => {
    if (file) {
        this.removeFile(file.path);
    }
};
exports.removeFileCreate = file => {
    if (file && file.length > 0) {
        removeFile(file[0].path);
    }
};
exports.appendFile = (file, data) => {
    fs.appendFileSync(file, data);
};
exports.successMessage = (moduleName, status) => {
    let message = `${moduleName} has been ${
        status == "Awaiting Approval" ? "updated" : status.toLowerCase()
    } successfully`;
    if (status == "Report Generated") {
        message = `${moduleName} Report has been generated`;
    }
    return message;
};

exports.outputData = rows => {
    return {
        rows: rows[0]?.data || [],
        count: rows[0]?.metadata?.[0]?.total || 0
    };
};
exports.outputDataReports = rows => {
    return {
        rows: rows[0]?.data || [],
        count: rows[0]?.metadata?.[0]?.total || 0,
        totalAmounts: rows[0]?.groupAmounts[0] || []
    };
};
exports.getAllAggregationFooter = (project, match, column, direction, pagination) => {
    return [
        {$project: project},
        {$match: match},
        {$sort: {[column]: +direction}},
        {
            $facet: {
                metadata: [{$count: "total"}],
                data: pagination
            }
        }
    ];
};
exports.getAllReportsAggregationFooter = (project, match, column, direction, pagination, groupValues = []) => {
    return [
        {$project: project},
        {$match: match},
        {$sort: {[column]: +direction}},
        {
            $facet: {
                groupAmounts: groupValues,
                metadata: [{$count: "total"}],
                data: pagination
            }
        }
    ];
};

exports.expiryStatus = (shelfLife, manufacturingDate) => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    let expiryDate = getExpiryDate(shelfLife, manufacturingDate);
    if (!expiryDate) {
        return "green";
    }
    expiryDate = dateToAnyFormat(expiryDate, "YYYY-MM-DD");
    let dateDiff = getDateDiff(expiryDate, currentDate, "days");
    if (dateDiff < 0) {
        return "red";
    } else if (dateDiff < 30) {
        return "orange";
    } else {
        return "green";
    }
};
exports.setTwoDecimal = (value, digit = 2) => {
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue)) {
        return parsedValue.toFixed(digit);
    }
};

exports.getContactStr = (contactInfo, dept) => {
    const contactDetails = contactInfo.find(x => x.department == dept);
    if (contactDetails != undefined) {
        return `${contactDetails?.contactPersonName} (${contactDetails?.companyContactPersonNumber},${contactDetails?.companyContactPersonEmail})`;
    } else {
        return "-";
    }
};

exports.setConversion = item => {
    if (item.UOM == item.secondaryUnit) {
        // item.UOM = item.primaryUnit;
        if (item.primaryToSecondaryConversion) {
            item.quantity = +item.quantity * +item.primaryToSecondaryConversion;
        }
        if (item.secondaryToPrimaryConversion) {
            item.quantity = +item.quantity / +item.secondaryToPrimaryConversion;
        }
    } else {
        // item.UOM = item.secondaryUnit;
        if (item.primaryToSecondaryConversion) {
            item.quantity = +item.quantity / +item.primaryToSecondaryConversion;
        }
        if (item.secondaryToPrimaryConversion) {
            item.quantity = +item.quantity * +item.secondaryToPrimaryConversion;
        }
    }

    return +item.quantity.toFixed(4);
};

exports.checkDomesticCustomer = async category => {
    const regex = SALES_CATEGORY.DOMESTIC_REGEX;
    return regex.test(category);
};
exports.checkImports = async category => {
    const regex = SALES_CATEGORY.IMPORTS_REGEX;
    return regex.test(category);
};
exports.checkDomesticCustomer = async category => {
    const regex = SALES_CATEGORY.DOMESTIC_REGEX;
    return regex.test(category);
};
exports.checkExportsCustomer = async category => {
    const regex = SALES_CATEGORY.EXPORTS_REGEX;
    return regex.test(category);
};

exports.salesCategoryManipulation = category => {
    return [SALES_CATEGORY.EXPORTS_DEALER, SALES_CATEGORY.EXPORTS_OEM].includes(category)
        ? {categoryType: SALES_CATEGORY.EXPORTS, category: "Export Direct Customer"}
        : {categoryType: SALES_CATEGORY.DOMESTIC, category: "Domestic Direct Customer"};
};

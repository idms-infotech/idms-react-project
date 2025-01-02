const Excel = require("exceljs");
const fs = require("fs");

const replaceFormattedText = value => {
    return String(value)
        .replace(/_x005F/g, "")
        .replace(/_x000D_/g, "")
        .replace(/\n/g, "")
        .replace(/_x0004_/g, "")
        .replace(/undefined/g, "")
        .replace(/\�/g, "–")
        .trim();
};
exports.readExcel = async (fname, column) => {
    try {
        let filePath = "src/assets/excel/" + fname;
        let fileType = fname.slice((Math.max(0, fname.lastIndexOf(".")) || Infinity) + 1);
        const workbook = new Excel.Workbook();
        let worksheet;
        let jsonData = [];
        let keys = [];
        if (fileType == "csv") {
            worksheet = await workbook.csv.readFile(filePath);
            worksheet.eachRow({includeEmpty: true}, function (row, rowNumber) {
                if (rowNumber == 1) {
                    keys = row.values;
                    return;
                }
                let values = row.values;
                let obj = {};
                for (let i = 1; i < keys.length; i++) {
                    obj[column[keys[i].trim()]] = replaceFormattedText(values[i]);
                }
                jsonData.push(obj);
            });
        } else {
            console.log("File is Excel");
            return;
            worksheet = await workbook.xlsx.readFile(filePath);
            worksheet = workbook.getWorksheet("Sheet1");
            worksheet.eachRow({includeEmpty: true}, function (row, rowNumber) {
                if (rowNumber == 1) {
                    keys = row.values;
                    return;
                }
                let values = row.values;
                console.log("keys", keys);
                console.log("values", values);
                let obj = {};
                for (let i = 1; i < keys.length; i++) {
                    if (values[i] instanceof Object) {
                        if (values[i].hasOwnProperty("hyperlink")) {
                            obj[keys[i].trim()] = values[i].text;
                        } else {
                            let str = "";
                            for (let i = values[i].richText.length - 1; i >= 0; i--) {
                                let x = values[i].richText[i];
                                str += x.text;
                            }
                            // values[i].richText.forEach(x => {
                            //     str += x.text;
                            // });
                            obj[keys[i].trim()] = str;
                        }
                    } else {
                        obj[keys[i].trim()] = values[i];
                    }
                }
                console.log("obj", obj);
                for (let i = 1; i < keys.length; i++) {
                    obj[column[keys[i].trim()]] = replaceFormattedText(values[i]);
                    console.log("column[keys[i].trim()]", column[keys[i].trim()]);
                }
                jsonData.push(obj);
            });
        }
        fs.unlinkSync(filePath);
        // fs.writeFile("./customerMigration/Output.json", JSON.stringify(jsonData), err => {
        //     // In case of a error throw err.
        //     if (err) throw err;
        // });
        return jsonData;
    } catch (e) {
        console.error(e);
    }
};

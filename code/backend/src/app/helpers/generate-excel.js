const Excel = require("exceljs");
const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");

exports.generateExcel = asyncHandler(async (data, column, sheetName) => {
    let workbook = new Excel.Workbook();
    workbook.created = new Date();
    workbook.modified = new Date();
    // workbook.creator = req.user.firstName + req.user.lastName;
    var worksheet = workbook.addWorksheet(sheetName);
    workbook.alignment = {
        vertical: "middle",
        horizontal: "left",
        wrapText: true
    };
    worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {argb: "FFC0C0C0"}
    };
    worksheet.columns = column;
    worksheet.addRows(data);
    let fileName = `file-${Date.now()}.xlsx`;
    let filePath = path.resolve(`${__dirname}/../../assets/excel/${fileName}`);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
});

const fs = require("fs/promises"); // Using fs.promises for promise-based file operations
const Excel = require("exceljs");
class FileHandler {
    async readFile(filePath) {
        try {
            const content = await fs.readFile(filePath, "utf-8");
            return content;
        } catch (error) {
            console.error("Error reading file:", error.message);
            throw error;
        }
    }
    async readDir(dirPath, options) {
        try {
            const entries = await fs.readdir(dirPath, options);
            return entries;
        } catch (err) {
            console.error(`Error reading directory ${dirPath}:`, err);
            throw err;
        }
    }
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    async writeFile(filePath, data) {
        try {
            await fs.writeFile(filePath, data, "utf-8");
            console.log("File written successfully.");
        } catch (error) {
            console.error("Error writing file:", error.message);
            throw error;
        }
    }

    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
            console.log("File deleted successfully.");
        } catch (error) {
            console.error("Error deleting file:", error.message);
            throw error;
        }
    }
    replaceFormattedText(value) {
        return String(value)
            .replace(/_x005F/g, "")
            .replace(/_x000D_/g, "")
            .replace(/\n/g, "")
            .replace(/_x0004_/g, "")
            .replace(/undefined/g, "")
            .replace(/\�/g, "–")
            .trim();
    }
    async readExcelIntoJson(fname, column) {
        try {
            let filePath = "src/assets/excel/" + fname;
            let fileType = fname.slice((Math.max(0, fname.lastIndexOf(".")) || Infinity) + 1);
            const workbook = new Excel.Workbook();
            let worksheet;
            let jsonData = [];
            let keys = [];
            if (fileType == "csv") {
                worksheet = await workbook.csv.readFile(filePath);
                worksheet.eachRow({includeEmpty: true}, (row, rowNumber) => {
                    if (rowNumber == 1) {
                        keys = row.values;
                        return;
                    }
                    let values = row.values;
                    let obj = {};
                    for (let i = 1; i < keys.length; i++) {
                        obj[column[keys[i].trim()]] = this.replaceFormattedText(values[i]);
                    }
                    jsonData.push(obj);
                });
            } else {
                console.log("File is Excel");
            }
            this.deleteFile(filePath);
            // fs.writeFile("./customerMigration/Output.json", JSON.stringify(jsonData), err => {
            //     // In case of a error throw err.
            //     if (err) throw err;
            // });
            return jsonData;
        } catch (error) {
            console.error("Error reading CSV:", error);
            throw error;
        }
    }
}

// Example usage:
module.exports = new FileHandler();

// Example file paths
// const filePathToRead = 'path/to/read/file.txt';
// const filePathToWrite = 'path/to/write/file.txt';
// const filePathToDelete = 'path/to/delete/file.txt';

// // Read a file
// fileHandler.readFile(filePathToRead)
//   .then(content => {
//     console.log('File Content:', content);

//     // Write to a file
//     const dataToWrite = 'This is the data to write to the file.';
//     return fileHandler.writeFile(filePathToWrite, dataToWrite);
//   })
//   .then(() => {
//     // Delete a file
//     return fileHandler.deleteFile(filePathToDelete);
//   })
//   .catch(error => {
//     console.error('File operation error:', error.message);
//   });

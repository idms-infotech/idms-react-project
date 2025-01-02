const multer = require("multer");
const paths = {
    issueAttachment: "./src/assets/issueAttachment",
    emp: "./src/assets/employee",
    items: "./src/assets/items",
    supplier: "./src/assets/supplier",
    Sku: "./src/assets/Sku",
    company: "./src/assets/company",
    technicalSheet: "./src/assets/technicalSheet",
    menuImage: "./src/assets/menuImage",
    documentFile: "./src/assets/documentFile",
    excelData: "./src/assets/excel",
    NPDRequest: "./src/assets/NPDRequest"
    // shopLogo:"./src/assets/shopLogos",
    // customerLogo:"./src/assets/customerLogos",
    // advertise: "./src/assets/advertiseImages",
    // businessType: "./src/assets/businessTypeImages",
    // category: "./src/assets/categoryImages",
    // subCategory: "./src/assets/subCategoryImages",
    // offer: "./src/assets/offerImages",
    // catalogue: "./src/assets/catalogueImages",
};

const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else if (file.originalname.match(/\.(pdf|docx|doc|xlsx|ppt|pptx|jpg|jpeg|csv)$/)) {
        cb(null, true);
    } else {
        cb("Please upload only file.", false);
    }
};

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, paths[req.body.key]);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-bezkoder-${file.originalname}`);
    }
});

let uploadFile = multer({storage: storage, fileFilter: imageFilter});

module.exports = uploadFile;

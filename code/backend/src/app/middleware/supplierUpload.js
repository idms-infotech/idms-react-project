const RoleModel = require("../models/settings/roleModel");
const UserModel = require("../models/settings/userModel");
const SupplierModel = require("../models/purchase/supplierModel");

exports.supplierUpload = async excelData => {
    let superAdminRole = await RoleModel.findOne({roleName: "Super Admin"});
    let user = await UserModel.findOne({
        role: {$in: [superAdminRole._id]}
    });
    let supplierArr = [];
    let exitsSupplierArr = [];
    for await (const ele of excelData) {
        let exits = await SupplierModel.findOne({supplierName: ele.supplierName});
        if (!exits) {
            let supplier = await SupplierModel.create({
                ...ele,
                company: user.company,
                createdBy: user._id,
                updatedBy: user._id,
                supplierCode: "00000"
            });
            supplierArr.push(supplier._id);
        } else {
            exitsSupplierArr.push(ele.supplierName);
        }
    }
    // console.log("suppliers", JSON.stringify(suppliers));
    // console.log("suppliers", JSON.stringify(supplierArr));
    // console.log("exitsSupplierArr", JSON.stringify(exitsSupplierArr));
    return {supplierArr, exitsSupplierArr};
};

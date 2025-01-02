const ItemModel = require("../models/purchase/itemModel");

exports.itemsUpload = async excelData => {
    for await (const ele of excelData) {
        let exits = await ItemModel.findOne({itemName: ele.itemName});
        // if (!exits) {
        let item = await ItemModel.create({
            ...ele,
            company: user.company,
            createdBy: user._id,
            updatedBy: user._id,
            itemCode: "00000"
        });
        itemArr.push(item._id);
        // } else {
        // exitsItemArr.push(ele.itemName);
        // }
    }
    console.log("items", JSON.stringify(itemArr));
    console.log("itemArr", JSON.stringify(exitsItemArr));
    console.log("exitsItemArr", JSON.stringify(exitsItemArr));
    return {itemArr, exitsItemArr};
};

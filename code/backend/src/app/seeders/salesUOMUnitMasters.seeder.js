const salesUOMUnitMasterJson = require("../mocks/unit.json");
const SalesUOMUnitMasterRepository = require("../models/settings/repository/SalesUOMUnitMasterRepository");

exports.salesUOMUnitMasterInert = async function (companyId) {
    try {
        for await (const ele of salesUOMUnitMasterJson) {
            ele.company = companyId;
            let createObj = await SalesUOMUnitMasterRepository.findOneDoc({_id: ele._id}, {_id: 1});
            if (!createObj) {
                await SalesUOMUnitMasterRepository.createDoc(ele);
            }
        }
        console.info("Sales UOMUnitMasterInert successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

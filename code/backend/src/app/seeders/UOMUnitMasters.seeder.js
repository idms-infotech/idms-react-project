const UOMUnitMasterJson = require("../mocks/UOMUnitMaster.json");
const UOMUnitMasterRepository = require("../models/settings/repository/UOMUnitMasterRepository");

exports.UOMUnitMasterInert = async function (companyId) {
    try {
        for await (const ele of UOMUnitMasterJson) {
            ele.company = companyId;
            let createObj = await UOMUnitMasterRepository.findOneDoc({_id: ele._id}, {_id: 1});
            if (!createObj) {
                await UOMUnitMasterRepository.createDoc(ele);
            }
        }
        console.info("UOMUnitMasterInert successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

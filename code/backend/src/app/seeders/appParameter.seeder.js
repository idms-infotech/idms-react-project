const AppParameterRepository = require("../models/settings/repository/appParameterRepository");
const appParameterJson = require("../mocks/appParameter.json");
const appParameterDeleteJson = require("../mocks/appParameterDelete.json");
exports.appParameterInsert = async function (companyId) {
    try {
        for await (const ele of appParameterJson) {
            ele.company = companyId;
            let app = await AppParameterRepository.findOneDoc({appParameterAppCode: ele.appParameterAppCode});
            if (!app) {
                await AppParameterRepository.createDoc(ele);
            }
        }
        console.info("AppParameter updated successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

exports.deleteManyAppParameter = async () => {
    try {
        for await (const ele of appParameterDeleteJson) {
            const deleteObj = await AppParameterRepository.deleteDoc({appParameterAppCode: ele.appParameterAppCode});
            if (deleteObj.deletedCount > 0) {
                console.info(ele.appParameterAppCode + " deleted Successfully");
            }
        }
    } catch (error) {
        throw new Error(error);
    }
};

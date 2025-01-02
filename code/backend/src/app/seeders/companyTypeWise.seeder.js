const allCompanyJson = require("../mocks/companyTypeWiseJson/all.json");
const ModuleMasterRepository = require("../models/settings/repository/moduleMasterRepository");

exports.companyTypeWiseInsert = async function (company) {
    try {
        const promises = allCompanyJson.map(async ele => {
            const exists = await ModuleMasterRepository.findOneDoc({type: ele.type, parameterName: ele.parameterName});
            if (!exists) {
                ele.company = company;
                await ModuleMasterRepository.createDoc(ele);
            }
        });
        await Promise.all(promises);
        console.info("Module Master updated successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

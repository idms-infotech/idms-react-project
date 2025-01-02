const processMasterJson = require("../mocks/processMaster.json");
const {PROCESS_MASTER} = require("../mocks/schemasConstant/planningConstant");
const ProcessMasterRepository = require("../models/planning/repository/processMasterRepository");
const AutoIncrementRepository = require("../models/settings/repository/autoIncrementRepository");

exports.processMasterInsert = async function (companyId) {
    try {
        await AutoIncrementRepository.findAndUpdateDoc(
            {module: PROCESS_MASTER.MODULE, company: companyId},
            {
                autoIncrementValue: 1
            }
        );
        await ProcessMasterRepository.deleteManyDoc();
        for (const ele of processMasterJson) {
            ele.company = companyId;
            let createObj = await ProcessMasterRepository.findOneDoc({processName: ele.processName}, {_id: 1});
            if (!createObj) {
                await ProcessMasterRepository.createDoc(ele);
            }
        }
        console.info("Process Master Updated successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

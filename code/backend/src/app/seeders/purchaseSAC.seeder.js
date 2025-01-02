const {SACObj} = require("../mocks/constantData");
const {createSAC, findOneSAC} = require("../models/purchase/repository/sacRepository");

exports.purchaseSACInsert = async function (companyId) {
    try {
        SACObj.company = companyId;
        let createObj = await findOneSAC({sacCode: SACObj.sacCode}, {_id: 1});
        if (!createObj) {
            SACObj.isNew = false;
            await createSAC(SACObj);
        }
        console.info("Purchase SAC Created successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

const costHeadJson = require("../mocks/costHead.json");
const OPEXJson = require("../mocks/operatingExpenses.json"); 
const {createCostHead, countCostHead} = require("../models/settings/repository/costHeadRepository");
const {createOPEX, countOPEX} = require("../models/settings/repository/operationalExpensesRepository");

exports.operatingExpensesInsert = async function (companyId) {
    try {
        const costHeadCount = await countCostHead();
        const operatingExpensesCount = await countOPEX();
        for await (const ele of costHeadJson) {
            if (costHeadCount == 0) {
                ele.company = companyId;
                await createCostHead(ele);
            }
        }
        for await (const ele of OPEXJson) {
            if (operatingExpensesCount == 0) {
                ele.company = companyId;
                await createOPEX(ele);
            }
        }
        console.info("Operational Expenses updated successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

const {MAIN_MODULE_NAME, SUB_MODULE_NAME, MASTER_TRANSACT_REPORT, getFoldersLocation} = require("./postmanConstants");
const {getRoutes, REQUESTS} = require("./requests");
// exports.API_LIST = [
//     {path: "/create", method: "POST"},
//     {path: "/getAll", method: "GET"},
//     {path: "/getById/:id", method: "GET"},
//     {path: "/update/:id", method: "PUT"},
//     {path: "/delete/:id", method: "DELETE"},
//     {path: "/getAllMasterData", method: "GET"}
// ];
const getAPIList = subFolder => {
    try {
        let API_LIST = [];
        for (const sub of SUB_MODULE_NAME[subFolder]) {
            let app = require(`../src/app/controllers/v1/${MAIN_MODULE_NAME}/${sub}/routes.js`)?._router;
            API_LIST.push(getRoutes(app, sub));
        }
        return API_LIST;
    } catch (error) {
        console.error("error", error);
    }
};
exports.updateCollection = collection => {
    try {
        for (const MTR of MASTER_TRANSACT_REPORT) {
            let API_LIST = {};
            let requestArray = {};
            API_LIST[MTR] = getAPIList(MTR);
            for (const ele of API_LIST[MTR]) {
                const targetFolder = getFoldersLocation(collection, MTR, ele);
                requestArray = REQUESTS(ele);
                targetFolder.item.push(...requestArray);
            }
        }
        return JSON.stringify(collection, null, 2);
    } catch (error) {
        console.error("error", error);
    }
};

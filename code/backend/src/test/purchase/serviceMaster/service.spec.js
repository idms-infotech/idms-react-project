const Client = require("../../client");
const AuthApi = require("../../api/auth");
const authValidations = require("../../lib/auth.validations");
const { updatedServiceObj, ServiceCreateObj } = require("./data");

let client;
let authApi;
let createdServiceId;
let sacCode;
let sacId;
beforeAll(async () => {
    client = new Client();
    authApi = new AuthApi(client);
    var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
    process.env.LOGIN_TEST_TOKEN = token;
    client.setupHeaders({ "Authorization": `Bearer ${token}` });
});

describe("1.Purchase Service GetAll Master Data", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .get("api/v1/purchase/serviceMaster/getAllMasterData")
        expect(response.status).toBe(200);
        let body = response.body.result;
        // sacId = response.body.result.SACs[0]._id;
        // sacCode = response.body.result.SACs[0].sacCode;
    });
});

// describe("2.Purchase Service Create API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         const ServiceCreateObjWithSacCode = {
//             ...ServiceCreateObj,
//             sacId: sacId,
//             sacCode: sacCode,
//         };
//         let response = await client.request
//             .post("api/v1/purchase/serviceMaster/create")
//             .send(ServiceCreateObjWithSacCode);
//         expect(response.status).toBe(200);
//     });
// });

// describe("3.Purchase Service GetAll API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         const queryParams = {
//             search: null,
//             excel: 'false',
//             page: 1,
//             pageSize: 10,
//             column: 'createdAt',
//             direction: -1
//         };
//         let response = await client.request
//             .get("api/v1/purchase/serviceMaster/getAll")
//             .query(queryParams);
//         expect(response.status).toBe(200);
//         let body = response.body.result.rows;
//         expect(body.length).toBeGreaterThan(0);
//         const firstElementId = response.body.result.rows[0]._id;
//         createdServiceId = firstElementId;
//     });
// });
// describe("4.Purchase Service Get byId API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get(`api/v1/purchase/serviceMaster/getById/${createdServiceId}`)
//         expect(response.status).toBe(200);
//         let sacDetails = response.body.result;
//     });
// });

// describe("5.Purchase Service Update API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .put(`api/v1/purchase/serviceMaster/update/${createdServiceId}`)
//             .send(updatedServiceObj);
//         expect(response.status).toBe(200);
//         let updatedItem = response.body.result;
//     });

// });

// describe("6.Purchase Service Delete API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .delete(`api/v1/purchase/serviceMaster/delete/${createdServiceId}`)
//         expect(response.status).toBe(200);
//         let deletedItem = response.body.result;
//     });
// });






// const Client = require("../../client");
// const AuthApi = require("../../api/auth");
// const authValidations = require("../../lib/auth.validations");
// const { HSCreateObj, updatedHSDetails } = require("./data");

// let client;
// let authApi;
// let createdHSNId;
// beforeAll(async () => {
//     client = new Client();
//     authApi = new AuthApi(client);
//     var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
//     process.env.LOGIN_TEST_TOKEN = token;
//     client.setupHeaders({ "Authorization": `Bearer ${token}` });
// });

// describe("1.Purchase hsn GetAll Master Data", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get("api/v1/purchase/HSN/getAllMasterData")
//         expect(response.status).toBe(200);
//         let body = response.body.result;
//     });
// });

// describe("2.Purchase hsn Create API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .post("api/v1/purchase/HSN/create")
//             .send(HSCreateObj);
//         expect(response.status).toBe(200);
//     });
// });

// describe("3.Purchase hsn GetAll API", () => {
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
//             .get("api/v1/purchase/HSN/getAll")
//             .query(queryParams);
//         expect(response.status).toBe(200);
//         let body = response.body.result.rows;
//         expect(body.length).toBeGreaterThan(0);
//         const firstElementId = response.body.result.rows[0]._id;
//         createdHSNId = firstElementId;
//     });
// });
// describe("4.Purchase hsn Get byId API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get(`api/v1/purchase/HSN/getById/${createdHSNId}`)
//         expect(response.status).toBe(200);
//         let hsnDetails = response.body.result;
//     });
// });

// describe("5.Purchase hsn Update API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .put(`api/v1/purchase/HSN/update/${createdHSNId}`)
//             .send(updatedHSDetails);
//         expect(response.status).toBe(200);
//         let updatedItem = response.body.result;
//     });

// });

// describe("6.Purchase hsn Delete API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .delete(`api/v1/purchase/HSN/delete/${createdHSNId}`)
//         expect(response.status).toBe(200);
//         let deletedItem = response.body.result;
//     });
// });






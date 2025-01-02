// const Client = require("../../client");
// const AuthApi = require("../../api/auth");
// const authValidations = require("../../lib/auth.validations");
// const { itemCreate, itemUpdate } = require("./data");
// const fs = require("fs");
// const path = require("path");
// let client;
// let authApi;
// let ItemId

// beforeAll(async () => {
//     client = new Client();
//     authApi = new AuthApi(client);
//     var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
//     process.env.LOGIN_TEST_TOKEN = token;
//     client.setupHeaders({ "Authorization": `Bearer ${token}` });
// });

// describe("1.Purchase item  Master Data", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get("api/v1/purchase/itemMaster/getAllMasterData");
//         expect(response.status).toBe(200);
//         let body = response.body.result;
//     });
// });

// describe("2.Purchase item Create API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         itemCreate.supplierDetails = JSON.stringify(itemCreate.supplierDetails);
//         itemCreate.supplierDetailsForm = JSON.stringify(itemCreate.supplierDetailsForm);
//         itemCreate.rmSpecifications = JSON.stringify(itemCreate.rmSpecifications);
//         itemCreate.inventoryStockLevels = JSON.stringify(itemCreate.inventoryStockLevels);
//         itemCreate.specificationInfo = JSON.stringify(itemCreate.specificationInfo);
//         let response = await client.request
//             .post("api/v1/purchase/itemMaster/create")
//             .send(itemCreate);
//         expect(response.status).toBe(200);
//     });
// });

// describe("3.Purchase item Master GetAll API", () => {
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
//             .get("api/v1/purchase/itemMaster/getAll")
//             .query(queryParams);
//         expect(response.status).toBe(200);
//         let body = response.body.result.rows;
//         expect(body.length).toBeGreaterThan(0);
//         const firstElementId = response.body.result.rows[0]._id;
//         ItemId = firstElementId;
//     });
// });
// describe("3.Purchase item Rule Get byId API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get(`api/v1/purchase/itemMaster/getById/${ItemId}`)
//         expect(response.status).toBe(200);
//         let suppliersDetails = response.body.result;
//     });
// });

// describe("4.Purchase item Rule Update API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         itemUpdate.supplierDetails = JSON.stringify(itemUpdate.supplierDetails);
//         itemUpdate.supplierDetailsForm = JSON.stringify(itemUpdate.supplierDetailsForm);
//         itemUpdate.rmSpecifications = JSON.stringify(itemUpdate.rmSpecifications);
//         itemUpdate.inventoryStockLevels = JSON.stringify(itemUpdate.inventoryStockLevels);
//         itemUpdate.specificationInfo = JSON.stringify(itemUpdate.specificationInfo);
//         let response = await client.request
//             .put(`api/v1/purchase/itemMaster/update/${ItemId}`)
//             .send(itemUpdate);
//         expect(response.status).toBe(200);
//         let updatedItem = response.body.result;
//     });

// });

// // describe("5.Purchase item Rule Delete API", () => {
// //     it("Success", async () => {
// //         const bearerToken = process.env.LOGIN_TEST_TOKEN;
// //         let response = await client.request
// //             .delete(`api/v1/purchase/itemMaster/delete/${ItemId}`)
// //         expect(response.status).toBe(200);
// //         let deletedItem = response.body.result;
// //     });
// // });
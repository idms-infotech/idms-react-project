// const Client = require("../../client");
// const AuthApi = require("../../api/auth");
// const authValidations = require("../../lib/auth.validations");
// const { updateCGM, CreateCGM } = require("./data");

// let client;
// let authApi;
// let createdCgmId;

// beforeAll(async () => {
//     client = new Client();
//     authApi = new AuthApi(client);
//     var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
//     process.env.LOGIN_TEST_TOKEN = token;
//     client.setupHeaders({ "Authorization": `Bearer ${token}` });
// });

// describe("1.CGM GetAll Master Data", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get("api/v1/purchase/cgm/getAllMasterData")
//         expect(response.status).toBe(200);
//         let body = response.body.result;

//     });
// });

// // describe("2.CGM Create API", () => {
// //     it("Success", async () => {
// //         const bearerToken = process.env.LOGIN_TEST_TOKEN;
// //         CreateCGM.supplierInfo = JSON.stringify(CreateCGM.supplierInfo);
// //         let response = await client.request
// //             .post("api/v1/purchase/cgm/create")
// //             .send(CreateCGM);
// //         expect(response.status).toBe(200);
// //     });
// // });

// // describe("3.CGM GetAll API", () => {
// //     it("Success", async () => {
// //         const bearerToken = process.env.LOGIN_TEST_TOKEN;
// //         const queryParams = {
// //             search: null,
// //             excel: 'false',
// //             page: 1,
// //             pageSize: 10,
// //             column: 'createdAt',
// //             direction: -1
// //         };
// //         let response = await client.request
// //             .get("api/v1/purchase/cgm/getAll")
// //             .query(queryParams);
// //         expect(response.status).toBe(200);
// //         let body = response.body.result.rows;
// //         expect(body.length).toBeGreaterThan(0);
// //         const firstElementId = response.body.result.rows[0]._id;
// //         createdCgmId = firstElementId;
// //     });
// // });
// // describe("4.CGM Get byId API", () => {
// //     it("Success", async () => {
// //         const bearerToken = process.env.LOGIN_TEST_TOKEN;
// //         let response = await client.request
// //             .get(`api/v1/purchase/cgm/getById/${createdCgmId}`)
// //         expect(response.status).toBe(200);
// //         let sacDetails = response.body.result;
// //     });
// // });

// // describe("5.CGM Update API", () => {
// //     it("Success", async () => {
// //         const bearerToken = process.env.LOGIN_TEST_TOKEN;
// //         updateCGM.supplierInfo = JSON.stringify(updateCGM.supplierInfo);
// //         let response = await client.request
// //             .put(`api/v1/purchase/cgm/update/${createdCgmId}`)
// //             .send(updateCGM);
// //         expect(response.status).toBe(200);
// //         let updatedItem = response.body.result;
// //     });

// // });

// // describe("6.CGM Delete API", () => {
// //     it("Success", async () => {
// //         const bearerToken = process.env.LOGIN_TEST_TOKEN;
// //         let response = await client.request
// //             .delete(`api/v1/purchase/cgm/delete/${createdCgmId}`)
// //         expect(response.status).toBe(200);
// //         let deletedItem = response.body.result;
// //     });
// // });






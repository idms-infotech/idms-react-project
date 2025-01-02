// const Client = require("../../client");
// const AuthApi = require("../../api/auth");
// const authValidations = require("../../lib/auth.validations");
// const { paymentTerms, updatePaymentTerms } = require("./data");

// let client;
// let authApi;
// let paymentTermsId;
// beforeAll(async () => {
//     client = new Client();
//     authApi = new AuthApi(client);
//     var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
//     process.env.LOGIN_TEST_TOKEN = token;
//     client.setupHeaders({ "Authorization": `Bearer ${token}` });
// });

// describe("1.Payment Terms  GetAll Master Data", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get("api/v1/sales/paymentTerms/getAllMasterData")
//         expect(response.status).toBe(200);
//         let body = response.body.result;
//     });
// });

// describe("2.Payment Terms  Create API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .post("api/v1/sales/paymentTerms/create")
//             .send(paymentTerms);
//         expect(response.status).toBe(200);
//     });
// });

// describe("3.Payment Terms  GetAll API", () => {
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
//             .get("api/v1/sales/paymentTerms/getAll")
//             .query(queryParams);
//         expect(response.status).toBe(200);
//         let body = response.body.result.rows;
//         expect(body.length).toBeGreaterThan(0);
//         const firstElementId = response.body.result.rows[0]._id;
//         paymentTermsId = firstElementId;
//     });
// });
// describe("4.Payment Terms Get byId API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get(`api/v1/sales/paymentTerms/getById/${paymentTermsId}`)
//         expect(response.status).toBe(200);
//         let hsnDetails = response.body.result;
//     });
// });

// describe("5.Payment Terms Update API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .put(`api/v1/sales/paymentTerms/update/${paymentTermsId}`)
//             .send(updatePaymentTerms);
//         expect(response.status).toBe(200);
//         let updatedItem = response.body.result;
//     });

// });

// describe("6.Payment Terms Delete API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .delete(`api/v1/sales/paymentTerms/delete/${paymentTermsId}`)
//         expect(response.status).toBe(200);
//         let deletedItem = response.body.result;
//     });
// });






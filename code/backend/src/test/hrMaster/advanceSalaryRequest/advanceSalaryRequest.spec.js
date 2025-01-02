const Client = require("../../client");
const AuthApi = require("../../api/auth");
const authValidations = require("../../lib/auth.validations");
const { advanceSalaryRequestCreate, advanceSalaryRequestUpdate } = require("./data");

let client;
let authApi;
let advanceSalaryRequestId;
beforeAll(async () => {
    client = new Client();
    authApi = new AuthApi(client);
    var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
    process.env.LOGIN_TEST_TOKEN = token;
    client.setupHeaders({ "Authorization": `Bearer ${token}` });
});

describe("1.HR  advanceSalaryRequest GetAll Master Data API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .get("api/v1/hr/advanceSalaryRequest/getAllMasterData")
        expect(response.status).toBe(200);
        let body = response.body.result;
    });
})

// describe("2.advanceSalaryRequest  Create API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .post("api/v1/hr/advanceSalaryRequest/create")
//             .send(advanceSalaryRequestCreate);
//         expect(response.status).toBe(200);
//     });
// });


// describe("3.advanceSalaryRequest  GetAll API", () => {
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
//             .get("api/v1/hr/advanceSalaryRequest/getAll")
//             .query(queryParams);
//         expect(response.status).toBe(200);
//         let body = response.body.result.rows;
//         expect(body.length).toBeGreaterThan(0);
//         const firstElementId = response.body.result.rows[0]._id;
//         advanceSalaryRequestId = firstElementId;
//     });
// });
// describe("4.advanceSalaryRequest  Get byId API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get(`api/v1/hr/advanceSalaryRequest/getById/${advanceSalaryRequestId}`)
//         expect(response.status).toBe(200);
//         let hsnDetails = response.body.result;
//     });
// });

// describe("5.advanceSalaryRequest  Update API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .put(`api/v1/hr/advanceSalaryRequest/update/${advanceSalaryRequestId}`)
//             .send(advanceSalaryRequestUpdate);
//         expect(response.status).toBe(200);
//         let updatedItem = response.body.result;
//     });

// });

// describe("6.advanceSalaryRequest  Delete API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .delete(`api/v1/hr/advanceSalaryRequest/delete/${advanceSalaryRequestId}`)
//         expect(response.status).toBe(200);
//         let deletedItem = response.body.result;
//     });
// });
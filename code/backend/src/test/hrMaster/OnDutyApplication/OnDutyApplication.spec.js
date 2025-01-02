const Client = require("../../client");
const AuthApi = require("../../api/auth");
const authValidations = require("../../lib/auth.validations");
const { OnDutyApplicationCreate, OnDutyApplicationUpdate } = require("./data");

let client;
let authApi;
let onDutyApplicationId;
beforeAll(async () => {
    client = new Client();
    authApi = new AuthApi(client);
    var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
    process.env.LOGIN_TEST_TOKEN = token;
    client.setupHeaders({ "Authorization": `Bearer ${token}` });
});

describe("1.HR  onDutyApplication GetAll Master Data API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .get("api/v1/hr/onDutyApplication/getAllMasterData")
        expect(response.status).toBe(200);
        let body = response.body.result;
    });
});

// describe("2.onDutyApplication  Create API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .post("api/v1/hr/onDutyApplication/create")
//             .send(OnDutyApplicationCreate);
//         expect(response.status).toBe(200);
//     });
// });


// describe("3.onDutyApplication  GetAll API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         const queryParams = {
//             search: null,
//             excel: 'false',
//             page: 1,
//             pageSize: 10,
//             column: 'createdAt',
//             direction: -1,
//             Status: "Submitted"
//         };
//         let response = await client.request
//             .get("api/v1/hr/onDutyApplication/getAll")
//             .query(queryParams);
//         expect(response.status).toBe(200);
//         let body = response.body.result.rows;
//         const firstElementId = response.body.result.rows[0]._id;
//         onDutyApplicationId = firstElementId;
//     });
// });
// describe("4.onDutyApplication  Get byId API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get(`api/v1/hr/onDutyApplication/getById/${onDutyApplicationId}`)
//         expect(response.status).toBe(200);
//         let hsnDetails = response.body.result;
//     });
// });

// describe("5.onDutyApplication  Update API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .put(`api/v1/hr/onDutyApplication/update/${onDutyApplicationId}`)
//             .send(OnDutyApplicationUpdate);
//         expect(response.status).toBe(200);
//         let updatedItem = response.body.result;
//     });

// });

// describe("6.onDutyApplication GetAllReports API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         const queryParams = {
//             search: null,
//             excel: 'false',
//             page: 1,
//             pageSize: 10,
//             column: 'createdAt',
//             direction: -1,
//         };
//         let response = await client.request
//             .get("api/v1/hr/onDutyApplication/getAllReports")
//             .query(queryParams);
//         expect(response.status).toBe(200);
//         let body = response.body.result.rows;
//     });
// });


// describe("7.onDutyApplication  Delete API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .delete(`api/v1/hr/onDutyApplication/delete/${onDutyApplicationId}`)
//         expect(response.status).toBe(200);
//         let deletedItem = response.body.result;
//     });
// });




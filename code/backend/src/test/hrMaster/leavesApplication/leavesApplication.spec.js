const Client = require("../../client");
const AuthApi = require("../../api/auth");
const authValidations = require("../../lib/auth.validations");
const { leavesApplication, leavesApplicationUpdate } = require("./data");

let client;
let authApi;
let leavesApplicationId;
let employeeId
beforeAll(async () => {
    client = new Client();
    authApi = new AuthApi(client);
    var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
    process.env.LOGIN_TEST_TOKEN = token;
    client.setupHeaders({ "Authorization": `Bearer ${token}` });
});

describe("1.HR  leavesApplication GetAll Master Data API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .get("api/v1/hr/leavesApplication/getAllMasterData")
        expect(response.status).toBe(200);

    });
});

// describe("2.leavesApplication  Create API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .post("api/v1/hr/leavesApplication/create")
//             .send(leavesApplication);
//         expect(response.status).toBe(200);
//     });
// });


// describe("3.leavesApplication  GetAll API", () => {
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
//             .get("api/v1/hr/leavesApplication/getAll")
//             .query(queryParams);
//         expect(response.status).toBe(200);
//         let body = response.body.result.rows;
//         const firstElementId = response.body.result.rows[0]._id;
//         leavesApplicationId = firstElementId;
//     });
// });

// describe("4.leavesApplication  Get byId API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get(`api/v1/hr/leavesApplication/getById/${leavesApplicationId}`)
//         expect(response.status).toBe(200);
//         let leavesApplication = response.body.result;
//     });
// });

// describe("5.leavesApplication  Update API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .put(`api/v1/hr/leavesApplication/update/${leavesApplicationId}`)
//             .send(leavesApplicationUpdate);
//         expect(response.status).toBe(200);
//         let updatedItem = response.body.result;
//     });

// });


// describe("7.leavesApplication  GetAll Reports API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         const queryParams = {
//             fromDate: null,
//             toDate: null,
//             search: null,
//             excel: 'false',
//             page: 1,
//             pageSize: 10,
//             column: 'createdAt',
//             direction: -1,
//             status:"Approved"
//         };
//         let response = await client.request
//             .get("api/v1/hr/leavesApplication/getAllReports")
//             .query(queryParams);
//         expect(response.status).toBe(200);
//         let body = response.body.result.rows;
//     });
// });
// describe("6.leavesApplication  Delete API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .delete(`api/v1/hr/leavesApplication/delete/${leavesApplicationId}`)
//         expect(response.status).toBe(200);
//         let deletedItem = response.body.result;
//     });
// });


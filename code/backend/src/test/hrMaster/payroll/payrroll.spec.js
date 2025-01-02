const Client = require("../../client");
const AuthApi = require("../../api/auth");
const authValidations = require("../../lib/auth.validations");
const { PayrollCreate} = require("./data");

let client;
let authApi;
let employeeId;
beforeAll(async () => {
    client = new Client();
    authApi = new AuthApi(client);
    var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
    process.env.LOGIN_TEST_TOKEN = token;
    client.setupHeaders({ "Authorization": `Bearer ${token}` });
});

describe("1.HR  payroll GetAll Master Data API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        const date = "2024-01";
        let response = await client.request
            .get(`api/v1/hr/payroll/getAllMasterData/${date}`)
        expect(response.status).toBe(200);
        let body = response.body.result;
    });
});

// // describe("2.payroll  Create API", () => {
// //     it("Success", async () => {
// //         const bearerToken = process.env.LOGIN_TEST_TOKEN;
// //         const PayrollCreated = {
// //             ...PayrollCreate,
// //             employeeId: employeeId, 
// //         };
// //         let response = await client.request
// //             .post("api/v1/hr/payroll/create")
// //             .send(PayrollCreated);
// //         expect(response.status).toBe(200);
// //     });
// // });

// // describe("6.payroll GetAllReports API", () => {
// //     it("Success", async () => {
// //         const bearerToken = process.env.LOGIN_TEST_TOKEN;
// //         const queryParams = {
// //             search: null,
// //             excel: 'false',
// //             page: 1,
// //             pageSize: 10,
// //             column: 'createdAt',
// //             direction: -1,
// //             employeeId: "659e87e9179added664c6bb4",
// //             status: "Approved"
// //         };
// //         let response = await client.request
// //             .get("api/v1/hr/payroll/getAllReports")
// //             .query(queryParams);
// //         expect(response.status).toBe(200);
// //         let body = response.body.result.rows;
// //     });
// // });


// // describe("7.payroll  Delete API", () => {
// //     it("Success", async () => {
// //         const bearerToken = process.env.LOGIN_TEST_TOKEN;
// //         let response = await client.request
// //             .delete(`api/v1/hr/payroll/delete/${onDutyApplicationId}`)
// //         expect(response.status).toBe(200);
// //         let deletedItem = response.body.result;
// //     });
// // });
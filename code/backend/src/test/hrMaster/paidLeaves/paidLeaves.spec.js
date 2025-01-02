const Client = require("../../client");
const AuthApi = require("../../api/auth");
const authValidations = require("../../lib/auth.validations");
const { createPaidLeaves, UpdatePaidLeaves } = require("./data");

let client;
let authApi;
let paidHolidayId;
beforeAll(async () => {
    client = new Client();
    authApi = new AuthApi(client);
    var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
    process.env.LOGIN_TEST_TOKEN = token;
    client.setupHeaders({ "Authorization": `Bearer ${token}` });
});

describe("1.  Paid leaves Master Data API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .get("api/v1/hr/paidLeaves/getAllMasterData")
        expect(response.status).toBe(200);
        let body = response.body.result;
    });
});

// describe("2.paid leaves  Create API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .post("api/v1/hr/paidLeaves/create")
//             .send(createPaidLeaves);
//         expect(response.status).toBe(200);
//     });
// });


// describe("3.Paid leaves  GetAll API", () => {
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
//             .get("api/v1/hr/paidLeaves/getAll")
//             .query(queryParams);
//         expect(response.status).toBe(200);
//         let body = response.body.result.rows;
//         expect(body.length).toBeGreaterThan(0);
//         const firstElementId = response.body.result.rows[0]._id;
//         paidHolidayId = firstElementId;
//     });
// });
// describe("4.Purchase  Get byId API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get(`api/v1/hr/paidLeaves/getById/${paidHolidayId}`)
//         expect(response.status).toBe(200);
//         let hsnDetails = response.body.result;
//     });
// });

// describe("5.paid leaves  Update API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .put(`api/v1/hr/paidLeaves/update/${paidHolidayId}`)
//             .send(UpdatePaidLeaves);
//         expect(response.status).toBe(200);
//         let updatedItem = response.body.result;
//     });

// });

// describe("6.Paid leaves  Delete API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .delete(`api/v1/hr/paidLeaves/delete/${paidHolidayId}`)
//         expect(response.status).toBe(200);
//         let deletedItem = response.body.result;
//     });
// });
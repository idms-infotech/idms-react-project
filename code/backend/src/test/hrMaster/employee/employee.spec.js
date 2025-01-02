const Client = require("../../client");
const AuthApi = require("../../api/auth");
const authValidations = require("../../lib/auth.validations");
const { empData, UpdateEmpData } = require("./data");

let client;
let authApi;
let empCreateId;
beforeAll(async () => {
    client = new Client();
    authApi = new AuthApi(client);
    var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
    process.env.LOGIN_TEST_TOKEN = token;
    client.setupHeaders({ "Authorization": `Bearer ${token}` });
});

describe("1.HR  Employee Master Data API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .get("api/v1/hr/employee/getAllMasterData")
        expect(response.status).toBe(200);
        let body = response.body.result;
    });
});

// describe("2. HR  Employee  Create API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .post("api/v1/hr/employee/create")
//             .send(empData);
//         expect(response.status).toBe(200);
//     });
// });


// describe("3.HR  Employee GetAll API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         const queryParams = {
//             search: null,
//             excel: 'false',
//             page: 1,
//             pageSize: 10,
//             column: 'createdAt',
//             direction: 1
//         };
//         let response = await client.request
//             .get("api/v1/hr/employee/getAll")
//             .query(queryParams);
//         expect(response.status).toBe(200);
//         let body = response.body.result.rows;
//         expect(body.length).toBeGreaterThan(0);
//         const firstElementId = response.body.result.rows[0]._id;
//         empCreateId = firstElementId;
//     });
// });
// describe("4.HR  Employee Get byId API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get(`api/v1/hr/employee/getById/${empCreateId}`)
//         expect(response.status).toBe(200);
//         let hsnDetails = response.body.result;
//     });
// });

// describe("5.HR  Employee Update API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .put(`api/v1/hr/employee/update/${empCreateId}`)
//             .send(UpdateEmpData);
//         expect(response.status).toBe(200);
//         let updatedItem = response.body.result;
//     });

// });
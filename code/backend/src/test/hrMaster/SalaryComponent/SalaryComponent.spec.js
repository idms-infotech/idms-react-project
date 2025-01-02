const Client = require("../../client");
const AuthApi = require("../../api/auth");
const authValidations = require("../../lib/auth.validations");
const { salaryComponentCreate, salaryComponentUpdate } = require("./data");

let client;
let authApi;
let salaryComponentId;
beforeAll(async () => {
    client = new Client();
    authApi = new AuthApi(client);
    var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
    process.env.LOGIN_TEST_TOKEN = token;
    client.setupHeaders({ "Authorization": `Bearer ${token}` });
});

describe("1.HR  salaryComponent GetAll Master Data API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .get("api/v1/hr/salaryComponent/getAllMasterData")
        expect(response.status).toBe(200);
        let body = response.body.result;
    });
});


// describe("2.salaryComponent  Create API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .post("api/v1/hr/salaryComponent/create")
//             .send(salaryComponentCreate);
//         expect(response.status).toBe(200);
//     });
// });


// describe("3.salaryComponent  GetAll API", () => {
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
//             .get("api/v1/hr/salaryComponent/getAll")
//             .query(queryParams);
//         expect(response.status).toBe(200);
//         let body = response.body.result.rows;
//         expect(body.length).toBeGreaterThan(0);
//         const firstElementId = response.body.result.rows[0]._id;
//         salaryComponentId = firstElementId;
//     });
// });
// describe("4.salaryComponent  Get byId API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get(`api/v1/hr/salaryComponent/getById/${salaryComponentId}`)
//         expect(response.status).toBe(200);
//         let hsnDetails = response.body.result;
//     });
// });

// describe("5.salaryComponent  Update API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .put(`api/v1/hr/salaryComponent/update/${salaryComponentId}`)
//             .send(salaryComponentUpdate);
//         expect(response.status).toBe(200);
//         let updatedItem = response.body.result;
//     });

// });

// describe("6.salaryComponent  Delete API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .delete(`api/v1/hr/salaryComponent/delete/${salaryComponentId}`)
//         expect(response.status).toBe(200);
//         let deletedItem = response.body.result;
//     });
// });
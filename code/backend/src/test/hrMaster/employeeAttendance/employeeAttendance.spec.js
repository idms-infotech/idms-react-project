const Client = require("../../client");
const AuthApi = require("../../api/auth");
const authValidations = require("../../lib/auth.validations");
const { employeeAttendanceCreate, employeeAttendanceUpdate } = require("./data");

let client;
let authApi;
let employeeAttendanceId;
beforeAll(async () => {
    client = new Client();
    authApi = new AuthApi(client);
    var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
    process.env.LOGIN_TEST_TOKEN = token;
    client.setupHeaders({ "Authorization": `Bearer ${token}` });
});

describe("1. HR EmployeeAttendance GetAll Master Data API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let date = "2023-12";
        let response = await client.request
            .get(`api/v1/hr/employeeAttendance/getAllMasterData/${date}`)
        expect(response.status).toBe(200);
        let body = response.body.result.attendanceOfMonth;
        const firstElementId = response.body.result.attendanceOfMonth[0]._id;
        employeeAttendanceId = firstElementId;
    });
});


// describe("2.employeeAttendance  Create API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .post("api/v1/hr/employeeAttendance/create")
//             .send(employeeAttendanceCreate);
//         expect(response.status).toBe(200);
//     });
// });
// describe("3.employeeAttendance  GetAllReports  API", () => {
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
//             .get("api/v1/hr/employeeAttendance/getAllReports")
//             .query(queryParams);
//         expect(response.status).toBe(200);
//         let body = response.body.result.rows;
//     });
// });

// describe("4.employeeAttendance  Get byId API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get(`api/v1/hr/employeeAttendance/getById/${employeeAttendanceId}`)
//         expect(response.status).toBe(200);
//         let hsnDetails = response.body.result;
//     });
// });

// describe("6.employeeAttendance  Delete API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .delete(`api/v1/hr/employeeAttendance/delete/${employeeAttendanceId}`)
//         expect(response.status).toBe(200);
//         let deletedItem = response.body.result;
//     });
// });

const Client = require("../../client");
const AuthApi = require("../../api/auth");
const authValidations = require("../../lib/auth.validations");
const { SupplierRuleCreateObj, UpdateSupplierRuleObj } = require("./data");

let client;
let authApi;
let createdSupplierRuleMasterId;
beforeAll(async () => {
    client = new Client();
    authApi = new AuthApi(client);
    var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
    process.env.LOGIN_TEST_TOKEN = token;
    client.setupHeaders({ "Authorization": `Bearer ${token}` });
});


describe("1.Purchase Supplier Rule Create API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .post("api/v1/purchase/supplierRuleMaster/create")
            .send(SupplierRuleCreateObj);
        expect(response.status).toBe(200);
    });
});

// describe("2.Purchase Supplier Rule GetAll API", () => {
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
//             .get("api/v1/purchase/supplierRuleMaster/getAll")
//             .query(queryParams);
//         expect(response.status).toBe(200);
//         let body = response.body.result.rows;
//         expect(body.length).toBeGreaterThan(0);
//         const firstElementId = response.body.result.rows[0]._id;
//         createdSupplierRuleMasterId = firstElementId;
//     });
// });
// describe("3.Purchase Supplier Rule Get byId API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .get(`api/v1/purchase/supplierRuleMaster/getById/${createdSupplierRuleMasterId}`)
//         expect(response.status).toBe(200);
//         let suppliersDetails = response.body.result;
//     });
// });

// describe("4.Purchase Supplier Rule Update API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .put(`api/v1/purchase/supplierRuleMaster/update/${createdSupplierRuleMasterId}`)
//             .send(UpdateSupplierRuleObj);
//         expect(response.status).toBe(200);
//         let updatedItem = response.body.result;
//     });

// });

// describe("5.Purchase Supplier Rule Delete API", () => {
//     it("Success", async () => {
//         const bearerToken = process.env.LOGIN_TEST_TOKEN;
//         let response = await client.request
//             .delete(`api/v1/purchase/supplierRuleMaster/delete/${createdSupplierRuleMasterId}`)
//         expect(response.status).toBe(200);
//         let deletedItem = response.body.result;
//     });
// });






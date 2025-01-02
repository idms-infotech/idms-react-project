const Client = require("../../client");
const AuthApi = require("../../api/auth");
const authValidations = require("../../lib/auth.validations");
const { SACreateObj, updatedSADetails } = require("./data");

let client;
let authApi;
let createdSACId;
beforeAll(async () => {
    client = new Client();
    authApi = new AuthApi(client);
    var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
    process.env.LOGIN_TEST_TOKEN = token;
    client.setupHeaders({ "Authorization": `Bearer ${token}` });
});

describe("1.Purchase sac GetAll Master Data", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .get("api/v1/purchase/SAC/getAllMasterData")
        expect(response.status).toBe(200);
        let body = response.body.result;
    });
});

describe("2.Purchase sac Create API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .post("api/v1/purchase/SAC/create")
            .send(SACreateObj);
        expect(response.status).toBe(200);
    });
});

describe("3.Purchase sac GetAll API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        const queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1
        };
        let response = await client.request
            .get("api/v1/purchase/SAC/getAll")
            .query(queryParams);
        expect(response.status).toBe(200);
        let body = response.body.result.rows;
        expect(body.length).toBeGreaterThan(0);
        const firstElementId = response.body.result.rows[0]._id;
        createdSACId = firstElementId;
    });
});
describe("4.Purchase sac Get byId API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .get(`api/v1/purchase/SAC/getById/${createdSACId}`)
        expect(response.status).toBe(200);
        let sacDetails = response.body.result;
    });
});

describe("5.Purchase sac Update API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .put(`api/v1/purchase/SAC/update/${createdSACId}`)
            .send(updatedSADetails);
        expect(response.status).toBe(200);
        let updatedItem = response.body.result;
    });

});

describe("6.Purchase sac Delete API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .delete(`api/v1/purchase/SAC/delete/${createdSACId}`)
        expect(response.status).toBe(200);
        let deletedItem = response.body.result;
    });
});





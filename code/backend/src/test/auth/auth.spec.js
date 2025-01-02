const request = require("supertest");
const Client = require("../client");
const AuthApi = require("../api/auth");
const authValidations = require("../lib/auth.validations");
const {CONSTANTS} = require("../../config/config");
const app = require("express")();

let client;
let authApi;
beforeAll(async () => {
    client = new Client();
    authApi = new AuthApi(client);
});

describe("1. Login API", () => {
    // it("1. should allow login using correct credentials (explicit target and endpoint API test - AVOID)", async () => {
    //     let response = await request(app)
    //         .post("api/v1/settings/user/login")
    //         .send({email: "superadmin@gmail.com", password: "Admin@1234"});
    //     expect(response.status).toBe(200);
    //     let body = response.body;
    //     expect(body).toHaveProperty("token");
    //     let token = body.token;
    //     authValidations.validateToken(token);
    // });
    it("2. should allow login using correct credentials (using client for implicit target environment but using explicit endpoints)", async () => {
        let response = await client.request
            .post("api/v1/settings/user/login")
            .send({email: "superadmin@gmail.com", password: "Admin@1234"});
        expect(response.status).toBe(200);
        let body = response.body.result;
        expect(body).toHaveProperty("token");
        let token = body.token;
        console.log("token", token);
        authValidations.validateToken(token);
    });
    it("3. should fail login using incorrect credentials (direct call to avoid complicating API abstraction)", async () => {
        let response = await client.request.post("api/v1/settings/user/login").send({email: "superadmin@gmail.com"});
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
});

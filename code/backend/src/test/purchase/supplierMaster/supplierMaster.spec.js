const Client = require("../../client");
const AuthApi = require("../../api/auth");
const authValidations = require("../../lib/auth.validations");
const { createSupplierOBj, updateSupplierOBj } = require("./data");
const fs = require("fs");
const path = require("path");
let client;
let authApi;
let createdServiceId;
let freightTerms;
let currencies;
let paymentTerms;
let purchaseTypes;
let purchaseCountry;
let createdSupplierId;

beforeAll(async () => {
    client = new Client();
    authApi = new AuthApi(client);
    var token = await authApi.login("superadmin@gmail.com", "Admin@1234");
    process.env.LOGIN_TEST_TOKEN = token;
    client.setupHeaders({ "Authorization": `Bearer ${token}` });
});

describe("1.Purchase supplier  Master Data", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .get("api/v1/purchase/supplierMaster/getAllMasterData");
        expect(response.status).toBe(200);
        let body = response.body.result;
        currencies = response.body.result.currencies[0].value;
        freightTerms = response.body.result.freightTerms[0].value;
        paymentTerms = response.body.result.paymentTerms[0].value;
        purchaseTypes = response.body.result.purchaseTypes[0].value;
        purchaseCountry = response.body.result.purchaseCountry[0].parameterName;
    });
});

describe("2.Purchase Master Create API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        createSupplierOBj.supplierBillingAddress = JSON.stringify(createSupplierOBj.supplierBillingAddress);
        createSupplierOBj.supplierShippingAddress = JSON.stringify(createSupplierOBj.supplierShippingAddress);
        createSupplierOBj.supplierAddress = JSON.stringify(createSupplierOBj.supplierAddress);
        createSupplierOBj.supplierContactMatrix = JSON.stringify(createSupplierOBj.supplierContactMatrix);
        createSupplierOBj.supplierBankDetails = JSON.stringify(createSupplierOBj.supplierBankDetails);
        let response = await client.request
            .post("api/v1/purchase/supplierMaster/create")
            .send(createSupplierOBj);
        expect(response.status).toBe(200);
    });
});

describe("3.Purchase Supplier Master GetAll API", () => {
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
            .get("api/v1/purchase/supplierMaster/getAll")
            .query(queryParams);
        expect(response.status).toBe(200);
        let body = response.body.result.rows;
        expect(body.length).toBeGreaterThan(0);
        const firstElementId = response.body.result.rows[0]._id;
        createdSupplierId = firstElementId;
    });
});
describe("3.Purchase Supplier Rule Get byId API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .get(`api/v1/purchase/supplierMaster/getById/${createdSupplierId}`)
        expect(response.status).toBe(200);
        let suppliersDetails = response.body.result;
    });
});

describe("4.Purchase Supplier Rule Update API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        updateSupplierOBj.supplierBillingAddress = JSON.stringify(updateSupplierOBj.supplierBillingAddress);
        updateSupplierOBj.supplierShippingAddress = JSON.stringify(updateSupplierOBj.supplierShippingAddress);
        updateSupplierOBj.supplierAddress = JSON.stringify(updateSupplierOBj.supplierAddress);
        updateSupplierOBj.supplierContactMatrix = JSON.stringify(updateSupplierOBj.supplierContactMatrix);
        updateSupplierOBj.supplierBankDetails = JSON.stringify(updateSupplierOBj.supplierBankDetails);
        let response = await client.request
            .put(`api/v1/purchase/supplierMaster/update/${createdSupplierId}`)
            .send(updateSupplierOBj);
        expect(response.status).toBe(200);
        let updatedItem = response.body.result;
    });

});

describe("5.Purchase Supplier Rule Delete API", () => {
    it("Success", async () => {
        const bearerToken = process.env.LOGIN_TEST_TOKEN;
        let response = await client.request
            .delete(`api/v1/purchase/supplierMaster/delete/${createdSupplierId}`)
        expect(response.status).toBe(200);
        let deletedItem = response.body.result;
    });
});
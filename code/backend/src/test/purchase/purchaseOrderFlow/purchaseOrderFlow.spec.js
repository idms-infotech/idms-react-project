// PURCHASE ORDER FULL JEST UNIT TEST FLOW 
const { MongoClient } = require('mongodb');
const Client = require("../../client");
const AuthApi = require("../../api/auth");
const { HSNObj, invalidHSNObj, HSNUpdateObj } = require("../purchaseOrderFlow/_hsn_data");
const { createSupplierOBj, InvalidSupplierOBj, updateSupplierOBj } = require("../purchaseOrderFlow/_supplier_data");
const { itemCreate, itemUpdate, InvalidItemUpdate } = require("../purchaseOrderFlow/_item_data")

let client;
let authApi;
let hsnId;
let supplierId;
let itemId;
const getAuthToken = async () => {
    const token = await authApi.login("superadmin@gmail.com", "Admin@1234");
    process.env.LOGIN_TEST_TOKEN = token;
    client.setupHeaders({ "Authorization": `Bearer ${token}` });
};

beforeAll(async () => {
    client = new Client();
    authApi = new AuthApi(client);
    await getAuthToken();
});

// HSN CRUD START FROM HERE

describe("1. Purchase HSN GetAll Master Data", () => {
    it("should return data with status 200", async () => {
        const response = await client.request.get("api/v1/purchase/HSN/getAllMasterData");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
});

describe("2. Purchase HSN Create", () => {
    it("2/1 should create HSN with valid data", async () => {
        let response = await client.request.post("api/v1/purchase/HSN/create")
            .send(HSNObj);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
    it("2/2 It should give error of handle validation errors for HSN creation", async () => {
        let response = await client.request.post("api/v1/purchase/HSN/create")
            .send(invalidHSNObj);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
});

describe("3. Purchase HSN Get All", () => {
    it("3/1 should return data with status 200", async () => {
        const queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1
        };
        const response = await client.request
            .get("api/v1/purchase/HSN/getAll")
            .query(queryParams);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
        hsnId = result.rows[0]._id;
    });
    it("3/2 should handel error of api request different", async () => {
        let queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1
        };
        const response = await client.request
            .post("api/v1/purchase/HSN/getAll")
            .query(queryParams)
        expect(response.status).toBe(404);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Page not found");
    });
});

describe("4. Purchase HSN GetById", () => {
    it("4/1 should return data with status 200 using the stored ID", async () => {
        expect(hsnId).toBeDefined();
        const response = await client.request.get(`api/v1/purchase/HSN/getById/${hsnId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

    it("4/2 should handle error when using an invalid ID", async () => {
        let invalidId = "invalid_id";
        const response = await client.request.get(`api/v1/purchase/HSN/getById/${invalidId}`);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
});

describe("5. Purchase HSN Update", () => {
    it("5/1 should update HSN with valid data", async () => {
        expect(hsnId).toBeDefined();
        let response = await client.request.put(`api/v1/purchase/HSN/update/${hsnId}`)
            .send(HSNUpdateObj);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        let result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

    it("5/2 should handle error of updating with invalid data", async () => {
        expect(hsnId).toBeDefined();
        let response = await client.request.put(`api/v1/purchase/HSN/update/${hsnId}`)
            .send(invalidHSNObj);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
    it("5/3 should handle error when using an invalid ID", async () => {
        let invalidId = "invalid_id";
        let response = await client.request.put(`api/v1/purchase/HSN/update/${invalidId}`)
            .send(invalidHSNObj);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });

});

describe("6. Purchase HSN Delete", () => {
    it("6/1 should delete HSN with valid ID", async () => {
        expect(hsnId).toBeDefined();
        let response = await client.request.delete(`api/v1/purchase/HSN/delete/${hsnId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        let result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
    it("6/2 should handle error of deleting with invalid ID", async () => {
        let invalidId = "invalid_id";
        let response = await client.request.delete(`api/v1/purchase/HSN/delete/${invalidId}`);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
});


describe("1. Purchase SUPPLIER GetAll Master Data", () => {
    it("should return data with status 200", async () => {
        const response = await client.request.get("api/v1/purchase/supplierMaster/getAllMasterData");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
});

describe("2. Purchase SUPPLIER Create", () => {
    it("2/1 should create SUPPLIER with valid data", async () => {
        createSupplierOBj.supplierBillingAddress = JSON.stringify(createSupplierOBj.supplierBillingAddress);
        createSupplierOBj.supplierShippingAddress = JSON.stringify(createSupplierOBj.supplierShippingAddress);
        createSupplierOBj.supplierAddress = JSON.stringify(createSupplierOBj.supplierAddress);
        createSupplierOBj.supplierContactMatrix = JSON.stringify(createSupplierOBj.supplierContactMatrix);
        createSupplierOBj.supplierBankDetails = JSON.stringify(createSupplierOBj.supplierBankDetails);
        let response = await client.request.post("api/v1/purchase/supplierMaster/create")
            .send(createSupplierOBj);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
    it("2/2 It should give error of handle validation errors for supplierMaster creation", async () => {
        InvalidSupplierOBj.supplierBillingAddress = JSON.stringify(InvalidSupplierOBj.supplierBillingAddress);
        InvalidSupplierOBj.supplierShippingAddress = JSON.stringify(InvalidSupplierOBj.supplierShippingAddress);
        InvalidSupplierOBj.supplierAddress = JSON.stringify(InvalidSupplierOBj.supplierAddress);
        InvalidSupplierOBj.supplierContactMatrix = JSON.stringify(InvalidSupplierOBj.supplierContactMatrix);
        InvalidSupplierOBj.supplierBankDetails = JSON.stringify(InvalidSupplierOBj.supplierBankDetails);
        let response = await client.request.post("api/v1/purchase/supplierMaster/create")
            .send(InvalidSupplierOBj);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
});

describe("3. Purchase SUPPLIER Get All", () => {
    it("3/1 should return data with status 200", async () => {
        const queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1
        };
        const response = await client.request
            .get("api/v1/purchase/supplierMaster/getAll")
            .query(queryParams);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
        supplierId = result.rows[0]._id;
    });
    it("3/2 should handel error of api request different", async () => {
        let queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1
        };
        const response = await client.request
            .post("api/v1/purchase/supplierMaster/getAll")
            .query(queryParams)
        expect(response.status).toBe(404);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Page not found");
    });
});

describe("4. Purchase SUPPLIER GetById", () => {
    it("4/1 should return data with status 200 using the stored ID", async () => {
        expect(supplierId).toBeDefined();
        const response = await client.request.get(`api/v1/purchase/supplierMaster/getById/${supplierId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

    it("4/2 should handle error when using an invalid ID", async () => {
        let invalidId = "invalid_id";
        const response = await client.request.get(`api/v1/purchase/supplierMaster/getById/${invalidId}`);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
});

describe("5. Purchase SUPPLIER Update", () => {
    it("5/1 should update SUPPLIER with valid data", async () => {
        expect(supplierId).toBeDefined();
        updateSupplierOBj.supplierBillingAddress = JSON.stringify(updateSupplierOBj.supplierBillingAddress);
        updateSupplierOBj.supplierShippingAddress = JSON.stringify(updateSupplierOBj.supplierShippingAddress);
        updateSupplierOBj.supplierAddress = JSON.stringify(updateSupplierOBj.supplierAddress);
        updateSupplierOBj.supplierContactMatrix = JSON.stringify(updateSupplierOBj.supplierContactMatrix);
        updateSupplierOBj.supplierBankDetails = JSON.stringify(updateSupplierOBj.supplierBankDetails);
        let response = await client.request.put(`api/v1/purchase/supplierMaster/update/${supplierId}`)
            .send(updateSupplierOBj);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        let result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

    it("5/2 should handle error of updating with invalid data", async () => {
        expect(supplierId).toBeDefined();
        InvalidSupplierOBj.supplierBillingAddress = JSON.stringify(InvalidSupplierOBj.supplierBillingAddress);
        InvalidSupplierOBj.supplierShippingAddress = JSON.stringify(InvalidSupplierOBj.supplierShippingAddress);
        InvalidSupplierOBj.supplierAddress = JSON.stringify(InvalidSupplierOBj.supplierAddress);
        InvalidSupplierOBj.supplierContactMatrix = JSON.stringify(InvalidSupplierOBj.supplierContactMatrix);
        InvalidSupplierOBj.supplierBankDetails = JSON.stringify(InvalidSupplierOBj.supplierBankDetails);
        let response = await client.request.put(`api/v1/purchase/supplierMaster/update/${supplierId}`)
            .send(InvalidSupplierOBj);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
    it("5/3 should handle error when using an invalid ID", async () => {
        let invalidId = "invalid_id";
        InvalidSupplierOBj.supplierBillingAddress = JSON.stringify(InvalidSupplierOBj.supplierBillingAddress);
        InvalidSupplierOBj.supplierShippingAddress = JSON.stringify(InvalidSupplierOBj.supplierShippingAddress);
        InvalidSupplierOBj.supplierAddress = JSON.stringify(InvalidSupplierOBj.supplierAddress);
        InvalidSupplierOBj.supplierContactMatrix = JSON.stringify(InvalidSupplierOBj.supplierContactMatrix);
        InvalidSupplierOBj.supplierBankDetails = JSON.stringify(InvalidSupplierOBj.supplierBankDetails);
        let response = await client.request.put(`api/v1/purchase/supplierMaster/update/${invalidId}`)
            .send(InvalidSupplierOBj);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });

});

// describe("6. Purchase SUPPLIER Delete", () => {
//     it("6/1 should delete SUPPLIER with valid ID", async () => {
//         expect(supplierId).toBeDefined();
//         let response = await client.request.delete(`api/v1/purchase/supplierMaster/delete/${supplierId}`);
//         expect(response.status).toBe(200);
//         expect(response.body).toHaveProperty('result');
//         let result = response.body.result;
//         expect(result).toBeInstanceOf(Object);
//     });
//     it("6/2 should handle error of deleting with invalid ID", async () => {
//         let invalidId = "invalid_id";
//         let response = await client.request.delete(`api/v1/purchase/supplierMaster/delete/${invalidId}`);
//         expect(response.status).toBe(503);
//         let body = response.body;
//         expect(body).toHaveProperty("error");
//         let error = body.error;
//         expect(typeof error).toBe("string");
//         expect(error).toBe("Oops! something went wrong");
//     });
// });


describe("1. Purchase ITEM GetAll Master Data", () => {
    it("should return data with status 200", async () => {
        const response = await client.request.get("api/v1/purchase/itemMaster/getAllMasterData");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
});

describe("2. Purchase ITEM Create", () => {
    it("2/1 should create ITEM with valid data", async () => {
        itemCreate.supplierDetails = JSON.stringify(itemCreate.supplierDetails);
        itemCreate.supplierDetailsForm = JSON.stringify(itemCreate.supplierDetailsForm);
        itemCreate.rmSpecifications = JSON.stringify(itemCreate.rmSpecifications);
        itemCreate.inventoryStockLevels = JSON.stringify(itemCreate.inventoryStockLevels);
        itemCreate.specificationInfo = JSON.stringify(itemCreate.specificationInfo);
        itemCreate.supplierDetailsForm = JSON.stringify(itemCreate.supplierDetailsForm);
        let response = await client.request.post("api/v1/purchase/itemMaster/create")
            .send(itemCreate);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
    it("2/2 It should give error of handle validation errors for ITEM creation", async () => {
        let response = await client.request.post("api/v1/purchase/itemMaster/create")
            .send(InvalidItemUpdate);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
});

describe("3. Purchase ITEM Get All", () => {
    it("3/1 should return data with status 200", async () => {
        const queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1
        };
        const response = await client.request
            .get("api/v1/purchase/itemMaster/getAll")
            .query(queryParams);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
        itemId = result.rows[0]._id;
    });
    it("3/2 should handel error of api request different", async () => {
        let queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1
        };
        const response = await client.request
            .post("api/v1/purchase/itemMaster/getAll")
            .query(queryParams)
        expect(response.status).toBe(404);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Page not found");
    });
});

describe("4. Purchase ITEM GetById", () => {
    it("4/1 should return data with status 200 using the stored ID", async () => {
        expect(itemId).toBeDefined();
        const response = await client.request.get(`api/v1/purchase/itemMaster/getById/${itemId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

    it("4/2 should handle error when using an invalid ID", async () => {
        let invalidId = "invalid_id";
        const response = await client.request.get(`api/v1/purchase/itemMaster/getById/${invalidId}`);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
});

describe("5. Purchase ITEM Update", () => {
    it("5/1 should update ITEM with valid data", async () => {
        expect(itemId).toBeDefined();
        itemUpdate.supplierDetails = JSON.stringify(itemUpdate.supplierDetails);
        itemUpdate.supplierDetailsForm = JSON.stringify(itemUpdate.supplierDetailsForm);
        itemUpdate.rmSpecifications = JSON.stringify(itemUpdate.rmSpecifications);
        itemUpdate.inventoryStockLevels = JSON.stringify(itemUpdate.inventoryStockLevels);
        itemUpdate.specificationInfo = JSON.stringify(itemUpdate.specificationInfo);
        itemUpdate.supplierDetailsForm = JSON.stringify(itemUpdate.supplierDetailsForm);
        let response = await client.request.put(`api/v1/purchase/itemMaster/update/${itemId}`)
            .send(itemUpdate);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        let result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

    it("5/2 should handle error of updating with invalid data", async () => {
        expect(itemId).toBeDefined();
        InvalidItemUpdate.supplierDetails = JSON.stringify(InvalidItemUpdate.supplierDetails);
        InvalidItemUpdate.supplierDetailsForm = JSON.stringify(InvalidItemUpdate.supplierDetailsForm);
        InvalidItemUpdate.rmSpecifications = JSON.stringify(InvalidItemUpdate.rmSpecifications);
        InvalidItemUpdate.inventoryStockLevels = JSON.stringify(InvalidItemUpdate.inventoryStockLevels);
        InvalidItemUpdate.specificationInfo = JSON.stringify(InvalidItemUpdate.specificationInfo);
        InvalidItemUpdate.supplierDetailsForm = JSON.stringify(InvalidItemUpdate.supplierDetailsForm);
        let response = await client.request.put(`api/v1/purchase/itemMaster/update/${itemId}`)
            .send(InvalidItemUpdate);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
    it("5/3 should handle error when using an invalid ID", async () => {
        let invalidId = "invalid_id";
        InvalidItemUpdate.supplierDetails = JSON.stringify(InvalidItemUpdate.supplierDetails);
        InvalidItemUpdate.supplierDetailsForm = JSON.stringify(InvalidItemUpdate.supplierDetailsForm);
        InvalidItemUpdate.rmSpecifications = JSON.stringify(InvalidItemUpdate.rmSpecifications);
        InvalidItemUpdate.inventoryStockLevels = JSON.stringify(InvalidItemUpdate.inventoryStockLevels);
        InvalidItemUpdate.specificationInfo = JSON.stringify(InvalidItemUpdate.specificationInfo);
        InvalidItemUpdate.supplierDetailsForm = JSON.stringify(InvalidItemUpdate.supplierDetailsForm);
        let response = await client.request.put(`api/v1/purchase/itemMaster/update/${invalidId}`)
            .send(InvalidItemUpdate);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });

});

// describe("6. Purchase ITEM Delete", () => {
//     it("6/1 should delete ITEM with valid ID", async () => {
//         expect(itemId).toBeDefined();
//         let response = await client.request.delete(`api/v1/purchase/itemMaster/delete/${itemId}`);
//         expect(response.status).toBe(200);
//         expect(response.body).toHaveProperty('result');
//         let result = response.body.result;
//         expect(result).toBeInstanceOf(Object);
//     });
//     it("6/2 should handle error of deleting with invalid ID", async () => {
//         let invalidId = "invalid_id";
//         let response = await client.request.delete(`api/v1/purchase/itemMaster/delete/${invalidId}`);
//         expect(response.status).toBe(503);
//         let body = response.body;
//         expect(body).toHaveProperty("error");
//         let error = body.error;
//         expect(typeof error).toBe("string");
//         expect(error).toBe("Oops! something went wrong");
//     });
// });

// afterAll(async () => {
//     const mongoUri = 'mongodb+srv://idms-test:Ev5oFFLMmmMnuatF@cluster0.pe5lmbu.mongodb.net/functional-test?retryWrites=true&w=majority';
//     const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
//     try {
//         await client.connect();
//         await client.db().collection('HSN').deleteMany({});
//         await client.db().collection('Items').deleteMany({});
//         await client.db().collection('Supplier').deleteMany({});
//     } catch (error) {
//         console.error('Error In cleaning  collections:', error);
//     } finally {
//         await client.close();
//     }
// });

















// PURCHASE ORDER FULL JEST UNIT TEST FLOW 
const Client = require("../../client");
const AuthApi = require("../../api/auth");
const { poCreate, poInvalid, poUpdate, grnData, grnInvalidData, mrnCreate,
     mrnInvalid, mrnREJECTUpdate, 
     mrnPartialRelease, mrnRelease,GINCreate } = require("./_purchaseOrder");
const { Result } = require("express-validator");

let client;
let authApi;
let purchaseId;
let grnId;
let MRNId;

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
describe("1. Purchase Order GetAll Master Data", () => {
    it("should return data with status 200", async () => {
        const response = await client.request.get("api/v1/purchase/po/getAllMasterData");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
});

describe("2. Purchase Order Create", () => {
    it("2/1 should create PO with valid data", async () => {
        let response = await client.request.post("api/v1/purchase/po/create")
            .send(poCreate);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
    it("2/2 It should give error of handle validation errors for PO creation", async () => {
        let response = await client.request.post("api/v1/purchase/po/create")
            .send(poInvalid);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
});

describe("3. Purchase PO Get All", () => {
    it("3/1 should return data with status 200", async () => {
        let queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1,
            statusArray: ["Rejected", "GRN Partial Created", "GRN Created", "Closed", "Cancelled"]
        };

        const response = await client.request
            .get("api/v1/purchase/po/getAll")
            .query(queryParams);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
        purchaseId = result.rows[0]._id;
    });
    it("3/2 should handel error of api request different", async () => {
        let queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1,
            statusArray: ["Rejected", "GRN Partial Created", "GRN Created", "Closed", "Cancelled"]
        };
        const response = await client.request
            .post("api/v1/purchase/po/getAll")
            .query(queryParams)
        expect(response.status).toBe(404);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Page not found");
    });
});

describe("4. Rejected  of purchase order", () => {
    it("4/1 should reject PO", async () => {
        let purchaseOrderId = "65b7535f0648ea61958be6fe"
        const response = await client.request.put(`api/v1/purchase/po/update/${purchaseOrderId}`)
            .send({ POStatus: "Rejected" });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

})
describe("5. Rejected  of purchase order", () => {
    it("4/1 should reject PO", async () => {
        let purOrderedId = "65b753c32accb50094e1f3dc"
        const response = await client.request.put(`api/v1/purchase/po/update/${purOrderedId}`)
            .send({ POStatus: "Cancelled" });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

})

describe("5. Purchase Order Update and Approve and Generate Report", () => {
    it("5/1 should update PO status to Approved", async () => {
        const response = await client.request.put(`api/v1/purchase/po/update/${purchaseId}`)
            .send({ POStatus: "Approved" });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

    it("5/2 should generate report after PO approval", async () => {
        const response = await client.request.put(`api/v1/purchase/po/update/${purchaseId}`)
            .send({ POStatus: "Report Generated" });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

});

describe("6. Purchase PO Get AllReports", () => {
    it("6/1 should return data with status 200", async () => {
        let queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1,
            toDate: "2024-01-27",
            fromDate: "2024-01-01"
        };

        const response = await client.request
            .get("api/v1/purchase/po/getAllReports")
            .query(queryParams);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
});

describe("7. store GRN GetAll Master Data", () => {
    it("should return data with status 200", async () => {
        const response = await client.request.get("api/v1/stores/grn/getAllMasterData");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
});

describe("8. store GRN Create", () => {
    it("8/1 should create GRN with valid data", async () => {
        let response = await client.request.post("api/v1/stores/grn/create")
            .send(grnData);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
    it("8/2 It should give error of handle validation errors for GRN creation", async () => {
        let response = await client.request.post("api/v1/stores/grn/create")
            .send(grnInvalidData);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
});
describe("9. Purchase GRN Get All", () => {
    it("9/1 should return data with status 200", async () => {
        const queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1,
            statusArray: ["Report Generated", "Closed", "Cancelled"]
        };
        const response = await client.request
            .get("api/v1/stores/grn/getAll")
            .query(queryParams);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
        grnId = result.rows[0]._id;
    });
    it("9/2 should handel error of api request different", async () => {
        let queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1,
            statusArray: ["Report Generated", "Closed", "Cancelled"]
        };
        const response = await client.request
            .post("api/v1/stores/grn/getAll")
            .query(queryParams)
        expect(response.status).toBe(404);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Page not found");
    });
});

describe("10. Purchase GRN GetById", () => {
    it("10/1 should return data with status 200 using the stored ID", async () => {
        expect(grnId).toBeDefined();
        const response = await client.request.get(`api/v1/stores/grn/getById/${grnId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

    it("10/2 should handle error when using an invalid ID", async () => {
        let invalidId = "invalid_id";
        const response = await client.request.get(`api/v1/stores/grn/getById/${invalidId}`);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
});

describe("11. GRN Update and Approve and Generate Report", () => {
    it("11/1 should update PO status to Approved", async () => {
        const response = await client.request.put(`api/v1/stores/grn/update/${grnId}`)
            .send({ GRNStatus: "Approved" });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

    it("11/2 should generate report after PO approval", async () => {
        const response = await client.request.put(`api/v1/stores/grn/update/${grnId}`)
            .send({ GRNStatus: "Report Generated" });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

});
describe("12. Rejected  of GRN", () => {
    it("12/1 should reject PO", async () => {
        let grnIds = "65b8c040c45910a5ad0a6153"
        const response = await client.request.put(`api/v1/stores/grn/update/${grnIds}`)
            .send({ GRNStatus: "Cancelled" });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

})

describe("13. Purchase GRN Get All", () => {
    it("13/1 should return data with status 200", async () => {
        const queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1,
            fromDate: "2024-01-01",
            toDate: "2024-12- 25"
        };
        const response = await client.request
            .get("api/v1/stores/grn/getAllReports")
            .query(queryParams);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
        GRNNumber = result.rows[0]._id

    });
});

describe("14. store MRN GetAll Master Data", () => {
    it("should return data with status 200", async () => {
        const response = await client.request.get("api/v1/quality/mrn/getAllMasterData");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
});

describe("15. store MRN Create", () => {
    it("15/1 should create MRN with valid data", async () => {
        const mrncreateObj = {
            ...mrnCreate,
            GRNNumber: GRNNumber,
        }
        let response = await client.request.post("api/v1/quality/mrn/create")
            .send(mrncreateObj);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
    it("15/2 It should give error of handle validation errors for GRN creation", async () => {
        let response = await client.request.post("api/v1/quality/mrn/create")
            .send(mrnInvalid);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
});
describe("15. Purchase MRN Get All", () => {
    it("15/1 should return data with status 200", async () => {
        const queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1,
        };
        const response = await client.request
            .get("api/v1/quality/mrn/getAll")
            .query(queryParams);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
        MRNId = result.rows[0]._id
    });
    it("15/2 should handel error of api request different", async () => {
        let queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1,
        };
        const response = await client.request
            .post("api/v1/quality/mrn/getAll")
            .query(queryParams)
        expect(response.status).toBe(404);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Page not found");
    });
});


describe("16. Purchase GRN GetById", () => {
    it("16/1 should return data with status 200 using the stored ID", async () => {
        expect(MRNId).toBeDefined();
        const response = await client.request.get(`api/v1/quality/mrn/getById/${MRNId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

    it("16/2 should handle error when using an invalid ID", async () => {
        let invalidId = "invalid_id";
        const response = await client.request.get(`api/v1/quality/mrn/getById/${invalidId}`);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
});

describe("17. Purchase MRN Update", () => {
    it("17/1 should update MRN with valid data", async () => {
        expect(MRNId).toBeDefined();
        let response = await client.request.put(`api/v1/quality/mrn/update/${MRNId}`)
            .send(mrnREJECTUpdate);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        let result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
    it("17/2 should update MRN with valid data", async () => {
        expect(MRNId).toBeDefined();
        let response = await client.request.put(`api/v1/quality/mrn/update/${MRNId}`)
            .send(mrnPartialRelease);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        let result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
    it("17/3 should update MRN with valid data", async () => {
        expect(MRNId).toBeDefined();
        let response = await client.request.put(`api/v1/quality/mrn/update/${MRNId}`)
            .send(mrnRelease);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        let result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });

    it("17/4 should update MRNStatus to Approved", async () => {
        const response = await client.request.put(`api/v1/quality/mrn/update/${MRNId}`)
            .send({ MRNStatus: "Report Generated" });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
});

describe("19. MRN GetAllReport", () => {
    it("19/1 should show all Reports", async () => {
        const queryParams = {
            search: null,
            excel: 'false',
            page: 1,
            pageSize: 10,
            column: 'createdAt',
            direction: -1,
            fromDate: "2024-01-01",
            toDate: "2024-12-25"
        };
        const response = await client.request.get(`api/v1/quality/mrn/getAllSupplierWiseReports`)
            .query(queryParams);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
        MRNNumber = result.rows[0]._id
    })
})

describe("15. store GIN Create", () => {
    it("15/1 should create GIN with valid data", async () => {
        const GINcreateObj = {
            ...GINCreate,
            MRNNumber: MRNNumber,
        }
        let response = await client.request.post("api/v1/stores/gin/create")
            .send(GINcreateObj);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        const result = response.body.result;
        expect(result).toBeInstanceOf(Object);
    });
    it("15/2 It should give error of handle validation errors for GRN creation", async () => {
        let response = await client.request.post("api/v1/stores/gin/create")
            .send(mrnInvalid);
        expect(response.status).toBe(503);
        let body = response.body;
        expect(body).toHaveProperty("error");
        let error = body.error;
        expect(typeof error).toBe("string");
        expect(error).toBe("Oops! something went wrong");
    });
});
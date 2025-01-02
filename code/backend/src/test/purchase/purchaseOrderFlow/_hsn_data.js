exports.HSNObj = {
    hsnCode: "12345",
    goodsDescription: "ok",
    gstRate: 6,
    igstRate: 6,
    cgstRate: 6,
    ugstRate: 6,
    sgstRate: 9,
    isActive: "Y",
    revision: [
        {
            revisionNo: "9",
            revisionDate: "2023-02-01",
        }
    ]
}

exports.invalidHSNObj = {
    hsnCode: "",
    goodsDescription: "",
    gstRate: "",
    igstRate: "",
    cgstRate: "",
    ugstRate: "",
    sgstRate: "",
    isActive: "Y",
    revision: [
        {
            revisionNo: "9",
            revisionDate: "2023-02-01",
        }
    ]
}

exports.HSNUpdateObj = {
    hsnCode: "12345",
    goodsDescription: "ok",
    gstRate: 6,
    igstRate: 9,
    cgstRate: 7,
    ugstRate: 3,
    sgstRate: 1,
    isActive: "Y",
    revision: [
        {
            revisionNo: "9",
            revisionDate: "2023-02-01",
        }
    ]
}




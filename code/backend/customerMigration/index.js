const fs = require("fs");
// let customer = [];

// let newCustomer = customer.map(x => {
//     const {line1, line2, line3, country, state, city, district, pinCode, contactPersonName, ...rest} = x;
//     let address = {
//         line1,
//         line2,
//         line3,
//         country,
//         state,
//         city,
//         district,
//         pinCode,
//         contactPersonName,
//     };
//     rest.customerBillingAddress = [address];
//     rest.customerShippingAddress = [address];
//     return rest;
// });
let outPutArr = [
    {label: "NUMBERS", value: "NOS", status: "Inactive"},
    {label: "PIECES", value: "PCS", status: "Inactive"},
    {label: "UNITS", value: "UNT", status: "Inactive"},
    {label: "SETS", value: "SET", status: "Inactive"},
    {label: "KILOGRAMS", value: "KG", status: "Inactive"},
    {label: "LITRES", value: "LTR", status: "Inactive"},
    {label: "ROLLS", value: "ROL", status: "Inactive"},
    {label: "SHEETS", value: "SHT", status: "Inactive"},
    {label: "SQUARE METERS", value: "SQM", status: "Inactive"},
    {label: "SQUARE FEET", value: "SQF", status: "Inactive"},
    {label: "DRUMS", value: "DRM", status: "Inactive"},
    {label: "CANS", value: "CAN", status: "Inactive"},
    {label: "BAGS", value: "BAG", status: "Inactive"},
    {label: "BOTTLES", value: "BTL", status: "Inactive"},
    {label: "CARTONS", value: "CTN", status: "Inactive"},
    {label: "BOX", value: "BOX", status: "Inactive"},
    {label: "GRAMMES", value: "GMS", status: "Inactive"},
    {label: "METERS", value: "MTR", status: "Inactive"},
    {label: "TONNES", value: "TON", status: "Inactive"},

    {label: "BALE", value: "BAL", status: "Inactive"},
    {label: "BUNDLES", value: "BDL", status: "Inactive"},
    {label: "BUCKLES", value: "BKL", status: "Inactive"},
    {label: "BILLION OF UNITS", value: "BOU", status: "Inactive"},
    {label: "BUNCHES", value: "BUN", status: "Inactive"},
    {label: "CUBIC METERS", value: "CBM", status: "Inactive"},
    {label: "CUBIC CENTIMETERS", value: "CCM", status: "Inactive"},
    {label: "CENTIMETERS", value: "CMS", status: "Inactive"},
    {label: "Carat", value: "CRT", status: "Inactive"},
    {label: "DOZENS", value: "DOZ", status: "Inactive"},
    {label: "GREAT GROSS", value: "GGK", status: "Inactive"},
    {label: "GROSS", value: "GRS", status: "Inactive"},
    {label: "GROSS YARDS", value: "GYD", status: "Inactive"},
    {label: "KILOLITRE", value: "KLR", status: "Inactive"},
    {label: "KILOMETRE", value: "KME", status: "Inactive"},
    {label: "MILLI LITRES", value: "MLS", status: "Inactive"},
    {label: "MILILITRE", value: "MLT", status: "Inactive"},
    {label: "METRIC TON", value: "MTS", status: "Inactive"},
    {label: "OTHERS", value: "OTH", status: "Inactive"},
    {label: "PACKS", value: "PAC", status: "Inactive"},
    {label: "PAIRS", value: "PRS", status: "Inactive"},
    {label: "QUINTAL", value: "QTL", status: "Inactive"},
    {label: "SQUARE YARDS", value: "SQY", status: "Inactive"},
    {label: "TABLETS", value: "TBS", status: "Inactive"},
    {label: "TEN GROSS", value: "TGM", status: "Inactive"},
    {label: "THOUSANDS", value: "THD", status: "Inactive"},
    {label: "TUBES", value: "TUB", status: "Inactive"},
    {label: "US GALLONS", value: "UGS", status: "Inactive"},
    {label: "YARDS", value: "YDS", status: "Inactive"}
];

outPutArr = outPutArr.map((x, i) => {
    return {
        order: i + 1,
        description: x.label,
        label: x.value,
        value: x.value,
        status: x.status
    };
});
fs.writeFile("Output.json", JSON.stringify(outPutArr), err => {
    // In case of a error throw err.
    if (err) throw err;
});

exports.getAllQuotationSKUtAttributes = () => {
    return {
        quotationNo: 1,
        revNo: {$concat: ["Rev", " ", {$toString: "$revNo"}]},
        quotationDate: {$dateToString: {format: "%d-%m-%Y", date: "$quotationDate"}},
        customerCategory: 1,
        customerName: 1,
        currency: 1,
        status: 1
    };
};

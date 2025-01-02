exports.getAllCustomerOpenPOAttributes = () => {
    return {
        customerName: 1,
        customerPONo: 1,
        customerPODate: {$dateToString: {format: "%d-%m-%Y", date: "$customerPODate"}},
        customerPORevNo: 1,
        customerPORevDate: {$dateToString: {format: "%d-%m-%Y", date: "$customerPORevDate"}},
        itemCount: {$size: "$SKUDetails"},
        status: 1
    };
};

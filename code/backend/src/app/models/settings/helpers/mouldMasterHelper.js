exports.getAllMouldMasterAttributes = () => {
    return {
        mouldNo: 1,
        mouldType: 1,
        mouldBatchDate: {$dateToString: {format: "%d-%m-%Y", date: "$mouldBatchDate"}},
        mouldName: 1,
        mouldTBDDimension: 1,
        noOfCavities: 1,
        // TBDPerWidth: 1,
        // TBDPerLength: 1,
        mouldSupplier: 1,
        supplier: "$supplier.supplierName",
        partNo: 1,
        status: 1
    };
};

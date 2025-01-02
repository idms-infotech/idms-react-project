exports.getAllGoodsTransferResponseAttributes = () => {
    return {
        GTNo: 1,
        GTRequestDate: {$dateToString: {format: "%d-%m-%Y", date: "$GTRequestDate"}},
        GTDate: {$dateToString: {format: "%d-%m-%Y", date: "$GTDate"}},
        location: 1,
        fromDepartment: 1,
        toDepartment: 1,
        fromDepartmentName: 1,
        toDepartmentName: 1,
        status: 1,
        GTRequestNo: 1
    };
};

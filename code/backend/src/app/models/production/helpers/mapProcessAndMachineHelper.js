exports.getAllMapProcessAndMachineAttributes = () => {
    return {
        mapCode: "$_id.mapCode",
        processName: "$_id.processName",
        noOfMachines: {$toString: "$noOfMachines"},
        _id: "$_id._id"
    };
};

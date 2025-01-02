const {CONSTANTS} = require("../../../../config/config");

exports.getAllTravelRequestTransactions = () => {
    return {
        travelCode: 1,
        requestDate: {$dateToString: {format: "%d-%m-%Y", date: "$requestDate"}},
        travelForm: 1,
        travelDestination: 1,
        travelStartDate: {$dateToString: {format: "%d-%m-%Y", date: "$travelStartDate"}},
        travelEndDate: {$dateToString: {format: "%d-%m-%Y", date: "$travelEndDate"}},
        totalDays: {
            $dateDiff: {
                startDate: "$travelStartDate",
                endDate: "$travelEndDate",
                unit: "day"
            }
        },
        purposeOfTravel: 1,
        estimatedBudget: 1,
        costAllocation: 1,
        paymentMethod: 1,
        raisedBy: 1,
        supportingDocumentsFile: 1,
        status: 1,
        createdAt: 1
    };
};
exports.getAllTravelRequestTransactionsExcelData = () => {
    return {
        travelCode: 1,
        requestDate: {$dateToString: {format: "%d-%m-%Y", date: "$requestDate"}},
        travelForm: 1,
        travelDestination: 1,
        travelStartDate: {$dateToString: {format: "%d-%m-%Y", date: "$travelStartDate"}},
        travelEndDate: {$dateToString: {format: "%d-%m-%Y", date: "$travelEndDate"}},
        totalDays: {
            $dateDiff: {
                startDate: "$travelStartDate",
                endDate: "$travelEndDate",
                unit: "day"
            }
        },
        purposeOfTravel: 1,
        estimatedBudget: 1,
        costAllocation: 1,
        paymentMethod: 1,
        raisedBy: 1,
        supportingDocumentsFile: 1,
        status: 1,
        supportingDocumentsFileUrl: {
            $cond: [{$not: ["$supportingDocumentsFile"]}, "No", "Yes"]
        }
        // supportingDocumentsFileUrl: {$concat: [CONSTANTS.domainUrl, "project/", "$supportingDocumentsFile"]}
    };
};

exports.getAllTravelRequestReportsTransactions = () => {
    return {
        travelCode: 1,
        requestDate: {$dateToString: {format: "%d-%m-%Y", date: "$requestDate"}},
        travelForm: 1,
        travelDestination: 1,
        travelStartDate: {$dateToString: {format: "%d-%m-%Y", date: "$travelStartDate"}},
        travelEndDate: {$dateToString: {format: "%d-%m-%Y", date: "$travelEndDate"}},
        totalDays: {
            $dateDiff: {
                startDate: "$travelStartDate",
                endDate: "$travelEndDate",
                unit: "day"
            }
        },
        purposeOfTravel: 1,
        estimatedBudget: 1,
        costAllocation: 1,
        paymentMethod: 1,
        raisedBy: 1,
        supportingDocumentsFile: 1,
        status: 1,
        createdAt: 1
    };
};

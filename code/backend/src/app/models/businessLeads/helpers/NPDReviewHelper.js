exports.getAllNPDReviewAttributes = extra => {
    return {
        NPDNo: 1,
        NPDDate: {$dateToString: {format: "%d-%m-%Y", date: "$NPDDate"}},
        name: 1,
        productCategory: 1,
        projectName: 1,
        createdAt: 1,
        isReportGenerated: 1,
        expectedDeliveryDate: {$dateToString: {format: "%d-%m-%Y", date: "$expectedDeliveryDate"}},
        customerInputs: {$arrayElemAt: ["$customerInputs", -1]},
        technicalReview: {$arrayElemAt: ["$technicalReview", -1]},
        economicReview: {$arrayElemAt: ["$economicReview", -1]},
        legalReview: {$arrayElemAt: ["$legalReview", -1]},
        operationalReview: {$arrayElemAt: ["$operationalReview", -1]},
        schedulingReview: {$arrayElemAt: ["$schedulingReview", -1]},
        status: {$cond: [{$eq: ["$status", "Additional Review Required"]}, "Need Addl. Review", "$status"]},
        ...extra
    };
};
exports.getAllNPDFinalStatusReportAttributes = () => {
    return {
        NPDNo: 1,
        NPDDate: {$dateToString: {format: "%d-%m-%Y", date: "$NPDDate"}},
        name: 1,
        productCategory: 1,
        projectName: 1,
        createdAt: 1,
        expectedDeliveryDate: {$dateToString: {format: "%d-%m-%Y", date: "$expectedDeliveryDate"}},
        status: 1
    };
};
exports.getAllNPDStatusReportAttributes = () => {
    return {
        NPDNo: 1,
        NPDDate: {$dateToString: {format: "%d-%m-%Y", date: "$NPDDate"}},
        productCategory: 1,
        projectName: 1,
        name: 1,
        createdAt: 1,
        expectedDeliveryDate: {$dateToString: {format: "%d-%m-%Y", date: "$expectedDeliveryDate"}},
        status: 1,
        customerInputs: 1,
        technicalReview: 1,
        economicReview: 1,
        legalReview: 1,
        operationalReview: 1,
        schedulingReview: 1,
        isReportGenerated: 1,
        variants: 1
    };
};

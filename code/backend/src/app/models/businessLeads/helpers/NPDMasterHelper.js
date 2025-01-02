exports.getAllNPDMasterAttributes = extra => {
    return {
        dSKUNo: 1,
        SKUName: 1,
        SKUStage: 1,
        SKUDescription: 1,
        productCategory: 1,
        hsn: 1,
        primaryUnit: 1,
        artWorkNo: 1,
        customerName: "$customerInfo.customerName",
        unitOfMeasurement: 1,
        ...extra
    };
};
exports.getAllPendingDSKUConversionReportAttributes = () => {
    return {
        dSKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        NPDDate: {$dateToString: {format: "%d-%m-%Y", date: "$NPDReview.NPDDate"}},
        NPDUpdatedAt: {$dateToString: {format: "%d-%m-%Y", date: "$NPDReview.updatedAt"}},
        customerName: "$customerInfo.customerName",
        daysPending: {
            $abs: {
                $dateDiff: {
                    startDate: "$NPDReview.updatedAt",
                    endDate: new Date(),
                    unit: "day"
                }
            }
        }
    };
};
exports.getAllDSKUToSKUConversionReportAttributes = () => {
    return {
        SKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        SKUConversionDate: {$dateToString: {format: "%d-%m-%Y", date: "$updatedAt"}},
        NPDApprovedDate: {$dateToString: {format: "%d-%m-%Y", date: "$NPDReview.updatedAt"}},
        customerName: "$customerInfo.customerName",
        daysForConversion: {
            $abs: {
                $dateDiff: {
                    startDate: "$NPDReview.updatedAt",
                    endDate: "$updatedAt",
                    unit: "day"
                }
            }
        }
    };
};

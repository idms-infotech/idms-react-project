exports.getAllStockIssueToProductionAttributes = () => {
    return {
        issueDate: {$dateToString: {format: "%d-%m-%Y", date: "$issueDate"}},
        MRNNumber: "$stockIssueDetails.MRNNumber",
        itemCode: "$stockIssueDetails.itemCode",
        itemName: "$stockIssueDetails.itemName",
        stage: "$stockIssueDetails.stage",
        width: "$stockIssueDetails.width",
        length: "$stockIssueDetails.length",
        qty: {
            $cond: [
                {$eq: ["$stockIssueDetails.stage", "SFG-Roll"]},
                "$stockIssueDetails.qty",
                "$stockIssueDetails.sheetQty"
            ]
        },
        UOM: "$stockIssueDetails.UOM",
        issueQty: "$stockIssueDetails.issueQty",
        sheetQty: "$stockIssueDetails.sheetQty",
        createdAt: 1,
        status: 1
    };
};

exports.getAllStockIssueToProductionExcelAttributes = () => {
    return {
        issueDate: {$dateToString: {format: "%d-%m-%Y", date: "$issueDate"}},
        stage: 1,
        department: 1,
        jobCardNo: 1,
        MRNNumber: "$stockIssueDetails.MRNNumber",
        itemCode: "$stockIssueDetails.itemCode",
        itemName: "$stockIssueDetails.itemName",
        stage: "$stockIssueDetails.stage",
        width: "$stockIssueDetails.width",
        length: "$stockIssueDetails.length",
        qty: {
            $cond: [
                {$eq: ["$stockIssueDetails.stage", "SFG-Roll"]},
                "$stockIssueDetails.qty",
                "$stockIssueDetails.sheetQty"
            ]
        },
        UOM: "$stockIssueDetails.UOM",
        issueQty: "$stockIssueDetails.issueQty",
        sheetQty: "$stockIssueDetails.sheetQty",
        createdAt: 1,
        status: 1,
        WxL: {
            $cond: [{$eq: ["$stockIssueDetails.stage", "SFG-Roll"]}, "mm x mtr", "mm x mm"]
        }
    };
};

exports.getAllStockIssueToProductionReportsAttributes = () => {
    return {
        issueDate: {$dateToString: {format: "%d-%m-%Y", date: "$issueDate"}},
        MRNNumber: "$stockIssueDetails.MRNNumber",
        itemCode: "$stockIssueDetails.itemCode",
        itemName: "$stockIssueDetails.itemName",
        stage: "$stockIssueDetails.stage",
        WXL: {
            $cond: [{$eq: ["$stockIssueDetails.stage", "SFG-Roll"]}, "mm x  mtr", "mm x mm"]
        },
        width: "$stockIssueDetails.width",
        length: "$stockIssueDetails.length",
        qty: {
            $cond: [
                {$eq: ["$stockIssueDetails.stage", "SFG-Roll"]},
                "$stockIssueDetails.qty",
                "$stockIssueDetails.sheetQty"
            ]
        },
        UOM: "$stockIssueDetails.UOM",
        issueQty: "$stockIssueDetails.issueQty",
        status: 1,
        createdAt: 1
    };
};

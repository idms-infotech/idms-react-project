exports.getAllGoodsIssuePPICToProductionAttributes = () => {
    return {
        goodsIssueNo: 1,
        goodsIssueDate: {$dateToString: {format: "%d-%m-%Y", date: "$goodsIssueDate"}},
        goodsIssueTo: 1,
        jobCardNo: 1,
        updatedAt: {$dateToString: {format: "%d-%m-%Y", date: "$updatedAt"}},
        status: 1
    };
};

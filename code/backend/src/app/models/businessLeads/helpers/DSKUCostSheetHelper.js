exports.getAllDSKUCostSheetAttributes = () => {
    return {
        directMaterial: "$DSKUCostDetails.Direct Material",
        directLabour: "$DSKUCostDetails.Direct Labour",
        directExpenses: "$DSKUCostDetails.Direct Expenses",
        costOfGoodsSold: "$DSKUCostDetails.Cost of Goods Sold(COGS)",
        operatingExpenses: "$DSKUCostDetails.Operating Expenses (OPEX)",
        totalCostOfOperation: "$DSKUCostDetails.Total Cost of Operation (COGS + OPEX)",
        profit: "$DSKUCostDetails.Profit",
        sellingPrice: "$DSKUCostDetails.Selling Price",
        DSKUNo: 1,
        DSKUName: 1,
        DSKUDescription: 1,
        UOM: 1,
        sellingPrice: 1
    };
};
exports.getAllDSKUCostSheetReportsAttributes = () => {
    return {
        directMaterial: "$DSKUCostDetails.Direct Material.costPerUnit",
        directLabour: "$DSKUCostDetails.Direct Labour.costPerUnit",
        directExpenses: "$DSKUCostDetails.Direct Expenses.costPerUnit",
        costOfGoodsSold: "$DSKUCostDetails.Cost of Goods Sold(COGS).costPerUnit",
        operatingExpenses: "$DSKUCostDetails.Operating Expenses (OPEX).costPerUnit",
        totalCostOfOperation: "$DSKUCostDetails.Total Cost of Operation (COGS + OPEX).costPerUnit",
        profit: "$DSKUCostDetails.Profit.costPerUnit",
        profitPercent: "$DSKUCostDetails.Profit.percentage",
        sellingPrice: "$DSKUCostDetails.Selling Price.costPerUnit",
        DSKUNo: 1,
        DSKUName: 1,
        DSKUDescription: 1,
        UOM: 1,
        sellingPrice: 1,
        productCategory: 1
    };
};

exports.getAllSKUCostSheetAttributes = () => {
    return {
        directMaterial: "$SKUCostDetails.Direct Material",
        directLabour: "$SKUCostDetails.Direct Labour",
        directExpenses: "$SKUCostDetails.Direct Expenses",
        costOfGoodsSold: "$SKUCostDetails.Cost of Goods Sold(COGS)",
        operatingExpenses: "$SKUCostDetails.Operating Expenses (OPEX)",
        totalCostOfOperation: "$SKUCostDetails.Total Cost of Operation (COGS + OPEX)",
        profit: "$SKUCostDetails.Profit",
        sellingPrice: "$SKUCostDetails.Selling Price",
        SKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        UOM: 1,
        sellingPrice: 1
    };
};
exports.getAllSKUCostSheetReportsAttributes = () => {
    return {
        directMaterial: "$SKUCostDetails.Direct Material.costPerUnit",
        directLabour: "$SKUCostDetails.Direct Labour.costPerUnit",
        directExpenses: "$SKUCostDetails.Direct Expenses.costPerUnit",
        costOfGoodsSold: "$SKUCostDetails.Cost of Goods Sold(COGS).costPerUnit",
        operatingExpenses: "$SKUCostDetails.Operating Expenses (OPEX).costPerUnit",
        totalCostOfOperation: "$SKUCostDetails.Total Cost of Operation (COGS + OPEX).costPerUnit",
        profit: "$SKUCostDetails.Profit.costPerUnit",
        profitPercent: "$SKUCostDetails.Profit.percentage",
        sellingPrice: "$SKUCostDetails.Selling Price.costPerUnit",
        SKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        UOM: 1,
        sellingPrice: 1,
        productCategory: 1
    };
};

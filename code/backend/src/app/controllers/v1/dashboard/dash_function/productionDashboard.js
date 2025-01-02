const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");
const {
    getAllMonthlyGTReqTrends,
    getAllGTReqCounts,
    perDayTotalGTReq
} = require("../../planning/goodsTransferRequest/GTReqDashboard");
const {getTotalNoOfSKUProducedPerDay} = require("../../production/SKUPartProduction/SKUPartProduction");
const {getTotalNoOfChildPartProducedPerDay} = require("../../production/childPartProduction/childPartProduction");

const {getTotalNoOfGrandChildPartProducedPerDay} = require("../../production/grandPartProduction/grandPartProduction");
const {
    getAllFGINEntriesCounts,
    getAllMonthlyFGINTrends
} = require("../../stores/finishedGoodsInwardEntry/finishedGoodsInwardEntry");
const {perDayTotalGTResponseAgainstReq} = require("../../stores/goodsTransferResponse/GTResDashboard");
exports.production = async company => {
    try {
        const [
            GTRAllCounts,
            FGINEntriesCount,
            monthlyGTRTrend,
            monthlyFGINTrends,
            totalSKUProducedPerDay,
            totalChildPartProducedPerDay,
            totalGrandChildPartProducedPerDay,
            perDayGTResAgainstReq,
            perDayTotalGTReqCount
        ] = await Promise.all([
            getAllGTReqCounts(company),
            getAllFGINEntriesCounts(company),
            getAllMonthlyGTReqTrends(company),
            getAllMonthlyFGINTrends(company),
            getTotalNoOfSKUProducedPerDay(company),
            getTotalNoOfChildPartProducedPerDay(company),
            getTotalNoOfGrandChildPartProducedPerDay(company),
            perDayTotalGTResponseAgainstReq(company),
            perDayTotalGTReq(company)
        ]);
        let output = {
            barChartDataGTReq: {
                labels: monthlyGTRTrend?.months || [],
                datasets: [{data: monthlyGTRTrend?.orders || []}]
            },
            barChartDataFGIEntry: {
                labels: monthlyFGINTrends?.months || [],
                datasets: [{data: monthlyFGINTrends?.orders || []}]
            },
            totalRequisitions: GTRAllCounts?.allCounts || 0,
            approvedRequisitions: GTRAllCounts?.approvedCounts || 0,
            pendingRequisitions: GTRAllCounts?.openedCounts || 0,
            totalFGInwardEntries: FGINEntriesCount || 0,
            totalGoodsRequisitionCreatedPerDay: perDayTotalGTReqCount || 0,
            totalGoodsIssueAgainstGRPerDay: perDayGTResAgainstReq || 0,
            totalSKUProducedPerDay: totalSKUProducedPerDay || 0,
            totalChildPartProducedPerDay: totalChildPartProducedPerDay || 0,
            totalGrandChildPartProducedPerDay: totalGrandChildPartProducedPerDay || 0,
            unit: null
        };
        memoryCacheHandler.put("production", {});
        memoryCacheHandler.put("production", output);
        return output;
    } catch (e) {
        console.error(e);
    }
};

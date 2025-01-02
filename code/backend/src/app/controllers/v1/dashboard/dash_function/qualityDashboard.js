const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");
const {getAllMRNCounts, getAllMonthlyMRNTrends, getTotalNoOfMRNPerDay} = require("../../quality/Mrn/Mrn");
const {getAllGRNAwaitingForMRNCounts} = require("../../stores/goodsReceiptNote/goodsReceiptNote");

exports.quality = async company => {
    try {
        const [MRNCounts, GRNAwaitingForMRNCounts, monthlyMRNTrends, totalMRNPerDay] = await Promise.all([
            getAllMRNCounts(company),
            getAllGRNAwaitingForMRNCounts(company),
            getAllMonthlyMRNTrends(company),
            getTotalNoOfMRNPerDay(company)
        ]);
        let output = {
            barMonthlyMRNTrends: {
                labels: monthlyMRNTrends?.monthlyMRNTrend?.months || [],
                datasets: [{data: monthlyMRNTrends?.monthlyMRNTrend?.orders || []}]
            },
            barMonthlyMRNvsGRNTrends: {
                labels: monthlyMRNTrends?.generatedGRN?.months || [],
                datasets: [
                    {
                        data: monthlyMRNTrends?.monthlyMRNTrend?.orders || [],
                        label: "MRN"
                    },
                    {
                        data: monthlyMRNTrends?.generatedGRN?.orders || [],
                        label: "GRN",
                        borderColor: "#009696",
                        backgroundColor: "#009696"
                    }
                ]
            },
            allMRNCount: MRNCounts?.allMRNCount || 0,
            MRNRejectedCount: MRNCounts?.MRNRejectedCount || 0,
            MRNPartiallyReleaseCount: MRNCounts?.MRNPartiallyReleaseCount || 0,
            GRNAwaitingForMRNCounts: GRNAwaitingForMRNCounts || 0,
            MRNPendingForGINCount: MRNCounts?.MRNPendingForGINCount || 0,
            MRNReleasedCount: MRNCounts?.MRNReleasedCount || 0,
            MRNCreatedPerDay: totalMRNPerDay?.MRNCreated || 0,
            MRNReleasedPerDay: totalMRNPerDay?.MRNReleased || 0,
            MRNRejectedPerDay: totalMRNPerDay?.MRNRejected || 0,
            unit: null
        };
        memoryCacheHandler.put("quality", {});
        memoryCacheHandler.put("quality", output);
        return output;
    } catch (e) {
        console.error(e);
    }
};

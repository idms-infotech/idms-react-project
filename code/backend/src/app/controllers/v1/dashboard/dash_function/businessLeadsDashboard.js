const {getMonthlyProspectMaster, getAllCountsOfProspect} = require("../../businessLeads/prospect/prospect");
const {
    getMonthlyNPDMaster,
    getStatusWiseNPDCount,
    getAllCountsOfNPD
} = require("../../businessLeads/NPDRequest/NPDRequest");
const {getTotalNoOfNPDLostPerDay} = require("../../businessLeads/NPDReview/NPDReview");
const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");
exports.businessLeads = async company => {
    try {
        const [
            monthlyProspectData,
            monthlyNPDData,
            statusWiseNPDData,
            countsOfProspect,
            countsOfNPD,
            totalNoOfNPDLostPerDay
        ] = await Promise.all([
            getMonthlyProspectMaster(company),
            getMonthlyNPDMaster(company),
            getStatusWiseNPDCount(company),
            getAllCountsOfProspect(company),
            getAllCountsOfNPD(company),
            getTotalNoOfNPDLostPerDay(company)
        ]);

        let output = {
            barChartDataMonthlyProspectTrend: {
                labels: monthlyProspectData.months,
                datasets: [{data: monthlyProspectData.orders}]
            },
            barChartDataMonthlyNPDTrend: {
                labels: monthlyNPDData.months,
                datasets: [{data: monthlyNPDData.orders}]
            },
            barChartDataStatusWiseNPDCount: {
                labels: statusWiseNPDData.status,
                datasets: [{data: statusWiseNPDData.data}]
            },
            totalNoOfNPDLostPerDay: totalNoOfNPDLostPerDay || 0,
            mtdProspectCount: countsOfProspect?.MTDProspect || 0,
            ytdProspectCount: countsOfProspect?.YTDProspect || 0,
            totalProspectCreatedPerDay: countsOfProspect?.totalProspectPerDay || 0,
            mtdNPDCount: countsOfNPD?.MTDNPD || 0,
            ytdNPDCount: countsOfNPD?.YTDNPD || 0,
            totalNoOfNPDRequestPerDay: countsOfNPD?.totalNoOfNPDRequestPerDay || 0,
            totalNoOfNPDClosedPerDay: countsOfNPD?.totalNoOfNPDClosedPerDay || 0,
            unit: null
        };
        memoryCacheHandler.put("businessLeads", {});
        memoryCacheHandler.put("businessLeads", output);
        return output;
    } catch (e) {
        console.error(e);
    }
};

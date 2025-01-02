const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");
const {
    getAllTicketsCounts,
    getAllYTDTicketsCounts,
    getAllMTDTicketsCounts,
    getTicketTypeGraphCount,
    getSeverityCount
} = require("../../supports/issue/Issue");

exports.support = async company => {
    try {
        const [ticketCounts, ticketYTDCounts, ticketMTDCounts, ticketTypeCounts, severityCounts] = await Promise.all([
            getAllTicketsCounts(company),
            getAllYTDTicketsCounts(company),
            getAllMTDTicketsCounts(company),
            getTicketTypeGraphCount(company),
            getSeverityCount(company)
        ]);
        let output = {
            ticketCounts,
            ticketTypeCounts,
            severityCounts,
            ticketYTDCounts,
            ticketMTDCounts
        };
        memoryCacheHandler.put("support", {});
        memoryCacheHandler.put("support", output);
        return output;
    } catch (e) {
        console.error(e);
    }
};

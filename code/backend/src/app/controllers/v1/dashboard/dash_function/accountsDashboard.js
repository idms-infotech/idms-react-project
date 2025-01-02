const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");
const {getTotalNoOfTravelRequestRaisedPerDay} = require("../../accounts/travelRequest/travelRequest");

exports.accounts = async company => {
    try {
        // let totalNoOfPaymentReceivedPerDay = await
        const [totalNoOfTravelRequestPerDay] = await Promise.all([
            getTotalNoOfTravelRequestRaisedPerDay(company)
            // getTotalNoOfPaymentReceivedPerDay(company)
        ]);
        let output = {
            totalNoOfTravelRequestPerDay
            // totalNoOfPaymentReceivedPerDay
        };
        memoryCacheHandler.put("accounts", {});
        memoryCacheHandler.put("accounts", output);
        return output;
    } catch (e) {
        console.error(e);
    }
};

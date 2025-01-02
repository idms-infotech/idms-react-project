const {getBOMOfSKUCount} = require("../../planning/billOfMaterial/BoMOfSKU/BoMOfSKUs");
// const {getBOMOfGrandChildPartCount} = require("../../planning/billOfMaterial/BoMOfGrandChildItem/BoMOfGrandChildItem");
const {getBOMOfProdItemCount} = require("../../planning/billOfMaterial/BOMOfProdItem/BOMOfProdItem");
const {getAllProdItemCountByCategoryAndSOM} = require("../../planning/prodItemMaster/prodItemMaster");
const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");
const {getGTRPerDayCount} = require("../../planning/goodsTransferRequest/GTReqDashboard");
exports.planning = async company => {
    try {
        const [
            BOMOfSKUCount,
            // BOMOfGrandChildPartCount,
            BOMOfChildPartCount,
            childItemMasterCountByCategoryAndSOM,
            perDayGTRCount
        ] = await Promise.all([
            getBOMOfSKUCount(company),
            // getBOMOfGrandChildPartCount(company),
            getBOMOfProdItemCount(company),
            getAllProdItemCountByCategoryAndSOM(company),
            getGTRPerDayCount(company)
        ]);
        let output = {
            barMonthlyMaintenanceCost: {
                labels: [],
                datasets: [{data: []}]
            },
            barMonthlyWOStatusCount: {
                labels: [],
                datasets: [{data: []}]
            },
            totalNoOfSkuBOM: BOMOfSKUCount || 0,
            totalNoOfChildPartBOM: BOMOfChildPartCount || 0,
            // totalNoOfGrChildPartBOM: BOMOfGrandChildPartCount || 0,
            totalGRPerDay: perDayGTRCount || 0,
            totalNoOfInHouseChildPart: childItemMasterCountByCategoryAndSOM?.inHouseL20Counts || 0,
            totalNoOfInHouseGrChildPart: childItemMasterCountByCategoryAndSOM?.inHouseL30Counts || 0,
            totalNoOfOutsourcedChildPart: childItemMasterCountByCategoryAndSOM?.outSourcedL20Counts || 0,
            totalNoOfOutsourcedGrChildPart: childItemMasterCountByCategoryAndSOM?.outSourcedL30Counts || 0,
            unit: null
        };
        memoryCacheHandler.put("planning", {});
        memoryCacheHandler.put("planning", output);

        return output;
    } catch (e) {
        console.error(e);
    }
};

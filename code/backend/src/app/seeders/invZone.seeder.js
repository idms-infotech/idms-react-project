const invZoneJson = require("../mocks/invZone.json");
const InvZoneConfigRepository = require("../models/planning/repository/invZoneConfigRepository");

exports.invZoneInsert = async companyId => {
    try {
        for await (const zone of invZoneJson) {
            await InvZoneConfigRepository.deleteDoc({invZoneName: zone.invZoneName, _id: {$ne: zone._id}});
            const existing = await InvZoneConfigRepository.findOneDoc({
                invZoneName: zone.invZoneName
            });
            if (!existing) {
                zone.company = companyId;
                await InvZoneConfigRepository.createDoc(zone);
                console.info("Inv Zone Created successfully!!");
            }
        }
    } catch (error) {
        throw new Error(error);
    }
};

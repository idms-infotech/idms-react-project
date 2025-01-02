const labelJson = require("../utilities/labelMaster");
const LabelMasterRepository = require("../models/settings/repository/labelMasterRepository");
const {updateCacheGlobalLabel} = require("../controllers/v1/settings/label-master/label-master");

exports.labelMasterInsert = async companyId => {
    try {
        for await (const label of labelJson) {
            const existingLabel = await LabelMasterRepository.findOneDoc({
                menuItemId: label.menuItemId,
                labelName: label.labelName
            });
            if (!existingLabel) {
                label.company = companyId;
                await LabelMasterRepository.createDoc(label);
            } else {
                delete label.displayLabelName;
                await LabelMasterRepository.updateDoc(existingLabel, label);
            }
        }
        await updateCacheGlobalLabel(companyId);
        console.info("Label Master updated successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

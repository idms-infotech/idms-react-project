const {
    updatePermissionsOnSubModuleManagementCreate
} = require("../controllers/v1/settings/subModulePermissions/subModulePermissions");
const SubModuleRepository = require("../models/settings/repository/subModuleRepository");
const subModuleJson = require("../utilities/module");
const deleteSubModule = require("../mocks/subModule/deleteModule.json");
exports.subModuleInsert = async function () {
    try {
        for await (const ele of deleteSubModule) {
            await SubModuleRepository.deleteDoc({
                _id: ele._id
            });
        }
        for await (const ele of subModuleJson) {
            const oldItem = await SubModuleRepository.findOneDoc({
                menuItemId: ele.menuItemId,
                type: ele.type,
                title: ele.title
            });
            if (!oldItem) {
                const subModuleCreatedObj = await SubModuleRepository.createDoc(ele);
                await updatePermissionsOnSubModuleManagementCreate(subModuleCreatedObj);
            } else {
                const {order, isDisplay, displayName, disabled, items, roles, featureConfig, ...rest} = ele;
                if (!oldItem?.featureConfig) {
                    oldItem.featureConfig = featureConfig;
                } else {
                    if (featureConfig?.length) {
                        for (const feature of featureConfig) {
                            if (oldItem.featureConfig.some(x => x.featureCode == feature.featureCode)) {
                                continue;
                            }
                            oldItem.featureConfig.push(feature);
                        }
                    }
                }
                if (items?.length) {
                    rest.items = items.map(x => {
                        const obj = oldItem.items.find(y => y && y.title == x.title);
                        if (obj) {
                            x.order = obj.order;
                            x.isDisplay = obj.isDisplay;
                            x.displayName = obj.displayName;
                            x.disabled = obj.disabled;
                        }
                        return x;
                    });
                } else {
                    rest.items = [];
                }
                // if (oldItem.module == "Settings" && oldItem.title == "Standard Configuration") {
                //     console.log("oldItem", oldItem.items, "rest", rest.items);
                // }

                await SubModuleRepository.updateDoc(oldItem, rest);
            }
        }
        console.info("SubModule updated successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

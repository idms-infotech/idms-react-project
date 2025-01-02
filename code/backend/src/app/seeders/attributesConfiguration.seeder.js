const attributesConfigurationJson = require("../mocks/attributesConfiguration.json");
const AttributeConfigurationRepository = require("../models/settings/repository/attributeConfigurationRepository");

exports.attributesConfigurationInsert = async function () {
    try {
        for await (const config of attributesConfigurationJson) {
            const existingConfig = await AttributeConfigurationRepository.findOneDoc({type: config.type}, {});
            if (!existingConfig) {
                await AttributeConfigurationRepository.createDoc(config);
            } else {
                // Omit 'items' property from the update
                const {items, ...rest} = config;
                if (items && items.length && existingConfig.items && existingConfig.items.length) {
                    rest.items = items.map(x => {
                        const obj = existingConfig.items.find(y => y && y.tabName == x.tabName);
                        if (obj) {
                            x.order = obj.order;
                            x.tabName = obj.tabName;
                            x.tabDisplayName = obj.tabDisplayName;
                            x.status = obj.status;
                        }
                        return x;
                    });
                }
                await AttributeConfigurationRepository.updateDoc(existingConfig, rest);
            }
        }
        console.info("Attributes Configuration updated successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

const menuItemJson = require("../mocks/menuItem.json");
const MenuItemRepository = require("../models/settings/repository/menuItemRepository");
const {updateCacheGlobalMenuItems} = require("../controllers/v1/settings/menuItem/menuItem");

exports.menuItemInsert = async function (companyId) {
    try {
        for await (const menuItem of menuItemJson) {
            const itemDetails = await MenuItemRepository.findOneDoc({_id: menuItem._id});
            if (!itemDetails) {
                await MenuItemRepository.createDoc(menuItem);
            } else {
                const {title, isMenuActive, menuOrder, roles, ...updatedData} = menuItem;
                await MenuItemRepository.updateDoc(itemDetails, updatedData);
            }
        }
        const count = await MenuItemRepository.countDoc();
        if (count === 0) {
            await MenuItemRepository.insertManyDoc(menuItemJson);
        }
        await updateCacheGlobalMenuItems(companyId, "main");
        console.info("Menu Item updated successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

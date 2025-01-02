const rolesJson = require("../mocks/roles.json");
const {updateCacheRoles} = require("../controllers/v1/settings/role/role");
const RoleRepository = require("../models/settings/repository/roleRepository");

exports.roleInsert = async function (companyId) {
    try {
        for await (const ele of rolesJson) {
            ele.company = companyId;
            const role = await RoleRepository.findOneDoc({roleName: ele.roleName}, {});
            if (!role) {
                await RoleRepository.createDoc(ele);
            } else {
                const {displayName, redirectTo, ...updatedProps} = ele;
                await RoleRepository.updateDoc(role, updatedProps);
            }
        }
        await updateCacheRoles(companyId, true);
        console.info("Role updated successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

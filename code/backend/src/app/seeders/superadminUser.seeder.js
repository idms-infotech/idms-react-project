const {companyData, superAdminData, usersRoles} = require("../helpers/global.options").OPTIONS;
const rolesJson = require("../mocks/roles.json");
const CompanyRepository = require("../models/settings/repository/companyRepository");
const UserRepository = require("../models/settings/repository/userRepository");
const {hashPassword} = require("../utilities/bcryptHandler");

exports.companyInsert = async function () {
    let company = await CompanyRepository.findOneDoc({}, {_id: 1});
    if (!company) {
        company = await CompanyRepository.createDoc(companyData);
    }
    console.info("Company updated successfully!!");
    return company._id;
};
exports.superAdminUserInsert = async function (companyId) {
    try {
        superAdminData.company = companyId;
        let superAdminRole = rolesJson.find(role => role.roleName == usersRoles.SUPER_ADMIN);

        let user = await UserRepository.findOneDoc({email: superAdminData.email});
        let role = [superAdminRole._id];
        let password = await hashPassword(superAdminData.password);
        if (!user) {
            superAdminData.role = role;
            superAdminData.password = password;
            await UserRepository.createDoc(superAdminData);
        }
        await UserRepository.findAndUpdateDoc(
            {email: superAdminData.email},
            {$addToSet: {role: role}, $set: {password}}
        );
        console.info("Super Admin updated successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

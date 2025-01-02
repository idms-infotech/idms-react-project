const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/settings/roleModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {default: mongoose} = require("mongoose");
const RoleRepository = require("../../../../models/settings/repository/roleRepository");
const {getAllRoleAttributes} = require("../../../../models/settings/helpers/roleHelper");
const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");
const {getAndSetAutoIncrementNo} = require("../autoIncrement/autoIncrement");
const {ROLE} = require("../../../../mocks/schemasConstant/settingsConstant");
const {SUPER_ADMIN_ID} = require("../../../../mocks/constantData");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $addFields: {
                    createdAtS: {$dateToString: {format: "%d-%m-%Y", date: "$createdAt"}}
                }
            }
        ];
        let project = getAllRoleAttributes();
        let rows = await RoleRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.create = asyncHandler(async (req, res) => {
    try {
        let existing = await RoleRepository.findOneDoc(
            {
                roleName: req.body.roleName
            },
            {_id: 1}
        );
        if (existing) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("Role");
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = RoleRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Role")
            });
            await this.updateCacheRoles(req.user.company, true);
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.update = asyncHandler(async (req, res) => {
    try {
        // let itemDetails = await Model.findById(req.params.id);
        let itemDetails = await RoleRepository.getDocById(req.params.id);
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await RoleRepository.updateDoc(itemDetails, req.body);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Role has been")
        });
        await this.updateCacheRoles(req.user.company, true);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await RoleRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Role")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Role");
            res.preconditionFailed(errors);
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await RoleRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Role");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(ROLE.AUTO_INCREMENT_DATA(), req.user.company);
        res.success({autoIncrementNo});
    } catch (error) {
        console.error(error);
        res.status(400);
        throw new Error("Invalid Model data");
    }
});
exports.getAllRoles = async (company, isSuperAdmin = false) => {
    let rows = [];
    const cachedData = memoryCacheHandler.get("roles");
    if (cachedData) {
        rows = cachedData;
    } else {
        rows = await this.updateCacheRoles(company, isSuperAdmin);
    }
    return rows;
};

exports.updateCacheRoles = async (company, isSuperAdmin = false) => {
    try {
        let rows = await Model.find(
            {
                company: company,
                ...(!isSuperAdmin && {_id: {$ne: ObjectId(SUPER_ADMIN_ID)}})
            },
            {roleCode: 1, roleName: 1, displayRoleName: 1, redirectTo: 1, permissions: 1}
        ).sort({createdAt: -1});
        memoryCacheHandler.put("roles", rows);
        return rows;
    } catch (error) {
        console.error(error);
    }
};

exports.getAllRoleCounts = async (company, isSuperAdmin) => {
    try {
        const result = await RoleRepository.filteredRoleList([
            {
                $match: {
                    company: ObjectId(company),
                    ...(!isSuperAdmin && {_id: {$nin: [ObjectId(SUPER_ADMIN_ID)]}})
                }
            },
            {
                $group: {
                    _id: null,
                    count: {$sum: 1}
                }
            },
            {
                $project: {
                    totalCounts: "$count"
                }
            }
        ]);
        return result[0]?.totalCounts || 0;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};

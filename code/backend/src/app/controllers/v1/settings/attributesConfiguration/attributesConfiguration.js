const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const AttributeConfigurationRepository = require("../../../../models/settings/repository/attributeConfigurationRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {type = null} = req.query;
        let rows = await AttributeConfigurationRepository.findOneDoc(
            {
                ...(!!type && {
                    type: type
                })
            },
            {
                _id: 1,
                type: 1,
                items: {$sortArray: {input: "$items", sortBy: {order: 1}}}
            }
        );
        return res.success(rows);
    } catch (e) {
        console.error("Attributes Configuration", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await AttributeConfigurationRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails = await AttributeConfigurationRepository.updateDoc(itemDetails, req.body);
        if (itemDetails) {
            res.success({
                message: "Attributes Configuration has been updated successfully"
            });
        }
    } catch (e) {
        console.error("update Attributes", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await AttributeConfigurationRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Attributes Configuration");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getAllAttributesConfiguration = async type => {
    try {
        let rows = await AttributeConfigurationRepository.filteredAttributesConfigList([
            {
                $unwind: "$items"
            },
            {
                $match: {
                    "items.status": true,
                    type: type
                }
            },
            {
                $project: {
                    order: "$items.order",
                    tabName: "$items.tabName",
                    tabDisplayName: "$items.tabDisplayName",
                    status: "$items.status"
                }
            },
            {
                $sort: {order: 1}
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllAttributesConfiguration", e);
    }
};

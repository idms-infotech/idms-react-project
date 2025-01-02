const {validationResult} = require("express-validator");
const {schemaValidation} = require("../helpers/schemaValidate");
exports.validate = schemas => {
    return async (req, res, next) => {
        await Promise.all(schemaValidation[schemas].map(schema => schema.run(req)));
        const result = validationResult(req);
        if (result.isEmpty()) {
            return next();
        }
        const errors = result.array();
        return res.validatorsError(errors);
    };
};

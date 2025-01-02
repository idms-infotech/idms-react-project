const Model = require("../../../../models/HR/paidHolidayModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {default: mongoose} = require("mongoose");
const {getAllPaidHolidayAttributes} = require("../../../../models/HR/helpers/paidHolidayHelper.js");
const PaidHolidayRepository = require("../../../../models/HR/repository/paidHolidayRepository.js");
const ObjectId = mongoose.Types.ObjectId;

// @desc    getAll PaidHoliday Record
exports.getAll = async (req, res) => {
    try {
        let project = getAllPaidHolidayAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $addFields: {
                    holidayDateS: {$dateToString: {format: "%d-%m-%Y", date: "$holidayDate"}},
                    serialNumber: {$toString: "$serialNumber"}
                }
            }
        ];
        let rows = await PaidHolidayRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllPaidHolidays", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
// @desc    create PaidHoliday new Record
exports.create = async (req, res) => {
    try {
        let holidayExists = await PaidHolidayRepository.findOneDoc({
            holidayName: req.body.holidayName,
            company: req.user.company
        });
        if (holidayExists) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("Paid Holiday");
            return res.preconditionFailed(errors);
        }
        const holidays = await PaidHolidayRepository.countDoc({});
        const serialNumber = holidays + 1;
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        createdObj.serialNumber = serialNumber;
        const itemDetails = await PaidHolidayRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Paid Holiday")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create PaidHoliday", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

// @desc    update PaidHoliday  Record
exports.update = async (req, res) => {
    try {
        let itemDetails = await PaidHolidayRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await PaidHolidayRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Paid Holiday has been")
        });
    } catch (e) {
        console.error("update PaidHoliday", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

// @desc    deleteById PaidHoliday Record
exports.deleteById = async (req, res) => {
    try {
        const deleteItem = await PaidHolidayRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Paid Holiday")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Paid Holiday");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById PaidHoliday", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

// @desc    getById PaidHoliday Record
exports.getById = async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id).populate("company");
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("PaidHoliday");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById PaidHoliday", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getCountOfHolidayOfMonth = async (startDate, endDate, company) => {
    try {
        const count = await PaidHolidayRepository.filteredPaidHolidayList([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$holidayDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    matchDate: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $count: "counts"
            }
        ]);
        return count.length ? count[0].counts : 0;
    } catch (error) {
        console.error(error);
    }
};
exports.getCountOfHolidayOfMonthWithLocations = async (startDate, endDate, company) => {
    try {
        let counts = {
            factoryCount: 0,
            officeCount: 0,
            officeFactoryCount: 0
        };
        const count = await PaidHolidayRepository.filteredPaidHolidayList([
            {
                $match: {
                    company: ObjectId(company),
                    holidayDate: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $group: {
                    _id: "$holidayLocation",
                    counts: {$sum: 1}
                }
            }
        ]);
        counts.factoryCount = count.find(x => x._id == "Factory")?.counts ?? 0;
        counts.officeCount = count.find(x => x._id == "Office")?.counts ?? 0;
        counts.officeFactoryCount = count.find(x => x._id == "Office & Factory")?.counts ?? 0;
        return counts;
    } catch (error) {
        console.error(error);
    }
};
exports.getUpComingHolidays = async company => {
    try {
        const count = await Model.find({
            company: company,
            holidayDate: {
                $gte: new Date()
            }
        })
            .sort({holidayDate: 1})
            .limit(+2)
            .skip(0);
        return count;
    } catch (error) {
        console.error(error);
    }
};

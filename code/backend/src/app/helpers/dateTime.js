const moment = require("moment");
const {getFirstDateOfCurrentFiscalYear} = require("../utilities/utility");

exports.getMonthDiffFromCurrentFiscalYear = str => {
    return moment().diff(new Date(getFirstDateOfCurrentFiscalYear()), str, true);
};
exports.formatDate = date => {
    return moment(date).format("DD-MM-YYYY");
};
exports.dateToAnyFormat = (date, str) => {
    return moment(date).format(str);
};
exports.getCurrentDate = formatStr => {
    return moment().format(formatStr);
};

exports.getSubtractedDate = function (num, str) {
    return moment().subtract(num, str).format("YYYY-MM-DD");
};
exports.getDaysInCurrentMonth = function (date) {
    return moment(date).daysInMonth();
    // return moment(date, "YYYY-MM").daysInMonth();
};
exports.getEndDateOfMonth = function (date) {
    return moment(date).endOf("month");
};
exports.getDateDiff = function (endDate, startDate, str) {
    return moment(endDate).diff(moment(startDate), str) + 1;
};
exports.getPreviousMonthStartDate = function (num) {
    return moment()
        .month(moment().month() - +num)
        .startOf("month")
        .format("YYYY-MM-DD");
};
exports.momentDate = () => {
    return moment().format();
};
exports.getExpiryDate = (shelfLife, date) => {
    return shelfLife ? moment(date).add(shelfLife, "M") : null;
};

exports.getDaysAddedDate = timeInDays => {
    return moment().add(timeInDays, "days").format("YYYY-MM-DD");
};
exports.getStartDateTime = date => {
    return new Date(new Date(date).setHours(0, 0, 0, 0));
};
exports.getEndDateTime = date => {
    return new Date(new Date(date).setHours(23, 59, 59, 999));
};
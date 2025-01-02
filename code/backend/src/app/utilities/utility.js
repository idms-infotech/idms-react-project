const Fiscal = require("fiscal");
const memoryCacheHandler = require("./memoryCacheHandler");

const fiscal = new Fiscal(3);
const info = fiscal.getFiscalInfoForDate();

exports.getCurrentFinancialYear = () => {
    let fiscalYear = "";
    let today = new Date();
    if (today.getMonth() + 1 <= 3) {
        fiscalYear =
            (new Date().getFullYear() - 1).toString().substr(-2) + new Date().getFullYear().toString().substr(-2);
    } else {
        fiscalYear =
            new Date().getFullYear().toString().substr(-2) + (new Date().getFullYear() + 1).toString().substr(-2);
    }
    return fiscalYear;
};

exports.getCurrentFinancialYearForDisplay = () => {
    let fiscalYear = "";
    let today = new Date();
    if (today.getMonth() + 1 <= 3) {
        fiscalYear =
            (new Date().getFullYear() - 1).toString().substr(-2) + new Date().getFullYear().toString().substr(-2);
    } else {
        fiscalYear = new Date().getFullYear().toString();
    }
    return fiscalYear;
};

exports.getFirstDayOfMonth = () => {
    let date = new Date(),
        y = date.getFullYear(),
        m = date.getMonth();
    let firstDay = new Date(y, m, 1);
    return firstDay;
};

exports.getLastDayOfMonth = () => {
    let date = new Date(),
        y = date.getFullYear(),
        m = date.getMonth();
    let lastDay = new Date(y, m + 1, 1);
    return lastDay;
};

exports.getFirstDayOfFiscalYear = () => {
    return info.fiscalYear.startDate;
};

exports.getLastDayOfFiscalYear = () => {
    return info.fiscalYear.endDate;
};

exports.getFirstDateOfMonth = () => {
    let date = new Date(),
        y = date.getFullYear(),
        m = date.getMonth();
    return new Date(y, m, 1);
};

exports.getLastDateOfMonth = () => {
    let date = new Date(),
        y = date.getFullYear(),
        m = date.getMonth();
    return new Date(y, m + 1, 1);
};

exports.getFirstDateOfCurrentFiscalYear = () => {
    let firstDateOfFiscalYear = this.getFirstDayOfFiscalYear();
    let year = new Date(firstDateOfFiscalYear).getFullYear();
    let month = new Date(firstDateOfFiscalYear).getMonth();
    let date = new Date(firstDateOfFiscalYear).getDate();

    return new Date(year, month, date);
};

exports.getLastDateOfCurrentFiscalYear = () => {
    let lastDateOfFiscalYear = this.getLastDayOfFiscalYear();
    let year1 = new Date(lastDateOfFiscalYear).getFullYear();
    let month1 = new Date(lastDateOfFiscalYear).getMonth();
    let date1 = new Date(lastDateOfFiscalYear).getDate();

    return new Date(year1, month1, date1);
};

exports.getStartDateCriteria = startDate => {
    let year = new Date(startDate).getFullYear();
    let month = new Date(startDate).getMonth();
    let date = new Date(startDate).getDate();

    return new Date(year, month, date);
};

exports.getEndDateCriteria = startDate => {
    let year = new Date(startDate).getFullYear();
    let month = new Date(startDate).getMonth();
    let date = new Date(startDate).getDate();

    return new Date(year, month, date);
};

exports.getFirstDayOfWeek = () => {
    let current = new Date(); // get current date
    let weekstart = current.getDate() - current.getDay() + 1;
    let monday = new Date(current.setDate(weekstart));
    return monday;
};

exports.getLastDayOfWeek = () => {
    let current = new Date(); // get current date
    let weekstart = current.getDate() - current.getDay() + 1;
    let weekend = weekstart + 6; // end day is the first day + 6
    let sunday = new Date(current.setDate(weekend));
    return sunday;
};
exports.getAllMonthName = () => {
    return [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];
};
exports.getFiscalMonthsName = () => {
    return ["Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
};

exports.getCurrentMonthName = () => {
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];
    const d = new Date();
    return monthNames[d.getMonth()];
};

exports.getPreviousMonthName = () => {
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    const d = new Date();
    return monthNames[d.getMonth() - 1];
};

exports.getDecimalOfCurrency = (currencyName, value) => {
    const currencyMapObj = memoryCacheHandler.get("currencyMaster");
    let decimal = 2;
    if (currencyMapObj) decimal = currencyMapObj[currencyName] ?? 2;
    return +value.toFixed(decimal ? decimal : 2);
};

exports.sundaysInMonth = date => {
    let y = new Date(date).getFullYear();
    let m = new Date(date).getMonth();
    let firstDay = new Date(y, m, 1);
    let daysInMonth = new Date(y, m + 1, 0).getDate();

    let sundays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        let currentDate = new Date(y, m, day);
        if (currentDate.getDay() === 0) {
            // Sunday
            sundays++;
        }
    }
    return sundays;
};

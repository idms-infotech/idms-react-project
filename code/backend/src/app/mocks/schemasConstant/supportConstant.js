exports.ISSUE = {
    COLLECTION_NAME: "Issue",
    ADDED_ACTION: "Supports Issue Master created",
    UPDATED_ACTION: "Supports Issue Master updated",
    MODULE_NAME: "Issue Ticket",
    MODULE: "IMP",
    MODULE_PREFIX: "TN/",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.MOM = {
    COLLECTION_NAME: "MinutesOfMeeting",
    ADDED_ACTION: "BoM Of minutes of meeting created",
    UPDATED_ACTION: "BoM Of minutes of meeting updated",
    MODULE_NAME: "Minutes Of Meeting",
    MODULE: "MoM/",
    MODULE_PREFIX: "MoM/",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};

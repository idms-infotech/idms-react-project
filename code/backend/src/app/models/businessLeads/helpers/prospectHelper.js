exports.getAllProspectAttributes = () => {
    return {
        contactPersonName: "$contactDetails.contactPersonName",
        contactPersonNumber: "$contactDetails.contactPersonNumber",
        prospectRegistrationCode: 1,
        prospectRegistrationDateS: {$dateToString: {format: "%d-%m-%Y", date: "$prospectRegistrationDate"}},
        prospectName: 1,
        customerCategory: 1,
        createdAt: 1,
        status: 1
    };
};
exports.getAllProspectExcelAttributes = () => {
    return {
        contactPersonName: "$contactDetails.contactPersonName",
        contactPersonNumber: "$contactDetails.contactPersonNumber",
        prospectRegistrationCode: 1,
        prospectRegistrationDateS: {$dateToString: {format: "%d-%m-%Y", date: "$prospectRegistrationDate"}},
        contactPersonDepartment: "$contactDetails.contactPersonDepartment",
        contactPersonDesignation: "$contactDetails.contactPersonDesignation",
        contactPersonEmail: "$contactDetails.contactPersonEmail",
        country: "$correspondenceAddress.country",
        pinCode: "$correspondenceAddress.pinCode",
        city: "$correspondenceAddress.city",
        state: "$correspondenceAddress.state",
        line1: "$correspondenceAddress.line1",
        line2: "$correspondenceAddress.line2",
        line3: "$correspondenceAddress.line3",
        line4: "$correspondenceAddress.line4",
        prospectName: 1,
        customerCategory: 1,
        createdAt: 1,
        status: 1
    };
};

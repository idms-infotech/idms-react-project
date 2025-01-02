exports.getAllIssueAttributes = () => {
    return {
        issueNumber: 1,
        issueTitle: 1,
        ticketType: 1,
        subModuleName: 1,
        priority: 1,
        severity: 1,
        issueDescription: 1,
        issueResolution: 1,
        issueStatus: 1,
        issueDate: {$dateToString: {format: "%d-%m-%Y", date: "$issueDate"}},
        Url: {$concat: [CONSTANTS.domainUrl, "issueAttachment/", "$issueAttachment"]}
    };
};
exports.getAllIssueReportsAttributes = () => {
    return {
        issueNumber: 1,
        issueTitle: 1,
        issueDescription: 1,
        issueResolution: 1,
        issueStatus: 1,
        issueDate: {$dateToString: {format: "%d-%m-%Y", date: "$issueDate"}},
        createdAt: 1
    };
};

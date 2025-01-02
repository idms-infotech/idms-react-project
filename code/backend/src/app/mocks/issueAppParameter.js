const ISSUE_TICKET_TYPE = [
    // {
    //     label: "Defect",
    //     value: "Defect"
    // },
    // {
    //     label: "Service Request",
    //     value: "Service Request"
    // },
    // {
    //     label: "Improvement",
    //     value: "Improvement"
    // },
    // {
    //     label: "Training Request",
    //     value: "Training Request"
    // },
    // {
    //     label: "Other",
    //     value: "Other"
    // }
    {
        label: "GSR - General Service Request",
        value: "GSR"
    },
    {
        label: "DCR - Data Change Request",
        value: "DCR"
    },
    {
        label: "BFR - Bug Fix Request",
        value: "BFR"
    },
    {
        label: "OFI - Opportunity For Improvement",
        value: "OFI"
    }
];
const PRIORITY = [
    {
        label: "Urgent",
        value: "Urgent"
    },
    {
        label: "High",
        value: "High"
    },
    {
        label: "Medium",
        value: "Medium"
    },
    {
        label: "Low",
        value: "Low"
    }
];
const ISSUE_SEVERITY = [
    {
        label: "Blocker",
        value: "Blocker"
    },
    {
        label: "Critical",
        value: "Critical"
    },
    {
        label: "Major",
        value: "Major"
    },
    {
        label: "Minor",
        value: "Minor"
    },
    {
        label: "Trivial",
        value: "Trivial"
    }
];
module.exports = {
    ISSUE_TICKET_TYPE,
    PRIORITY,
    ISSUE_SEVERITY
};

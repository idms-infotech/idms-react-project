exports.getAllMinutesOfMeetAttributes = () => {
    return {
        MOMCode: 1,
        MOMDateS: {$dateToString: {format: "%d-%m-%Y", date: "$MOMDate"}},
        MOMTitle: 1,
        meetingType: 1,
        venue: 1,
        organizer: 1,
        createdBy: 1
    };
};

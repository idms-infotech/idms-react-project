exports.getAllSupplierRuleAttributes = () => {
    return {
        name: 1,
        description: 1,
        enabled: 1,
        weight: {$round: ["$weight", 2]},
        passingPercentage: {$round: ["$passingPercentage", 2]},
        failingPercentage: {$round: ["$failingPercentage", 2]}
    };
};

const fs = require("fs");
const {updateCollection} = require("./apiList");

fs.readFile("./IDMS.postman_collection.json", "utf8", (err, data) => {
    if (err) {
        console.error("Error reading file:", err);
        return;
    }
    try {
        const collection = JSON.parse(data);
        let updatedCollectionJson = updateCollection(collection);
        fs.writeFile("./IDMS.postman_collection.json", updatedCollectionJson, err => {
            if (err) {
                console.error("Error writing file:", err);
                return;
            }
            console.log("Collection updated successfully!");
        });
    } catch (error) {
        console.error("Error parsing JSON:", error);
    }
});

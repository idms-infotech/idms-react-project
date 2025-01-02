const mongoose = require("mongoose");
const exceptCollections = ["MenuItem", "Company", "SupplierCategory", "CustomerCategory", "User"];
// exports.removeAllCollectionsExcept = async function () {
//     try {
//         // Get all collections in the database
//         const collections = await mongoose.connection.db.listCollections().toArray();

//         for (const collection of collections) {
//             const collectionName = collection.name;

//             // Skip collections that are in the 'exceptCollections' array
//             if (!exceptCollections.includes(collectionName)) {
//                 console.log(`Dropping collection: ${collectionName}`);
//                 await mongoose.connection.db.dropCollection(collectionName);
//             }
//         }

//         console.log("All other collections dropped except:", exceptCollections);
//     } catch (err) {
//         console.error("Error while removing collections:", err);
//     }
// };

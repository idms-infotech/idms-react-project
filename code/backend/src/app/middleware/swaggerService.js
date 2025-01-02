const swaggerAutoGen = require("swagger-autogen");
const swaggerHandler = require("../utilities/swaggerHandler.js");

const doc = {
    info: {
        title: "My API",
        description: "API documentation"
    },
    host: "localhost:2023",
    schemes: ["http"]
};

const outputFile = "../mocks/swagger-output.json";
const endpointsFiles = ["src/app/controllers/v1/**.js"]; // Include all your endpoint files here

const swaggerAutoGenInstance = swaggerAutoGen();
swaggerAutoGenInstance(outputFile, endpointsFiles, doc).then(() => {
    swaggerHandler.updateSwaggerDoc();
});

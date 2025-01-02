const {serve, setup} = require("swagger-ui-express");
const swaggerOutput = require("../mocks/swagger-output.json");
const schemaHandler = require("./schemaHandler.js");
const FileHandler = require("./fileHandler.js");

class SwaggerHandler {
    constructor() {}

    setup(app) {
        app.use("/api-docs", serve, setup(swaggerOutput));
        // this.updateSwaggerDoc();
    }

    async updateSwaggerDoc() {
        const swaggerOutputFilePath = "src/app/mocks/swagger-output.json";
        let schemaArray = await schemaHandler.loadSchemas();
        let swaggerOutputFile = JSON.parse(JSON.stringify(swaggerOutput));
        if (Object.keys(swaggerOutputFile).length !== 0) {
            let paths = Array.from(
                new Set(Object.keys(swaggerOutputFile.paths).map(path => path.substring(0, path.lastIndexOf("/") + 1)))
            );
            for (const path of paths) {
                let controllerName = path.split("/")[2];
                let regexPattern = new RegExp(path, "i");
                const matchingKeys = Object.keys(swaggerOutputFile.paths).filter(key => regexPattern.test(key));

                for (const key of matchingKeys) {
                    let requestType = Object.keys(swaggerOutputFile.paths[key])[0];
                    swaggerOutputFile.paths[key][requestType].tags = [
                        controllerName == "" ? "default" : controllerName
                    ];
                    for (const schema of schemaArray) {
                        let modelRegex = new RegExp(controllerName);
                        if (modelRegex.test(schema.model) && (requestType === "post" || requestType === "put")) {
                            let schemaObj = JSON.parse(JSON.stringify(schema));
                            delete schemaObj.model;
                            schemaObj = Object.keys(schemaObj);
                            schemaObj = schemaObj.reduce((acc, key) => {
                                acc[key] = {
                                    example: "any"
                                };
                                return acc;
                            }, {});
                            swaggerOutputFile.paths[key][requestType].parameters = [
                                {
                                    name: "body",
                                    in: "body",
                                    schema: {
                                        type: "object",
                                        properties: schemaObj
                                    }
                                }
                            ];
                        }
                    }
                }
            }
            if (FileHandler.fileExists(swaggerOutputFilePath)) {
                await FileHandler.writeFile(swaggerOutputFilePath, JSON.stringify(swaggerOutputFile));
            }
        }
    }
}

module.exports = new SwaggerHandler();

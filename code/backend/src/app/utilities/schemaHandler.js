const path = require("path");
const {pathToFileURL} = require("url");
const FileHandler = require("./fileHandler.js");

class SchemaLoader {
    constructor(schemasPath) {
        this.schemasPath = schemasPath;
        this.schemasMap = [];
    }

    async loadSchemas(dirPath = this.schemasPath) {
        const entries = await FileHandler.readDir(dirPath, {withFileTypes: true});
        for (const entry of entries) {
            const entryPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                if (!["repository", "helpers", "schemas"].includes(entry.name)) {
                    await this.loadSchemas(entryPath);
                }
            } else if (entry.isFile() && entry.name.endsWith(".js") && entry.name !== "paginatePlugin.js") {
                const schemaModule = await import(pathToFileURL(entryPath).href);
                const {modelName, schema} = schemaModule.default;
                this.schemasMap.push({model: modelName, ...schema.obj});
            }
        }
        return this.schemasMap;
    }
}

module.exports = new SchemaLoader("src/app/models");

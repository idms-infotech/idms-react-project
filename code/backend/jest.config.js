// handle multiple environments
const target = "test";
if (!target) throw new Error("Missing TARGET environment variable");

module.exports = {
    moduleFileExtensions: ["js", "json"],
    modulePathIgnorePatterns: ["<rootDir>/out"],
    rootDir: "./",
    testMatch: ["<rootDir>/src/test/**/*.{spec,test}.js"],
    testPathIgnorePatterns: ["<rootDir>/node_modules", "<rootDir>/out"],
    testEnvironment: "node",
    setupFiles: [`<rootDir>/src/config/environments/${target}.js`],
    reporters: [
        "default",
        [
            "jest-html-reporters",
            {
                publicPath: "./out/report",
                filename: "index.html",
                expand: false
            }
        ]
    ]
};

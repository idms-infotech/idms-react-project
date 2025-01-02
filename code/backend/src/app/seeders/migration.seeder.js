const fs = require("fs");
const path = require("path");

const seedersDirectory = path.join(__dirname, "../controllers");

const seederFilePattern = /\.seeder\.js$/;

const getSeederFiles = dir => {
    let seederFiles = [];

    fs.readdirSync(dir).forEach(fileOrDir => {
        const fullPath = path.join(dir, fileOrDir);

        if (fs.statSync(fullPath).isDirectory()) {
            seederFiles = seederFiles.concat(getSeederFiles(fullPath));
        } else if (seederFilePattern.test(fullPath)) {
            seederFiles.push(fullPath);
        }
    });

    return seederFiles;
};

const allSeederFiles = getSeederFiles(seedersDirectory);

allSeederFiles.forEach(file => {
    require(file);
});

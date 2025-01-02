const Puppeteer = require("puppeteer");
const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");

exports.generatePdfPuppeteer = asyncHandler(async (id, fileName, website_url) => {
    try {
        fileName = fileName.replace(/\//g, "").replace(/-/g, "").replace(/\\/g, "").replace(/_/g, "");
        const browser = await Puppeteer.launch({args: ["--no-sandbox", "--disable-setuid-sandbox"]});
        const page = await browser.newPage();
        await page.setViewport({width: 1366, height: 1500});
        console.info("website_url", website_url);
        await page.goto(website_url, {waitUntil: "networkidle0"});
        await delay(5000);
        await page.emulateMediaType("screen");
        await page.addStyleTag({content: "@page { size: auto; }"});
        await page.evaluate(() => document.documentElement.offsetHeight);
        let filePath = path.resolve(`${__dirname}/../../assets/excel/${fileName}.pdf`);
        const pdf = await page.pdf({
            path: filePath,
            height: 1500 + "px",
            printBackground: true,
            //preferCSSPageSize: true,
            format: "A4"
        });
        await browser.close();
        return [
            {
                filename: `${fileName}.pdf`,
                path: filePath
            }
        ];
    } catch (error) {
        console.error("Error :::::::::::::: ", error);
    }
});
function base64_encode(file) {
    let bitmap = fs.readFileSync(file);
    return Buffer.from(bitmap).toString("base64");
}
function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
}

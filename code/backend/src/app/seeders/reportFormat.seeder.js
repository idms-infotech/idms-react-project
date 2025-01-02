const reportFormatJson = require("../mocks/reportFormat.json");
const ReportFormatsRepository = require("../models/settings/repository/reportFormatsRepository");

exports.reportFormatInsert = async function (company) {
    try {
        for await (const ele of reportFormatJson) {
            const exists = await ReportFormatsRepository.findOneDoc({
                menuItemId: ele.menuItemId,
                reportName: ele.reportName
            });
            if (!exists) {
                ele.company = company;
                await ReportFormatsRepository.createDoc(ele);
            } else {
                await ReportFormatsRepository.findAndUpdateDoc(
                    {_id: exists?._id},
                    {templateOptions: ele?.templateOptions}
                );
            }
        }
        console.info("Report Formats Inserted successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};

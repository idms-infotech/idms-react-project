const {getMatchData} = require("../../helpers/global.options");
const {outputData, outputDataReports} = require("../../helpers/utility");

exports.paginatePlugin = function (schema) {
    schema.statics.paginate = async function ({pipeline = [], project = {}, queryParams}) {
        try {
            const {
                search = null,
                excel = "false",
                page = 1,
                pageSize = 10,
                column = "createdAt",
                direction = -1
            } = queryParams;
            let match = await getMatchData(project, search);
            let skip = Math.max(0, page - 1) * pageSize;
            let pagination = [];
            if (excel == "false") {
                pagination = [{$skip: +skip}, {$limit: +pageSize}];
            }
            let rows = await this.aggregate([
                ...pipeline,
                {$project: project},
                {$match: match},
                {$sort: {[column]: +direction}},
                {
                    $facet: {
                        metadata: [{$count: "total"}],
                        data: pagination
                    }
                }
            ]);
            return outputData(rows);
        } catch (e) {
            console.error("paginatePlugin", e);
        }
    };
};

exports.reportPaginatePlugin = function (schema) {
    schema.statics.reportPaginate = async function ({pipeline = [], project = {}, queryParams, groupValues}) {
        try {
            const {
                search = null,
                excel = "false",
                page = 1,
                pageSize = 10,
                column = "createdAt",
                direction = -1
            } = queryParams;
            let match = await getMatchData(project, search);
            let skip = Math.max(0, page - 1) * pageSize;
            let pagination = [];
            if (excel == "false") {
                pagination = [{$skip: +skip}, {$limit: +pageSize}];
            }
            let rows = await this.aggregate([
                ...pipeline,
                {$project: project},
                {$match: match},
                {$sort: {[column]: +direction}},
                {
                    $facet: {
                        metadata: [{$count: "total"}],
                        data: pagination,
                        groupAmounts: groupValues
                    }
                }
            ]);
            return outputDataReports(rows);
        } catch (e) {
            console.error("paginatePlugin", e);
        }
    };
};

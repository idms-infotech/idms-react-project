const {MAIN_MODULE_NAME} = require("./postmanConstants");

exports.REQUESTS = function (subModuleObj) {
    let output = [];
    for (const ele of subModuleObj.routesArray) {
        output.push({
            name: ele.path,
            request: {
                method: ele.method,
                header: [
                    {
                        key: "{{A}}",
                        value: "{{T}}",
                        type: "text"
                    }
                ],
                body: {
                    mode: "raw",
                    raw: "",
                    options: {
                        raw: {
                            language: "json"
                        }
                    }
                },
                url: `{{Base_URL}}/${MAIN_MODULE_NAME}/${subModuleObj.subModule}${ele.path}`
            }
        });
    }
    return output;
};

exports.getRoutes = (app, subModule) => {
    let output = {subModule, routesArray: []};
    app.stack.forEach(layer => {
        if (layer.route) {
            let route = {
                path: layer.route.path,
                method: layer.route.stack[0].method.toUpperCase()
            };
            output.routesArray.push(route);
        }
    });
    return output;
};

const axios = require("axios");

exports.requestAxios = async config => {
    try {
        let response = await axios(config);
        return response.data;
    } catch (e) {
        console.error("requestAxios", e);
        return e;
    }
};

const cors = require("cors");

class CorsHandler {
    constructor() {
        this.allowedOrigins = [
            "http://localhost:4200",
            "https://angular.idms-test.com",
            "https://idms-aas.in",
            "https://idms-cei.com",
            "https://idms-decaltech.com",
            "https://idms-waco.com",
            "https://idms-demo.com",
            "https://www.idms-ilabels.in",
            "https://idms-sneham.com",
            "https://idms-vegaaviation.in",
            "https://idms-adorngraphics.com",
            "https://support.idms-test.com",
            "https://idms-rangvishwa.com",
            "https://www.idms-vegahtc.in",
            "https://idms-atp.com"
        ];
        this.corsOptions = {
            origin: (origin, callback) => {
                try {
                    console.log("origin", origin);
                    // Check if the request origin is in the allowedOrigins array
                    if (this.allowedOrigins.includes(origin)) {
                        callback(null, true);
                    } else {
                        callback(new Error("Not allowed by CORS"));
                    }
                } catch (error) {
                    console.error("error", error);
                    callback(error);
                }
            },
            optionsSuccessStatus: 200
        };
    }

    // Method to get CORS middleware
    getCorsMiddleware() {
        return cors(this.corsOptions);
    }
}

module.exports = new CorsHandler();

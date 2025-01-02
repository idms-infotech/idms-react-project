require("dotenv").config();

exports.CONSTANTS = {
    port: process.env.PORT,
    logLevel: process.env.LOG_LEVEL,
    sessionSecret: process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV,
    jwtSecret: process.env.JWT_SECRET,
    port2: process.env.PORT2,
    domainUrl: process.env.DOMAIN_URL,
    reqURL: process.env.REQ_URL,
    eWayToken: process.env.EWAY_TOKEN,
    employeePassword: process.env.EMPLOYEE_PASSWORD,
    CDNWebStatic: process.env.CDN_WEB_STATIC,
    environment: process.env.ENVIRONMENT,
    clientReqProtocol: process.env.CLIENT_REQUEST_PROTOCOL,
    adminHost: process.env.ADMIN_HOST,
    customerHost: process.env.CUSTOMER_HOST,
    jwtTimeoutDuration: process.env.JWT_TIMEOUT_DURATION,
    devDataBaseUrl: process.env.DEV_DATABASE_URL,
    prodDatabaseUrl: process.env.PROD_DATABASE_URL,
    testDataBaseUrl: process.env.TEST_DATABASE_URL,
    supportUrl: process.env.SUPPORT_URL,
    company_id: process.env.COMPANY_ID,
    fromEmailAddress: process.env.FROM_EMAIL_ADDRESS,
    nodeMailerTransporterOptions: {
        // service: process.env.EMAIL_SERVICE,
        host: process.env.EMAIL_HOST,
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
            // name: process.env.EMAIL_USER,
        },
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false
        }
    }
};

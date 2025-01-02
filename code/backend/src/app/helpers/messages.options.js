const MESSAGES = {
    resCode: {
        HTTP_OK: 200,
        HTTP_CREATE: 201,
        HTTP_NO_CONTENT: 204,
        HTTP_BAD_REQUEST: 400,
        HTTP_UNAUTHORIZED: 401,
        HTTP_FORBIDDEN: 403,
        HTTP_NOT_FOUND: 404,
        HTTP_METHOD_NOT_ALLOWED: 405,
        HTTP_CONFLICT: 409,
        HTTP_INTERNAL_SERVER_ERROR: 500,
        HTTP_SERVICE_UNAVAILABLE: 503
    },
    errorTypes: {
        OAUTH_EXCEPTION: "OAuthException",
        ALREADY_AUTHENTICATED: "AlreadyAuthenticated",
        UNAUTHORISED_ACCESS: "UnAuthorizedAccess",
        INPUT_VALIDATION: "InputValidationException",
        ACCOUNT_ALREADY_EXIST: "AccountAlreadyExistException",
        ACCOUNT_DOES_NOT_EXIST: "AccountDoesNotExistException",
        ENTITY_NOT_FOUND: "EntityNotFound",
        ACCOUNT_BLOCKED: "AccountBlocked",
        ACCOUNT_DEACTIVATED: "AccountDeactivated",
        CONTENT_BLOCKED: "ContentBlocked",
        CONTENT_REMOVED: "ContentRemoved",
        PRIVATE_CONTENT: "PrivateContent",
        PRIVATE_ACCOUNT: "PrivateAccount",
        DUPLICATE_REQUEST: "DuplicateRequest",
        EMAIL_NOT_VERIFIED: "emailNotVerified",
        MOBILE_NUMBER_NOT_VERIFIED: "mobileNumberNotVerified",
        INTERNAL_SERVER_ERROR: "InternalServerError"
    },
    apiErrorStrings: {
        CREDIT_CARD_EXIST: "Credit Card detail is already added.",
        INVALID_REQUEST: "Invalid request",
        SERVER_ERROR: "Oops! something went wrong",
        MOBILE_NUMBER_ALREADY_IN_USE:
            "The Mobile number is already in use. Please try again using a different Mobile number",
        USER_EXISTS: data => `User already exists with this same ${data}`,
        FIRM_EXISTS: data => `Firm already exists with this same ${data}`,
        ADDITIONAL_ASSETS: data => `${data} is already exists.`,
        Data_EXISTS: data => `${data} already exists.`,
        CANNOT_DELETE: data => `${data} can't be deleted `,
        NOT_FOUND: data => `❗${data} not found!`,
        USER_DOES_NOT_EXIST: "The user does not exist!",
        PASSWORD_DOES_NOT_MATCH: "The password does not match.",
        PASSWORD_INVALID: "Invalid Password.",
        OTP_SEND_FAILED: "OTP send failed!",
        OTP_INVALID: "Please enter a valid OTP.",
        OTP_EXPIRED: "The OTP is either invalid or has been expired",
        ACCOUNT_BLOCKED: "Your account has been blocked!",
        ACCOUNT_DEACTIVATED: "Your account has been deactivated!",
        USERNAME_ALREADY_IN_USE: "The username you have entered is already associated with an account.",
        USER_BLOCKED: "Your account has been blocked,if you think it's a mistake please contact admin.",
        ACTIVATE_ACCOUNT: "Please activate your account by clicking on the link sent to your registered email address",
        INVALID_CREDENTIALS: "The email and/or password entered are incorrect",
        INVALID_TOKEN: "Your email verification token is invalid or has been expired"
    },
    apiSuccessStrings: {
        PASSWORD: data => `Your password has been ${data}`,
        PASSWORD_SEND: "Password has been shared to your registered email address",
        LOGOUT_SUCCESS: "Logout successfully!",
        SIGNUP_SUCCESS: "User registered successfully!",
        OTP_SENT_SUCCESS: "OTP sent successfully!",
        OTP_VERIFIED: "OTP verified successfully",
        USERNAME_SUCCESS: "User Name available",
        USERNAME_CHANGE: "Your Username has been Changed as ",
        EMAIL_UPDATE: "Your profile email has been changed",
        RESEND_EMAIL: "Email resent to the client successfully!",
        EMAIL_FORGOT: "Please check email to change a password",
        ADDED: data => `${data} created successfully`,
        INSERT: data => `${data} inserted successfully`,
        CLOSING_LETTER: data => `${data} sended successfully`,
        PUSHTOVAULT: data => `${data} pushed successfully.`,
        UPDATE: data => `${data} updated successfully`,
        STATUS_CHANGE: (data, status) => `${data} status has been changed to ${status} successfully`,
        DELETED: data => `${data}  deleted successfully`,
        CANCELLED: data => `${data}  cancelled successfully`,
        DATA_ALREADY_EXISTS: data => `${data} already exists`,
        DATA_NOT_EXISTS: data => `${data} does not exists`,
        COURSES: data => `Courses are ${data}`,
        CLIENT_INFORMATION: data => `client are ${data}`,
        FILE_INFORMATION: data => `File are ${data}`,
        REAL_ESTATE: data => `Real Estate Assets are ${data}`,
        ADDITIONAL_ASSETS: data => `Additional Assets are ${data}`,
        DOC_INFORMATION: data => `Document  are ${data}`,
        BANK_ACCOUNT: data => `Bank Account  are ${data}`,
        CLIENT_DOC: data => `Client Document  are ${data}`,
        SAFETY_BOX_INFORMATION: data => `Safety Boxes are ${data}`,
        DISPOSITION_DETAILS: data => `disposition details  are ${data}`,
        LIFE_INSURANCE: data => `Life Insurance  are ${data}`,
        INVESTMENT_ASSET: data => `Investment Assets  are ${data}`,
        LIABILITY_DETAILS: data => `Liabilities Details are ${data}`,
        ASSETS_CATEGORY: data => `Assets  are ${data}`,
        DOCUMENT_TYPE: data => `document type  are ${data}`,
        CLAUSES: data => `The clauses  are ${data}`,
        CLIENT_CATEGORY: data => `client categories  are ${data}`,
        AUTOMOBILE_ASSETS_INFORMATION: data => `Automobile_Assets_Information  are ${data}`,
        PARTIES_INFORMATION: data => `parties information  are ${data}`,
        PROVISION: data => `Provision are ${data}`,
        TOPICS: data => `Topics are ${data}`,
        STOCK_CHANGE: data => `Stock status has been changed to ${data} successfully`,
        LOAD_LAWYER_SOLANA_WALLET: data => `${data} loaded successfully.`
    },
    emailStrings: {
        PO_MSG: (action, contactDetails, remarks = "-") => {
            let msg = {
                Create: data =>
                    `Please review the purchase order and ensure its accuracy. If there are any discrepancies or changes required, please contact the purchasing team at [${data}] to facilitate the necessary adjustments.`,
                Modified: data =>
                    `Please review the purchase order modifications and ensure its accuracy. If there are any discrepancies or changes required, please contact the purchasing team at [${data}] to facilitate the necessary adjustments.`,
                Approved: data =>
                    `Please be informed that the purchase order has been approved. Please contact the purchasing team at [${data}] for assistance.`,
                Rejected: (data, remarks) =>
                    `Please be informed that the purchase order has been rejected due to ${remarks}, please contact the purchasing team at [${data}] for assistance.`,
                "Report Generated": data =>
                    `Please be informed that the purchase order report has been generated. Please contact the purchasing team at [${data}] for assistance.`
            };
            return msg[action](contactDetails, remarks);
        },
        PO_INFO_MSG: (data, company) =>
            `This email is to inform you that a new purchase order has been ${data} by ${company} in the Integrated Digital Management System (IDMS). Please find the details below:`,

        PO_REPORT_MSG: (data, company) =>
            `This email is to inform you that a new purchase order ${data}  by ${company} in the Integrated Digital Management System (IDMS). Please find the details below:`,
        PO_CREATE_MSG: data =>
            `Please review the purchase order and ensure its accuracy. If there are any discrepancies or changes required, please contact the purchasing team at [${data}] to facilitate the necessary adjustments.`,
        PO_UPDATE_MSG: data =>
            `Please review the purchase order modifications and ensure its accuracy. If there are any discrepancies or changes required, please contact the purchasing team at [${data}] to facilitate the necessary adjustments.`,
        PO_APPROVE_MSG: data =>
            `Please be informed that the purchase order has been approved. Please contact the purchasing team at [${data}] for assistance.`,
        PO_REPORT_GENERATED_MSG: data =>
            `Please be informed that the purchase order report has been generated. Please contact the purchasing team at [${data}] for assistance.`,
        PO_REJECT_MSG: (remarks, data) =>
            `Please be informed that the purchase order has been rejected due to ${remarks}, please contact the purchasing team at [${data}] for assistance.`,

        ISSUE_INFO_MSG: (company, status) =>
            `This is an automated email to inform you that a new issue ticket has been ${status.toLowerCase()}ed by ${company.bold()} in the Integrated Digital Management System (IDMS). Please review the details below:`,
        ISSUE_SUCCESS_MSG: (company, issueNumber) =>
            `We are pleased to inform you that the issue raised by ${company} in the Integrated Digital Management System (IDMS) under ticket number ${issueNumber} has been successfully resolved by our IDMS Support Team`,
        ISSUE_CREATE_MSG: `Please assign the ticket to the appropriate team member for further investigation and resolution. Kindly adhere to the defined response and resolution timeframes as per the service level agreement.
            If you require any additional information or clarification regarding the issue, please contact the user who raised the ticket or refer to the IDMS issue tracking system for further details.
            Thank you for your prompt attention to this matter and your commitment to providing excellent support.`,
        ISSUE_UPDATE_MSG: `We have thoroughly tested the resolution to ensure its effectiveness. If you encounter any further difficulties or have any related questions, please don't hesitate to reach out to our support team for further assistance.
            We appreciate your patience and cooperation throughout the resolution process. Your feedback is valuable to us, so please don't hesitate to share your experience or any suggestions for improvement.
            Thank you for your understanding and continuous support.
            `,

        MRN_INFO_MSG: data =>
            `Please review the Material Release Note and ensure its accuracy. If there are any discrepancies or changes required, please contact the purchasing team at [${data}] to facilitate the necessary adjustments.`,
        MRN_CREATE_MSG: (data, company) =>
            `This email is to inform you that a new Material Release Note ${data.toLowerCase()} by ${company} in the Integrated Digital Management System (IDMS). Please find the details below:`,
        GRN_INFO_MSG: data =>
            `Please review the Goods Receipt Note and ensure its accuracy. If there are any discrepancies or changes required, please contact the purchasing team at [${data}] to facilitate the necessary adjustments.`,
        GRN_CREATE_MSG: (data, company) =>
            `This email is to inform you that a new Goods Receipt Note ${data.toLowerCase()} by ${company} in the Integrated Digital Management System (IDMS). Please find the details below:`,

        GIN_CREATE_MSG: data =>
            `Please review the Goods Inward Note and ensure its accuracy. If there are any discrepancies or changes required, please contact the purchasing team at [${data}] to facilitate the necessary adjustments.`,
        DN_INFO_MSG: data =>
            `If you have any questions or need further information, feel free to reach out to [${data}].`,
        DN_CREATE_MSG: (data, company) =>
            `This email is to inform you that a new Debit Note ${data.toLowerCase()} by ${company} in the Integrated Digital Management System (IDMS). Please find the details below:`,
        CN_CREATE_MSG: (
            data,
            company
        ) => `This email is to inform you that a new Credit Note ${data.toLowerCase()} by ${company} in the Integrated Digital
        Management System (IDMS). Please find the details below:`,
        PI_CREATE_MSG:
            data => `This email is to inform you that a new Proforma Invoice has been ${data.toLowerCase()} in the Integrated Digital
            Management System (IDMS). Please find the details below:`,
        TI_CREATE_MSG:
            company => `This email is to inform you that a new Tax Invoice has been generated by ${company} in the Integrated Digital Management
        System (IDMS). Please find the details below:`,
        DTI_CREATE_MSG: (data, company) =>
            `This email is to inform you that a new Tax Invoice ${data.toLowerCase()} by ${company} in the Integrated Digital Management System (IDMS). Please find the details below: `,
        USER_BODY_MSG: "The following user has been logged into the IDMS system. This is just for your information",
        USER_SUBJECT_MSG: "Attention: An IDMS user has been logged into the system !"
    }
};

module.exports = MESSAGES;

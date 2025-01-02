const {CONSTANTS} = require("../../config/config");
const companyId = "6379081940951d08108ab8ed";
const OPTIONS = {
    appVersion: "1.0.0",
    appSchemaUrl: "project_name",
    timeZone: "Asia/Kolkata",
    emailSenderName: "S2P Edutech",
    randomUsernameSize: 4,
    randomShopSize: 4,
    resetPasswordExpireInDays: 720,
    defaultTax: 2,
    otpExpireInDays: 1,
    usersRoles: {
        SUPER_ADMIN: "Super Admin",
        ADMIN: "Admin",
        EMPLOYEE: "Employee",
        getAllRolesAsArray: function () {
            return [
                OPTIONS.usersRoles.SUPER_ADMIN,
                OPTIONS.usersRoles.ADMIN,
                OPTIONS.usersRoles.SHOP,
                OPTIONS.usersRoles.CUSTOMER
            ];
        }
    },
    genders: {
        MALE: "Male",
        FEMALE: "Female",
        TRANSGENDER: "Transgender"
    },
    otpVerifyActionTypes: {
        MOBILE_NUMBER_VERIFY: "mobile_number_verify",
        RESET_PASSWORD: "reset_password",
        ACCOUNT_VERIFY: "account_verify"
    },
    defaultStatus: {
        NA: "NA",
        ACTIVE: "Active",
        CLOSED: "Closed",
        OPENED: "Opened",
        INACTIVE: "Inactive",
        AWAITING_ACKNOWLEDGEMENT: "Awaiting Acknowledgement",
        AWAITING_APPROVAL: "Awaiting Approval",
        GRN_PARTIAL_CREATED: "GRN Partial Created",
        GRN_CREATED: "GRN Created",
        SUPPLEMENTARY_PO: "Supplementary PO",
        CREATED: "Created",
        OPENED: "Opened",
        APPROVED: "Approved",
        REJECTED: "Rejected",
        CANCELLED: "Cancelled",
        REPORT_GENERATED: "Report Generated",
        ACKNOWLEDGED: "Acknowledged",
        DISCREPANCY_REPORTED: "Discrepancy Reported",
        DISCREPANCY_RESOLVED: "Discrepancy Resolved",
        AUTO_CLOSED: "Auto Closed",
        CLOSED: "Closed",
        CONVERTED_TO_SO: "Converted to SO",
        INVOICED: "Invoiced",
        AWAITING_REVIEW: "Awaiting Review",
        REVIEW_STARTED: "Review Started",
        TERMINATE: "Terminate",
        SUBMITTED: "Submitted",
        PARTIALLY_RELEASED: "Partially Released",
        PUT_ON_HOLD: "Put On Hold",
        IN_PROGRESS: "In Progress",
        IN_PROGRESS_DASH: "In-Process",
        UNDER_REPAIR: "UnderRepair",
        COMPLETED: "Completed",
        SCHEDULED: "Scheduled",
        ON_HOLD: "On Hold",
        OPEN: "Open",
        RELEASED: "Released",
        MARK_AS_COMPLETED: "Mark As Completed",
        SKIP_INTEGRATION: "Skip Integration",
        REWORKED: "Reworked",
        DEVIATION: "Deviation",
        ACCEPTED: "Accepted",
        WAITING_FOR_PARTS: "Waiting for Parts",
        ISSUE_FIXED: "Issue Fixed",
        ISSUE_RESOLVED: "Issue Resolved",
        ASSET_RESTORED: "Asset Restored",
        getAllStatusAsArray: function () {
            return [
                OPTIONS.defaultStatus.ACTIVE,
                OPTIONS.defaultStatus.INACTIVE,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REJECTED
            ];
        },
        getAllTaskScheduledStatusAsArray: function () {
            return [
                OPTIONS.defaultStatus.SCHEDULED,
                OPTIONS.defaultStatus.COMPLETED,
                OPTIONS.defaultStatus.ON_HOLD,
                OPTIONS.defaultStatus.CANCELLED
            ];
        },
        getAllWorkOrderGenerationStatusAsArray: function () {
            return [OPTIONS.defaultStatus.OPEN, OPTIONS.defaultStatus.IN_PROGRESS, OPTIONS.defaultStatus.COMPLETED];
        },
        getAllCNStatusAsArray: function () {
            return [
                OPTIONS.defaultStatus.AWAITING_APPROVAL,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REJECTED,
                OPTIONS.defaultStatus.REPORT_GENERATED,
                OPTIONS.defaultStatus.CLOSED
            ];
        },
        getCommonStatusAsArray: function () {
            return [OPTIONS.defaultStatus.ACTIVE, OPTIONS.defaultStatus.INACTIVE];
        },
        getAllNPDStatusAsArray: function () {
            return [
                OPTIONS.defaultStatus.AWAITING_REVIEW,
                OPTIONS.defaultStatus.REVIEW_STARTED,
                OPTIONS.defaultStatus.PUT_ON_HOLD,
                OPTIONS.defaultStatus.TERMINATE,
                OPTIONS.defaultStatus.CLOSED
            ];
        },
        getAllSalesInvoiceStatusAsArray: function () {
            return [
                OPTIONS.defaultStatus.CREATED,
                OPTIONS.defaultStatus.CLOSED,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REJECTED,
                OPTIONS.defaultStatus.REPORT_GENERATED,
                OPTIONS.defaultStatus.CANCELLED
            ];
        },
        getAllDRNStatusArray: function () {
            return [
                OPTIONS.defaultStatus.CLOSED,
                OPTIONS.defaultStatus.CREATED,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REJECTED,
                OPTIONS.defaultStatus.CANCELLED
            ];
        },
        getAllShipmentPlanningStatusAsArray: function () {
            return [
                OPTIONS.defaultStatus.AWAITING_APPROVAL,
                OPTIONS.defaultStatus.INVOICED,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REJECTED,
                OPTIONS.defaultStatus.CLOSED,
                OPTIONS.defaultStatus.REPORT_GENERATED
            ];
        },
        getAllGRNStatusAsArray: function () {
            return [
                OPTIONS.defaultStatus.AWAITING_APPROVAL,
                OPTIONS.defaultStatus.REJECTED,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REPORT_GENERATED,
                OPTIONS.defaultStatus.GRN_PARTIAL_CREATED,
                OPTIONS.defaultStatus.GRN_CREATED,
                OPTIONS.defaultStatus.CLOSED,
                OPTIONS.defaultStatus.CANCELLED
            ];
        },
        getAllServiceInvoiceAsArray: function () {
            return [
                OPTIONS.defaultStatus.AWAITING_APPROVAL,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REPORT_GENERATED
            ];
        },
        getAllSalesOrderStatusAsArray: function () {
            return [
                OPTIONS.defaultStatus.CREATED,
                OPTIONS.defaultStatus.INVOICED,
                OPTIONS.defaultStatus.CANCELLED,
                OPTIONS.defaultStatus.CLOSED,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REPORT_GENERATED
            ];
        },
        getAllGRStatusAsArray: function () {
            return [OPTIONS.defaultStatus.OPENED, OPTIONS.defaultStatus.APPROVED, OPTIONS.defaultStatus.REJECTED];
        },
        getAllSIDashboardStatusAsArray: function () {
            return [OPTIONS.defaultStatus.CREATED, OPTIONS.defaultStatus.REJECTED];
        },
        getAllSODashboardStatusAsArray: function () {
            return [OPTIONS.defaultStatus.CREATED, OPTIONS.defaultStatus.CANCELLED];
        },
        getAllOutstandingPOReportsStatus: function () {
            return [
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REPORT_GENERATED,
                OPTIONS.defaultStatus.GRN_PARTIAL_CREATED,
                OPTIONS.defaultStatus.GRN_CREATED
            ];
        },
        getAllFilterStatusArray: function (array) {
            let statusArray = [];
            for (const ele of array) {
                statusArray.push(OPTIONS.defaultStatus[ele]);
            }
            return statusArray;
        },
        getAllCalibrationStandardStatusArray: function () {
            return [OPTIONS.defaultStatus.ACTIVE, OPTIONS.defaultStatus.INACTIVE, OPTIONS.defaultStatus.UNDER_REPAIR];
        }
    },
    paymentModes: {
        CREDIT: "credit",
        CASH: "cash",
        CARD: "card"
    },
    devicePlatforms: {
        ANDROID: "android",
        IOS: "ios",
        WEB: "web"
    },
    emailSubjects: {
        ACCOUNT_WELCOME: "Welcome mail",
        ACCOUNT_VERIFY: "Verification OTP",
        ACCOUNT_ACTIVATE: "Activate your account",
        FORGOT_PASSWORD: "Change your password"
    },
    notificationMode: {
        NOTIFICATION_TRIGGER_ALL: "notification_trigger_all",
        NOTIFICATION_TRIGGER_EMAIL: "notification_trigger_email",
        NOTIFICATION_TRIGGER_IN_APP: "notification_trigger_in_app"
    },
    notificationType: {
        FOLLOW_USER: "follow_user",
        NEW_POST: "new_post"
    },
    topicARNS: {
        globalNotificationARN: "NotificationsTopic",
        postNewLikeARN: "postNewLike",
        followARN: "FollowTopic",
        newPostARN: "newPostTopic",
        walletARN: "TransactionPoint"
    },
    userPreferences: {
        mobileNumber: {
            name: "MOBILE_NUMBER",
            title: "Mobile Number",
            description: "Are you sure you want to show Mobile Number"
        },
        profilePicture: {
            name: "PROFILE_PICTURE",
            title: "Profile Picture",
            description: "Are you sure you want to show profile picture"
        },
        email: {
            name: "EMAIL",
            title: "Email",
            description: "Are you sure you want to show your email"
        },
        getAsArray: () => {
            return [
                options.userPreferences.mobileNumber,
                options.userPreferences.profilePicture,
                options.userPreferences.email
            ];
        }
    },
    falsyArray: [null, undefined, "", "null", "undefined", NaN],
    roleData: {
        company: companyId,
        roleCode: "R0001",
        roleName: "Super Admin"
    },
    companyData: {
        _id: companyId,
        companyCIN: "-",
        companyUdyogAadhar: "-",
        companyURD: "-",
        companyMSMENo: "-",
        companyContactPersonAltNum: "1234567890",
        companyContactPersonEmail: "admin@gamil.com",
        companyTelNo: "-",
        companyWebsite: "www.s2pedutech.in",
        isCompanyActive: true,
        companyBefName: "",
        companyBankName: "-",
        companyAccountNumber: "-",
        companyAccType: "-",
        companyBankIFSCCode: "-",
        companyCode: "C0001",
        companyName: "S2P EDUTECH PRODUCTS PVT. LTD.",
        companyNickName: "S2P EDUTECH",
        companyCategory: "PVT LTD",
        GSTIN: "29AACCV1342H1ZE",
        companyPAN: "AACCV1342H",
        contactPersonName: "MR.NAGENDRA",
        companyContactPersonDesignation: "PURCHASE",
        companyContactPersonNumber: "9008490215",
        companyAddress: [
            {
                addressLine3: "",
                addressType: "Billing",
                addressLine1: "SY. NO 230/231/2, NH4A",
                addressLine2: "BELGAUM - KHANAPUR ROAD",
                state: "KARNATAKA",
                city: "BELGAUM",
                district: "DESUR",
                pinCode: "590014",
                country: "India"
            },
            {
                addressLine3: "",
                addressType: "Shipping",
                addressLine1: "SY. NO 230/231/2, NH4A",
                addressLine2: "BELGAUM - KHANAPUR ROAD",
                state: "KARNATAKA",
                city: "BELGAUM",
                district: "DESUR",
                pinCode: "590014",
                country: "India"
            }
        ]
    },
    superAdminData: {
        company: companyId,
        email: "spadmin@gmail.com",
        mobile: "7656868723",
        resetPin: 2023,
        isActive: true,
        lastLoggedIn: null,
        userCode: "U0001",
        name: "Super Admin",
        password: "spadmin@2024",
        userId: 1,
        userDevice: "DESKTOP",
        userIP: "103.199.224.112"
    }
};
const generateCreateData = async (createObj, requestBody) => {
    for (let i = Object.keys(requestBody).length - 1; i >= 0; i--) {
        let key = Object.keys(requestBody)[i];
        if (requestBody[key] && typeof requestBody[key] == "object") {
            for (let j = Object.keys(requestBody[key]).length - 1; j >= 0; j--) {
                let innerKey = Object.keys(requestBody[key])[j];
                createObj[key][innerKey] = requestBody[key][innerKey];
            }
        } else if (requestBody[key] && typeof requestBody[key] == "object") {
        } else {
            createObj[key] = requestBody[key];
        }
    }
    return createObj;
};
const getMatchData = async (project, search) => {
    let match = {};
    if (!!search) {
        match["$or"] = [];
        for (let i = 0; i < Object.keys(project).length; i++) {
            const key = Object.keys(project)[i];
            match["$or"].push({[key]: {$regex: `${search}`, $options: "i"}});
        }
    }
    return match;
};
const generateURl = filePath => {
    return filePath ? CONSTANTS.CDNWebStatic + "/" + filePath : null;
};
const generateOTP = length => {
    if (CONSTANTS.environment === "development") {
        // TODO remove after sms integration
        return length > 4 ? 4444 : 4444;
    }
    return length > 4 ? Math.floor(10000 + Math.random() * 90000) : Math.floor(1000 + Math.random() * 9000);
};

const genAbsoluteUrl = (path, type, opt) => {
    switch (type) {
        case "admin":
            return CONSTANTS.clientReqProtocol + "://" + CONSTANTS.adminHost + path;
        default:
            return CONSTANTS.clientReqProtocol + "://" + CONSTANTS.customerHost + path;
    }
};

module.exports = {
    OPTIONS,
    generateURl,
    generateOTP,
    genAbsoluteUrl,
    generateCreateData,
    getMatchData
};

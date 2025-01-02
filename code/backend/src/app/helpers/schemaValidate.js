const {body, param, query, validationResult} = require("express-validator");
const {OPTIONS, generateURl} = require("../helpers/global.options");

exports.schemaValidation = {
    // create: [
    // body("FIRST_NAME", "FIRST_NAME must not be empty.").exists(),
    // body("LAST_NAME", "LAST_NAME must not be empty.").exists(),
    // body("EMAIL", "EMAIL must not be empty.").exists().isEmail(),
    // body("ROLE", "ROLE must not be empty.").exists(),
    // body("PASSWORD", "PASSWORD must not be empty.")
    // .exists()
    // .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,25}$/, "i")
    // .withMessage(
    //     "At least 1 upper  const, lower  const, numeric, and special character must be EMBEDDED. Passwords must be at least 8 characters in length but can not be more than 25 characters in length."
    // ),
    // ],
    checkParamId: [param("id", "Please enter valid Id").exists()],
    updateProfile: [],
    login: [body("email", "Please enter email").exists(), body("password", "Please enter password").exists()],
    loginShop: [body("mobile", "Please enter mobile").exists(), body("password", "Please enter password").exists()],
    register: [body("mobile", "Please enter mobile").exists(), body("password", "Please enter password").exists()],
    loginCustomer: [body("mobile", "Please enter mobile").exists(), body("password", "Please enter password").exists()],
    createCustomer: [
        body("firstName", "Please enter firstName").exists(),
        body("lastName", "Please enter lastName").exists(),
        body("mobile", "Please enter mobile").exists()
    ],
    updateCustomer: [
        body("firstName", "Please enter firstName").exists(),
        body("lastName", "Please enter lastName").exists(),
        body("mobile", "Please enter mobile").exists()
    ],
    createShop: [
        body("firstName", "Please enter firstName").exists(),
        body("lastName", "Please enter lastName").exists(),
        body("mobile", "Please enter mobile").exists()
    ],
    createAdvertise: [
        body("title", "Please enter title").exists(),
        body("description", "Please enter description").exists(),
        body("status", "Please enter status").exists(),
        body("startDate", "Please enter startDate").exists(),
        body("endDate", "Please enter endDate").exists()
    ],
    updateAdvertise: [
        body("title", "Please enter title").exists(),
        body("description", "Please enter description").exists(),
        body("status", "Please enter status").exists(),
        body("startDate", "Please enter startDate").exists(),
        body("endDate", "Please enter endDate").exists()
    ],
    createBusinessType: [
        body("name", "Please enter name").exists(),
        body("description", "Please enter description").exists(),
        body("status", "Please enter status").exists()
    ],
    updateBusinessType: [
        param("id", "Please enter valid Id").exists(),
        body("name", "Please enter name").exists(),
        body("description", "Please enter description").exists(),
        body("status", "Please enter status").exists()
    ],
    createCategory: [
        body("name", "Please enter name").exists(),
        body("description", "Please enter description").exists(),
        body("status", "Please enter status").exists()
    ],
    updateCategory: [
        body("name", "Please enter name").exists(),
        body("description", "Please enter description").exists(),
        body("status", "Please enter status").exists()
    ],
    createSubCategory: [
        body("categoryId", "Please enter categoryId").exists(),
        body("name", "Please enter name").exists(),
        body("description", "Please enter description").exists(),
        body("status", "Please enter status").exists()
    ],
    updateSubCategory: [
        body("categoryId", "Please enter categoryId").exists(),
        body("name", "Please enter name").exists(),
        body("description", "Please enter description").exists(),
        body("status", "Please enter status").exists()
    ],
    createOffer: [
        body("title", "Please enter title").exists(),
        body("description", "Please enter description").exists(),
        body("status", "Please enter status").exists(),
        body("startDate", "Please enter startDate").exists(),
        body("endDate", "Please enter endDate").exists()
    ],
    updateOffer: [
        body("title", "Please enter title").exists(),
        body("description", "Please enter description").exists(),
        body("status", "Please enter status").exists(),
        body("startDate", "Please enter startDate").exists(),
        body("endDate", "Please enter endDate").exists()
    ],
    createCatalogue: [
        body("subCategoryId", "Please enter subCategoryId").exists(),
        body("title", "Please enter title").exists(),
        body("description", "Please enter description").exists(),
        body("price", "Please enter price").exists(),
        body("status", "Please enter status").exists()
    ],
    updateCatalogue: [
        body("subCategoryId", "Please enter subCategoryId").exists(),
        body("title", "Please enter title").exists(),
        body("description", "Please enter description").exists(),
        body("price", "Please enter price").exists(),
        body("status", "Please enter status").exists()
    ],

    updateUniversity: [
        param("id", "Please enter valid Id").exists().isInt(),
        body("universityName", "Please enter university name").exists(),
        body("type", "Please enter Type")
            .exists()
            .isIn(["Regular", "Deemed"])
            .withMessage("Enter Regular or Deemed only")
    ],
    createCollege: [
        body("universityId", "Please enter universityId").exists(),
        body("collegeName", "Please enter collegeName").exists(),
        body("code", "Please enter code").exists()
    ],
    updateCollege: [
        param("id", "Please enter valid Id").exists().isInt(),
        body("universityId", "Please enter universityId").exists(),
        body("collegeName", "Please enter collegeName").exists(),
        body("code", "Please enter code").exists()
    ],
    createBranches: [
        body("branchName", "Please enter branch name").exists(),
        body("description", "Please enter Description").exists(),
        body("abbreviation", "Please enter abbreviation").exists()
    ],
    updateBranches: [
        param("id", "Please enter valid Id").exists().isInt(),
        body("branchName", "Please enter branch name").exists()
    ],
    createCollegeBranchMappings: [
        body("collegeId", "Please enter college id").exists(),
        body("branchId", "Please enter branch id").exists()
    ],
    updateCollegeBranchMappings: [
        param("id", "Please enter valid Id").exists().isInt(),
        body("collegeId", "Please enter college id").exists(),
        body("branchId", "Please enter branch id").exists()
    ],
    createSemester: [body("semesterName", "Please enter semester name").exists()],
    updateSemester: [
        param("id", "Please enter valid Id").exists().isInt(),
        body("semesterName", "Please enter semester name").exists()
    ],
    createBranchSemesterMappings: [
        body("semesterId", "Please enter semester id").exists(),
        body("branchId", "Please enter branch id").exists()
    ],
    updateBranchSemesterMappings: [
        param("id", "Please enter valid Id").exists().isInt(),
        body("semesterId", "Please enter semester id").exists(),
        body("branchId", "Please enter branch id").exists()
    ],
    // createSubject: [
    //   body('universityId', 'Please enter universityId').exists(),
    //   body('branchId', 'Please enter branch id').exists(),
    //   body('semesterId', 'Please enter semester id').exists(),
    //   body('code', 'Please enter subject code').exists(),
    //   body('subjectName', 'Please enter subject name').exists(),
    //   body('type', 'Please enter subject type')
    //     .exists()
    //     .isIn([OPTIONS.subjectType.PRACTICAL, OPTIONS.subjectType.THEORY])
    //     .withMessage(
    //       `Enter ${OPTIONS.subjectType.PRACTICAL} or ${OPTIONS.subjectType.THEORY} only`
    //     ),
    //   body('description', 'Please enter subject description').optional(),
    // ],
    // updateSubject: [
    //   param('id', 'Please enter valid Id').exists().isInt(),
    //   body('universityId', 'Please enter universityId').exists(),
    //   body('branchId', 'Please enter branch id').exists(),
    //   body('semesterId', 'Please enter semester id').exists(),
    //   body('code', 'Please enter subject code').exists(),
    //   body('type', 'Please enter subject type')
    //     .exists()
    //     .isIn([OPTIONS.subjectType.PRACTICAL, OPTIONS.subjectType.THEORY])
    //     .withMessage(
    //       `Enter ${OPTIONS.subjectType.PRACTICAL} or ${OPTIONS.subjectType.THEORY} only`
    //     ),
    //   body('description', 'Please enter subject description').optional(),
    // ],
    // createSyllabus: [body('subjectId', 'Please enter subject id').exists()],
    // updateSyllabus: [
    //   param('id', 'Please enter valid Id').exists().isInt(),
    //   body('subjectId', 'Please enter subject id').exists(),
    // ],
    // createSubjectQuePaper: [
    //   body('subjectId', 'Please enter subject id').exists(),
    //   body('year', 'Please enter year').exists(),
    // ],
    // updateSubjectQuePaper: [
    //   param('id', 'Please enter valid Id').exists().isInt(),
    //   body('subjectId', 'Please enter subject id').exists(),
    //   body('year', 'Please enter year').exists(),
    // ],
    createChapter: [
        body("subjectId", "Please enter subject id").exists(),
        body("chapterName", "Please enter chapter name").exists(),
        body("content", "Please enter content").exists(),
        body("description", "Please enter description").optional()
    ],
    updateChapter: [
        param("id", "Please enter valid Id").exists().isInt(),
        body("subjectId", "Please enter subject id").exists(),
        body("chapterName", "Please enter chapter name").exists(),
        body("content", "Please enter content").exists(),
        body("description", "Please enter description").optional()
    ],
    createChapterFile: [body("chapterId", "Please enter chapter id").exists()],
    updateChapterFile: [
        param("id", "Please enter valid Id").exists().isInt(),
        body("chapterId", "Please enter chapter id").exists()
    ],
    createStudent: [
        body("collegeId", "Please enter college id").exists(),
        body("branchId", "Please enter branch id").exists(),
        body("studentName", "Please enter name").exists(),
        body("admissionYear", "Please enter admission Year").optional(),
        body("mobile", "Please enter mobile").exists(),
        body("email", "Please enter email").exists(),
        body("password", "Please enter password").exists(),
        body("enrollNo", "Please enter enroll no.").exists(),
        body("passingYear", "Please enter passing year").optional(),
        body("dob", "Please enter dob").optional(),
        body("address", "Please enter address").optional(),
        body("languages", "Please enter languages").optional()
    ],
    updateStudent: [
        param("id", "Please enter valid Id").exists().isInt(),
        body("collegeId", "Please enter college id").exists(),
        body("branchId", "Please enter branch id").exists(),
        body("studentName", "Please enter name").exists(),
        body("admissionYear", "Please enter admission year").optional(),
        body("mobile", "Please enter mobile").exists(),
        body("email", "Please enter email").exists(),
        body("enrollNo", "Please enter enroll no.").exists(),
        body("passingYear", "Please enter passing year").optional(),
        body("dob", "Please enter dob").optional(),
        body("address", "Please enter address").optional(),
        body("languages", "Please enter languages").optional()
    ],
    createStudentSemesterMappings: [
        body("semesterId", "Please enter semester id").exists(),
        body("studentId", "Please enter student id").exists(),
        body("result", "Please enter result").exists(),
        body("backlog", "Please enter backlog").optional(),
        body("percentage", "Please enter percentage").exists(),
        body("CGPA", "Please enter CGPA").exists()
    ],
    updateStudentSemesterMappings: [
        param("id", "Please enter valid Id").exists().isInt(),
        body("semesterId", "Please enter semester id").exists(),
        body("studentId", "Please enter student id").exists(),
        body("result", "Please enter result").exists(),
        body("backlog", "Please enter backlog").optional(),
        body("percentage", "Please enter percentage").exists(),
        body("CGPA", "Please enter CGPA").exists()
    ],
    createProject: [
        body("studentId", "Please enter student id").exists(),
        body("type", "Please enter type").exists(),
        body("topic", "Please enter topic").exists(),
        body("abstract", "Please enter abstract").exists(),
        body("role", "Please enter role").exists(),
        body("aim", "Please enter aim").exists(),
        body("group", "Please enter group").exists()
    ],
    updateProject: [
        param("id", "Please enter valid Id").exists().isInt(),
        body("studentId", "Please enter student id").exists(),
        body("type", "Please enter type").exists(),
        body("topic", "Please enter topic").exists(),
        body("abstract", "Please enter abstract").exists(),
        body("role", "Please enter role").exists(),
        body("aim", "Please enter aim").exists(),
        body("group", "Please enter group").exists()
    ]
    // Mobile App
    // register: [
    //   body('mobile', 'Please enter mobile').exists(),
    //   body('gender', 'Please enter gender').exists(),
    //   body('email', 'Please enter email').exists(),
    //   body('stateId', 'Please enter state').exists(),
    //   body('districtId', 'Please enter districtId').exists(),
    //   body('aadharNo', 'Please enter aadharNo').exists(),
    // ],
};

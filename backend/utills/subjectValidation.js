
const subjectValidationStrategies = {

    // Validate subject name
    validateSubjectName: (data) => {
        if (
            typeof data.subject_name !== "string" ||
            data.subject_name.trim() === ""
        ) {
            return "Subject name is required.";
        }

        if (data.subject_name.trim().length > 100) {
            return "Subject name cannot exceed 100 characters.";
        }

        return null;
    },

    // Validate subject code
    validateSubjectCode: (data) => {
        const code = data.subject_code;

        if (code != null && code !== "") {
            if (typeof code !== "string") {
                return "Subject code must be a string.";
            }

            if (code.trim().length > 30) {
                return "Subject code cannot exceed 30 characters.";
            }
        }

        return null;
    },

    // Validate class ID
    validateClassId: (data) => {
        const id = data.class_id;

        if (id !== undefined && id !== null && id !== "") {
            if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
                return "Class ID must be a positive integer.";
            }
        }

        return null;
    }
};

// Context function: execute validation strategies
const validateSubject = (data) => {

    const strategies = [
        subjectValidationStrategies.validateSubjectName,
        subjectValidationStrategies.validateSubjectCode,
        subjectValidationStrategies.validateClassId
    ];

    for (const strategy of strategies) {
        const error = strategy(data);

        if (error) {
            return error;
        }
    }

    return null;
};

module.exports = {
    subjectValidationStrategies,
    validateSubject
};

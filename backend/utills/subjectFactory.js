
class SubjectFactory {
    // Create a new subject object
    static createSubject(data) {
        return {
            subject_name: data.subject_name.trim(),

            subject_code:
                typeof data.subject_code === "string" &&
                data.subject_code.trim() !== ""
                    ? data.subject_code.trim()
                    : null,

            class_id:
                data.class_id === undefined ||
                data.class_id === null ||
                data.class_id === ""
                    ? null
                    : Number(data.class_id)
        };
    }

    // Create a standardized subject update object
    static updateSubject(data) {
        return this.createSubject(data);
    }
}

module.exports = SubjectFactory;

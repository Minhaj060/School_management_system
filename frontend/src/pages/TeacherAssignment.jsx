
import { useEffect, useState } from "react";
import API from "../api/axios";
import "./TeacherAssignment.css";

export default function TeacherAssignment() {
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [assignments, setAssignments] = useState([]);

    const [form, setForm] = useState({
        teacher_id: "",
        class_id: "",
        section_id: "",
        subject_id: ""
    });

    const [editId, setEditId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [t, c, s, sub, a] = await Promise.all([
                API.get("/teachers"),
                API.get("/classes"),
                API.get("/sections"),
                API.get("/subjects"),
                API.get("/teacher-assignments")
            ]);

            const getData = (response) =>
                Array.isArray(response.data)
                    ? response.data
                    : response.data?.data || [];

            setTeachers(getData(t).filter(x => x.status === "active"));
            setClasses(getData(c).filter(x => x.status === "active"));
            setSections(getData(s));
            setSubjects(getData(sub));
            setAssignments(getData(a));

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load assignment data."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredSections = sections.filter(
        s => String(s.class_id) === String(form.class_id)
    );

    const filteredSubjects = subjects.filter(
        s => !s.class_id || String(s.class_id) === String(form.class_id)
    );

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value,
            ...(name === "class_id"
                ? { section_id: "", subject_id: "" }
                : {})
        }));
    };

    const resetForm = () => {
        setForm({
            teacher_id: "",
            class_id: "",
            section_id: "",
            subject_id: ""
        });

        setEditId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        try {
            setSaving(true);

            if (editId) {
                await API.put(`/teacher-assignments/${editId}`, form);
                setMessage("Assignment updated successfully.");
            } else {
                await API.post("/teacher-assignments", form);
                setMessage("Teacher assigned successfully.");
            }

            resetForm();
            await loadData();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Operation failed."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item) => {
        setForm({
            teacher_id: String(item.teacher_id),
            class_id: String(item.class_id),
            section_id: String(item.section_id),
            subject_id: String(item.subject_id)
        });

        setEditId(item.assignment_id);
        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this assignment?"
        );

        if (!confirmDelete) return;

        try {
            setMessage("");
            setError("");

            await API.delete(`/teacher-assignments/${id}`);

            setMessage("Assignment deleted successfully.");

            if (editId === id) {
                resetForm();
            }

            await loadData();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Delete failed."
            );
        }
    };

    return (
        <div className="teacher-assignment">

            {/* Page Header */}
            <div className="teacher-assignment-header">
                <h2>Teacher Assignment</h2>
                <p>
                    Assign teachers to classes, sections and subjects.
                </p>
            </div>

            {/* Assignment Form */}
            <div className="ta-card">

                <h3>
                    {editId ? "Edit Teacher Assignment" : "Assign Teacher"}
                </h3>

                {message && (
                    <div className="ta-message ta-success">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="ta-message ta-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="ta-form-grid">

                        {/* Teacher */}
                        <div className="ta-form-group">
                            <label>Teacher *</label>

                            <select
                                name="teacher_id"
                                value={form.teacher_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Teacher</option>

                                {teachers.map(t => (
                                    <option
                                        key={t.teacher_id}
                                        value={t.teacher_id}
                                    >
                                        {t.full_name} ({t.employee_code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Class */}
                        <div className="ta-form-group">
                            <label>Class *</label>

                            <select
                                name="class_id"
                                value={form.class_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Class</option>

                                {classes.map(c => (
                                    <option
                                        key={c.class_id}
                                        value={c.class_id}
                                    >
                                        {c.class_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Section */}
                        <div className="ta-form-group">
                            <label>Section *</label>

                            <select
                                name="section_id"
                                value={form.section_id}
                                onChange={handleChange}
                                required
                                disabled={!form.class_id}
                            >
                                <option value="">Select Section</option>

                                {filteredSections.map(s => (
                                    <option
                                        key={s.section_id}
                                        value={s.section_id}
                                    >
                                        {s.section_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Subject */}
                        <div className="ta-form-group">
                            <label>Subject *</label>

                            <select
                                name="subject_id"
                                value={form.subject_id}
                                onChange={handleChange}
                                required
                                disabled={!form.class_id}
                            >
                                <option value="">Select Subject</option>

                                {filteredSubjects.map(s => (
                                    <option
                                        key={s.subject_id}
                                        value={s.subject_id}
                                    >
                                        {s.subject_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>

                    {/* Buttons */}
                    <div className="ta-actions">

                        <button
                            type="submit"
                            className="ta-btn ta-btn-primary"
                            disabled={saving}
                        >
                            {saving
                                ? "Please wait..."
                                : editId
                                    ? "Update Assignment"
                                    : "Assign Teacher"}
                        </button>

                        {editId && (
                            <button
                                type="button"
                                className="ta-btn ta-btn-secondary"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        )}

                    </div>

                </form>
            </div>

            {/* Assignment List */}
            <div className="ta-card">

                <h3>Assigned Teachers</h3>

                {loading ? (
                    <p>Loading assignments...</p>
                ) : (
                    <div className="ta-table-wrapper">

                        <table className="ta-table">

                            <thead>
                                <tr>
                                    <th>Teacher</th>
                                    <th>Class</th>
                                    <th>Section</th>
                                    <th>Subject</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                {assignments.map(item => (
                                    <tr key={item.assignment_id}>

                                        <td>{item.teacher_name}</td>
                                        <td>{item.class_name}</td>
                                        <td>{item.section_name}</td>
                                        <td>{item.subject_name}</td>

                                        <td>
                                            <button
                                                className="ta-btn ta-btn-edit"
                                                onClick={() => handleEdit(item)}
                                            >
                                                Edit
                                            </button>

                                            {" "}

                                            <button
                                                className="ta-btn ta-btn-delete"
                                                onClick={() =>
                                                    handleDelete(item.assignment_id)
                                                }
                                            >
                                                Delete
                                            </button>
                                        </td>

                                    </tr>
                                ))}

                                {assignments.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="ta-empty"
                                        >
                                            No teacher assignments found.
                                        </td>
                                    </tr>
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
}


import { useEffect, useState } from 'react'
import API from '../api/axios'
import './Students.css'

function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')

  const initialFormData = {
    student_code: '',
    full_name: '',
    gender: 'male',
    phone: '',
    email: '',
    blood_group: '',
    address: '',
    class_id: '',
    section_id: '',
    roll_number: '',
    guardian_name: '',
    guardian_phone: '',
    admission_date: new Date().toISOString().split('T')[0],
  }

  const [formData, setFormData] = useState(initialFormData)

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await API.get('/students')
      setStudents(response.data.data || [])
    } catch (err) {
      setError('Unable to load students. Please check the backend server.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
    setSuccess('')
  }

  const resetForm = () => {
    setFormData({ ...initialFormData })
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  const openAddForm = () => {
    resetForm()
    setShowForm(true)
  }

  const editStudent = (student) => {
    setEditingId(student.student_id)

    setFormData({
      student_code: student.student_code || '',
      full_name: student.full_name || '',
      gender: student.gender || 'male',
      phone: student.phone || '',
      email: student.email || '',
      blood_group: student.blood_group || '',
      address: student.address || '',
      class_id: student.class_id || '',
      section_id: student.section_id || '',
      roll_number: student.roll_number || '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      admission_date: student.admission_date
        ? String(student.admission_date).split('T')[0]
        : '',
    })

    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const validateForm = () => {
    if (!formData.student_code.trim()) {
      return 'Student Code is required.'
    }

    if (!formData.full_name.trim()) {
      return 'Student Name is required.'
    }

    const phoneRegex = /^01[3-9]\d{8}$/

    if (formData.phone && !phoneRegex.test(formData.phone)) {
      return 'Enter a valid 11-digit Bangladesh phone number.'
    }

    if (formData.guardian_phone && !phoneRegex.test(formData.guardian_phone)) {
      return 'Enter a valid guardian phone number.'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (formData.email && !emailRegex.test(formData.email)) {
      return 'Enter a valid email address.'
    }

    const numberFields = ['class_id', 'section_id', 'roll_number']

    for (const field of numberFields) {
      if (
        formData[field] &&
        (!Number.isInteger(Number(formData[field])) ||
          Number(formData[field]) <= 0)
      ) {
        return `${field.replace('_', ' ')} must be a positive number.`
      }
    }

    return ''
  }

  const saveStudent = async (e) => {
    e.preventDefault()

    const validationMessage = validateForm()

    if (validationMessage) {
      setError(validationMessage)
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const payload = {
        ...formData,
        class_id: formData.class_id ? Number(formData.class_id) : null,
        section_id: formData.section_id ? Number(formData.section_id) : null,
        roll_number: formData.roll_number ? Number(formData.roll_number) : null,
      }

      if (editingId !== null) {
        await API.put(`/students/${editingId}`, payload)
        setSuccess('Student updated successfully!')
      } else {
        await API.post('/students', payload)
        setSuccess('Student added successfully!')
      }

      resetForm()
      await fetchStudents()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save student.')
    } finally {
      setSaving(false)
    }
  }

  const deleteStudent = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this student?'
    )

    if (!confirmed) return

    try {
      setError('')
      setSuccess('')
      await API.delete(`/students/${id}`)
      setSuccess('Student deleted successfully!')
      await fetchStudents()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student.')
    }
  }

  const query = search.trim().toLowerCase()

  const exactIdMatches = /^\d+$/.test(query)
    ? students.filter(
        (student) => String(student.student_id) === query
      )
    : []

  const filteredStudents =
    exactIdMatches.length > 0
      ? exactIdMatches
      : students.filter((student) => {
          if (!query) return true

          const fields = [
            student.student_id,
            student.student_code,
            student.full_name,
            student.gender,
            student.phone,
            student.email,
            student.blood_group,
            student.class_id,
            student.section_id,
            student.roll_number,
            student.guardian_name,
            student.guardian_phone,
            student.status,
          ]

          return fields.some((value) =>
            String(value ?? '').toLowerCase().includes(query)
          )
        })

  return (
    <div className="student-page">

      {/* Page Header */}
      <div className="student-page-header">
        <div>
          <h1>Student Management</h1>
          <p>Manage all registered students</p>
        </div>

        <button
          className="student-add-btn"
          onClick={showForm ? resetForm : openAddForm}
        >
          + Add Student
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="student-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="student-alert success">
          {success}
        </div>
      )}

      {/* Student Form */}
      {showForm && (
        <div className="student-form-card">

          <div className="student-form-heading">
            <h2>
              {editingId !== null ? 'Update Student' : 'Add New Student'}
            </h2>

            <button type="button" onClick={resetForm}>
              ✕
            </button>
          </div>

          <form onSubmit={saveStudent}>

            <div className="student-form-grid">

              <div className="student-field">
                <label>Student Code *</label>
                <input
                  name="student_code"
                  value={formData.student_code}
                  onChange={handleChange}
                  placeholder="e.g. STU003"
                  required
                />
              </div>

              <div className="student-field">
                <label>Full Name *</label>
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter student name"
                  required
                />
              </div>

              <div className="student-field">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="student-field">
                <label>Phone</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01XXXXXXXXX"
                />
              </div>

              <div className="student-field">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                />
              </div>

              <div className="student-field">
                <label>Blood Group</label>
                <input
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  placeholder="e.g. A+"
                />
              </div>

              <div className="student-field">
                <label>Class ID</label>
                <input
                  type="number"
                  min="1"
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleChange}
                />
              </div>

              <div className="student-field">
                <label>Section ID</label>
                <input
                  type="number"
                  min="1"
                  name="section_id"
                  value={formData.section_id}
                  onChange={handleChange}
                />
              </div>

              <div className="student-field">
                <label>Roll Number</label>
                <input
                  type="number"
                  min="1"
                  name="roll_number"
                  value={formData.roll_number}
                  onChange={handleChange}
                />
              </div>

              <div className="student-field">
                <label>Admission Date</label>
                <input
                  type="date"
                  name="admission_date"
                  value={formData.admission_date}
                  onChange={handleChange}
                />
              </div>

              <div className="student-field">
                <label>Guardian Name</label>
                <input
                  name="guardian_name"
                  value={formData.guardian_name}
                  onChange={handleChange}
                />
              </div>

              <div className="student-field">
                <label>Guardian Phone</label>
                <input
                  name="guardian_phone"
                  value={formData.guardian_phone}
                  onChange={handleChange}
                  placeholder="01XXXXXXXXX"
                />
              </div>

              <div className="student-field full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

            </div>

            <div className="student-form-actions">
              <button
                type="button"
                className="student-cancel-btn"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="student-save-btn"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId !== null
                    ? 'Update Student'
                    : 'Save Student'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Student List */}
      <div className="student-list-card">

        <div className="student-list-heading">
          <div>
            <h2>Student List</h2>
            <p>Total Students: {students.length}</p>
          </div>

          <input
            type="text"
            className="student-search"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="student-empty">
            Loading students...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="student-empty">
            {error ? 'Unable to display students.' : 'No matching students found.'}
          </div>
        ) : (
          <div className="student-table-wrapper">
            <table className="student-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student Code</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Roll</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.student_id}>
                    <td>{student.student_id}</td>
                    <td>{student.student_code}</td>
                    <td>{student.full_name}</td>
                    <td>{student.gender || 'N/A'}</td>
                    <td>{student.phone || 'N/A'}</td>
                    <td>{student.email || 'N/A'}</td>
                    <td>{student.class_id || 'N/A'}</td>
                    <td>{student.section_id || 'N/A'}</td>
                    <td>{student.roll_number || 'N/A'}</td>
                    <td>{student.status || 'N/A'}</td>
                    <td>
                      <div className="student-action-buttons">
                        <button
                          className="student-edit-btn"
                          onClick={() => editStudent(student)}
                        >
                          Edit
                        </button>

                        <button
                          className="student-delete-btn"
                          onClick={() => deleteStudent(student.student_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}

export default Students


import { useEffect, useState } from 'react'
import API from '../api/axios'
import './Teachers.css'

const initialForm = {
  employee_code: '',
  full_name: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  joining_date: '',
  designation: '',
  salary: ''
}

function Teachers() {
  const [teachers, setTeachers] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const response = await API.get('/teachers')
      setTeachers(response.data.data || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teachers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  // Form input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // Reset form
  const resetForm = () => {
    setFormData(initialForm)
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  // Form validation
  const validateForm = () => {
    if (!formData.employee_code.trim()) {
      return 'Employee code is required.'
    }

    if (formData.employee_code.trim().length > 30) {
      return 'Employee code cannot exceed 30 characters.'
    }

    if (!formData.full_name.trim()) {
      return 'Teacher name is required.'
    }

    if (formData.full_name.trim().length > 100) {
      return 'Name cannot exceed 100 characters.'
    }

    if (
      formData.gender &&
      !['male', 'female', 'other'].includes(formData.gender)
    ) {
      return 'Please select a valid gender.'
    }

    if (formData.phone.trim().length > 20) {
      return 'Phone number cannot exceed 20 characters.'
    }

    if (formData.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailPattern.test(formData.email.trim())) {
        return 'Please enter a valid email.'
      }
    }

    if (formData.email.trim().length > 100) {
      return 'Email cannot exceed 100 characters.'
    }

    if (formData.designation.trim().length > 100) {
      return 'Designation cannot exceed 100 characters.'
    }

    if (
      formData.salary !== '' &&
      (!Number.isFinite(Number(formData.salary)) ||
        Number(formData.salary) < 0)
    ) {
      return 'Salary must be a valid non-negative number.'
    }

    return ''
  }

  // Add or update teacher
  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      employee_code: formData.employee_code.trim(),
      full_name: formData.full_name.trim(),
      gender: formData.gender || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      address: formData.address.trim() || null,
      joining_date: formData.joining_date || null,
      designation: formData.designation.trim() || null,
      salary: formData.salary === '' ? null : Number(formData.salary)
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (editingId !== null) {
        await API.put(`/teachers/${editingId}`, payload)
        setSuccess('Teacher updated successfully.')
      } else {
        await API.post('/teachers', payload)
        setSuccess('Teacher added successfully.')
      }

      resetForm()
      await fetchTeachers()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to save teacher.'
      )
    } finally {
      setSaving(false)
    }
  }

  // Edit teacher
  const handleEdit = (teacher) => {
    setFormData({
      employee_code: teacher.employee_code || '',
      full_name: teacher.full_name || '',
      gender: teacher.gender || '',
      phone: teacher.phone || '',
      email: teacher.email || '',
      address: teacher.address || '',
      joining_date: teacher.joining_date
        ? String(teacher.joining_date).slice(0, 10)
        : '',
      designation: teacher.designation || '',
      salary: teacher.salary ?? ''
    })

    setEditingId(teacher.teacher_id)
    setShowForm(true)
    setError('')
    setSuccess('')

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Delete teacher
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) {
      return
    }

    try {
      setError('')
      setSuccess('')

      await API.delete(`/teachers/${id}`)

      setSuccess('Teacher deleted successfully.')
      await fetchTeachers()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete teacher. This teacher may be linked to other records.'
      )
    }
  }

  // Search teachers
 const query = search.trim().toLowerCase()

const exactIdMatches = /^\d+$/.test(query)
  ? teachers.filter(
      (teacher) => String(teacher.teacher_id) === query
    )
  : []

const filteredTeachers =
  exactIdMatches.length > 0
    ? exactIdMatches
    : teachers.filter((teacher) => {
        if (!query) return true

        const teacherId = String(teacher.teacher_id ?? '').toLowerCase()
        const employeeCode = String(teacher.employee_code ?? '').toLowerCase()
        const fullName = String(teacher.full_name ?? '').toLowerCase()
        const phone = String(teacher.phone ?? '').toLowerCase()
        const email = String(teacher.email ?? '').toLowerCase()
        const designation = String(teacher.designation ?? '').toLowerCase()

        return (
          teacherId.includes(query) ||
          employeeCode.includes(query) ||
          fullName.includes(query) ||
          phone.includes(query) ||
          email.includes(query) ||
          designation.includes(query)
        )
      })
  return (
    <div className="teacher-page">

      {/* Header */}
      <div className="teacher-page-header">
        <div>
          <h1>Teacher Management</h1>
          <p>Manage your school's teaching staff.</p>
        </div>

        <button
          className="teacher-add-btn"
          onClick={() => {
            resetForm()
            setShowForm(true)
            setSuccess('')
          }}
        >
          + Add Teacher
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="teacher-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="teacher-alert success">
          {success}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="teacher-form-card">

          <div className="teacher-form-heading">
            <h2>{editingId !== null ? 'Edit Teacher' : 'Add New Teacher'}</h2>
            <button type="button" onClick={resetForm}>✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="teacher-form-grid">

              <div className="teacher-field">
                <label>Employee Code *</label>
                <input
                  name="employee_code"
                  value={formData.employee_code}
                  onChange={handleChange}
                  maxLength={30}
                  placeholder="e.g. TCH001"
                  required
                />
              </div>

              <div className="teacher-field">
                <label>Full Name *</label>
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="teacher-field">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="teacher-field">
                <label>Phone</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={20}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="teacher-field">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="example@email.com"
                />
              </div>

              <div className="teacher-field">
                <label>Designation</label>
                <input
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="e.g. Senior Teacher"
                />
              </div>

              <div className="teacher-field">
                <label>Joining Date</label>
                <input
                  type="date"
                  name="joining_date"
                  value={formData.joining_date}
                  onChange={handleChange}
                />
              </div>

              <div className="teacher-field">
                <label>Salary</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Enter salary"
                />
              </div>

              <div className="teacher-field full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter full address"
                />
              </div>

            </div>

            <div className="teacher-form-actions">
              <button
                type="button"
                className="teacher-cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="teacher-save-btn"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId !== null
                    ? 'Update Teacher'
                    : 'Save Teacher'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teacher List */}
      <div className="teacher-list-card">

        <div className="teacher-list-heading">
          <div>
            <h2>Teachers List</h2>
            <p>
              Showing {filteredTeachers.length} of {teachers.length} teachers
            </p>
          </div>

          <input
            className="teacher-search"
            type="text"
            placeholder="Search by ID, name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="teacher-empty">
            Loading teachers...
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="teacher-empty">
            {search.trim()
              ? 'No matching teachers found.'
              : 'No teachers available.'}
          </div>
        ) : (
          <div className="teacher-table-wrapper">

            <table className="teacher-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee Code</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Designation</th>
                  <th>Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.teacher_id}>
                    <td>{teacher.teacher_id}</td>
                    <td>{teacher.employee_code}</td>
                    <td>{teacher.full_name}</td>
                    <td>{teacher.gender || '-'}</td>
                    <td>{teacher.phone || '-'}</td>
                    <td>{teacher.email || '-'}</td>
                    <td>{teacher.designation || '-'}</td>
                    <td>
                      {teacher.salary == null
                        ? '-'
                        : Number(teacher.salary).toLocaleString()}
                    </td>

                    <td>
                      <div className="teacher-action-buttons">
                        <button
                          className="teacher-edit-btn"
                          onClick={() => handleEdit(teacher)}
                        >
                          Edit
                        </button>

                        <button
                          className="teacher-delete-btn"
                          onClick={() => handleDelete(teacher.teacher_id)}
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

export default Teachers

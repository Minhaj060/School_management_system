
import { useEffect, useState } from 'react'
import API from '../api/axios'

function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

const [formData, setFormData] = useState({
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
})

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
  const [formError, setFormError] = useState('')

const validateStudentForm = () => {
  if (!formData.student_code.trim()) {
    return 'Student Code is required.'
  }

  if (!formData.full_name.trim()) {
    return 'Student Name is required.'
  }

  // Bangladesh mobile number validation
  const phoneRegex = /^01[3-9]\d{8}$/

  if (formData.phone && !phoneRegex.test(formData.phone)) {
    return 'Enter a valid 11-digit Bangladesh phone number.'
  }

  if (
    formData.guardian_phone &&
    !phoneRegex.test(formData.guardian_phone)
  ) {
    return 'Enter a valid guardian phone number.'
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (formData.email && !emailRegex.test(formData.email)) {
    return 'Enter a valid email address.'
  }

  // Positive number validation
  const numberFields = [
    'class_id',
    'section_id',
    'roll_number'
  ]

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
  const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value,
  })

  setFormError('')
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
      ? student.admission_date.split('T')[0]
      : '',
  })

  setShowForm(true)
}
const updateStudent = async (e) => {
  e.preventDefault()
    const validationMessage = validateStudentForm()

  if (validationMessage) {
    setFormError(validationMessage)
    return
  }

  setFormError('')

  try {
    const payload = {
      ...formData,
      class_id: formData.class_id ? Number(formData.class_id) : null,
      section_id: formData.section_id ? Number(formData.section_id) : null,
      roll_number: formData.roll_number ? Number(formData.roll_number) : null,
    }

    await API.put(`/students/${editingId}`, payload)

    alert('Student updated successfully!')

    setShowForm(false)
    setEditingId(null)

    fetchStudents()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to update student.')
    console.error(err)
  }
}
const addStudent = async (e) => {
  e.preventDefault()
    const validationMessage = validateStudentForm()

  if (validationMessage) {
    setFormError(validationMessage)
    return
  }

  setFormError('')

  try {
    const payload = {
      ...formData,
      class_id: formData.class_id ? Number(formData.class_id) : null,
      section_id: formData.section_id ? Number(formData.section_id) : null,
      roll_number: formData.roll_number ? Number(formData.roll_number) : null,
    }

    await API.post('/students', payload)

    alert('Student added successfully!')
    setShowForm(false)
    setFormData({
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
    })

    fetchStudents()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to add student.')
    console.error(err)
  }
}

  const deleteStudent = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this student?'
    )

    if (!confirmDelete) return

    try {
      await API.delete(`/students/${id}`)
      alert('Student deleted successfully!')
      fetchStudents()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete student.')
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  return (
    <div className="dashboard-content">
      <div className="section-title student-heading">
        <div>
          <h2>Student Management</h2>
          <p>Manage all registered students</p>
        </div>

        <button
  className="add-student-btn"
  onClick={() => {
  setEditingId(null)
  setFormError('')
  setFormData({
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
  })
  setShowForm(!showForm)
}}
>
  + Add Student
</button>
      </div>
      
{showForm && (
  <div className="content-card student-form-card">
    <h3>{editingId ? 'Update Student' : 'Add New Student'}</h3>

    <form
  onSubmit={editingId ? updateStudent : addStudent}
  className="student-form"
>
    {formError && (
  <p className="error-message">
    {formError}
  </p>
)}
      <div className="form-group">
        <label>Student Code *</label>
        <input
          name="student_code"
          value={formData.student_code}
          onChange={handleChange}
          placeholder="e.g. STU003"
          required
        />
      </div>

      <div className="form-group">
        <label>Full Name *</label>
        <input
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          placeholder="Enter student name"
          required
        />
      </div>

      <div className="form-group">
        <label>Gender</label>
        <select name="gender" value={formData.gender} onChange={handleChange}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label>Phone</label>
        <input name="phone" value={formData.phone} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input name="email" type="email" value={formData.email} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Blood Group</label>
        <input name="blood_group" value={formData.blood_group} onChange={handleChange} placeholder="e.g. A+" />
      </div>

      <div className="form-group">
        <label>Class ID</label>
        <input name="class_id" type="number" value={formData.class_id} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Section ID</label>
        <input name="section_id" type="number" value={formData.section_id} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Roll Number</label>
        <input name="roll_number" type="number" value={formData.roll_number} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Admission Date</label>
        <input name="admission_date" type="date" value={formData.admission_date} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Guardian Name</label>
        <input name="guardian_name" value={formData.guardian_name} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Guardian Phone</label>
        <input name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} />
      </div>

      <div className="form-group full-width">
        <label>Address</label>
        <textarea name="address" value={formData.address} onChange={handleChange} />
      </div>

      <div className="form-actions">
        <button type="submit" className="add-student-btn">
          {editingId ? 'Update Student' : 'Save Student'}
        </button>

        <button
          type="button"
          className="cancel-btn"
         onClick={() => {
  setShowForm(false)
  setEditingId(null)
  setFormError('')
  setFormData({
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
  })
}}
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
)}


      <div className="content-card">
        <div className="student-table-header">
          <h3>Student List</h3>
          <span>Total Students: {students.length}</span>
        </div>

        {loading ? (
          <p className="table-message">Loading students...</p>
        ) : error ? (
          <div className="table-message error-message">
            {error}
            <button onClick={fetchStudents}>Retry</button>
          </div>
        ) : students.length === 0 ? (
          <p className="table-message">No students found.</p>
        ) : (
          <div className="table-responsive">
            <table className="student-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student Code</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.student_id}>
                    <td>{student.student_id}</td>
                    <td>{student.student_code}</td>
                    <td>{student.full_name}</td>
                    <td>{student.gender}</td>
                    <td>{student.phone || 'N/A'}</td>
                    <td>{student.class_id || 'N/A'}</td>
                    <td>
                      <span className="student-status">
                        {student.status}
                      </span>
                    </td>
                    <td>
  <div className="action-buttons">
    <button
      className="edit-btn"
      onClick={() => editStudent(student)}
    >
      Edit
    </button>

    <button
      className="delete-btn"
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

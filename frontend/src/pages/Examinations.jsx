
import React, { useEffect, useState } from 'react'
import API from '../api/axios'
import './Examinations.css'
import './ExamModules.css'

const Examinations = () => {
  const [exams, setExams] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    exam_name: '',
    class_id: '',
    academic_year: new Date().getFullYear().toString(),
    start_date: '',
    end_date: '',
    status: 'scheduled',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [examResponse, classResponse] = await Promise.all([
        API.get('/exams'),
        API.get('/classes'),
      ])

      setExams(examResponse.data.data || [])
      setClasses(classResponse.data.data || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to load examinations. Please check API permissions.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setSubmitting(true)

    try {
      const response = await API.post('/exams', {
        ...form,
        class_id: Number(form.class_id),
      })

      setMessage(response.data.message || 'Examination created successfully!')

      setForm({
        exam_name: '',
        class_id: '',
        academic_year: new Date().getFullYear().toString(),
        start_date: '',
        end_date: '',
        status: 'scheduled',
      })

      await loadData()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to create examination.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this examination?'
    )

    if (!confirmed) return

    setMessage('')
    setError('')

    try {
      await API.delete(`/exams/${id}`)
      setMessage('Examination deleted successfully!')
      await loadData()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to delete examination.'
      )
    }
  }

  return (
    <div className="examinations-page">

      <div className="exam-page-header">
        <h2>Examinations Management</h2>
        <p>Create, organize and manage school examinations.</p>
      </div>

      {message && (
        <div className="exam-alert success">
          {message}
        </div>
      )}

      {error && (
        <div className="exam-alert error">
          {error}
        </div>
      )}

      <div className="exam-card">
        <h3>Create New Examination</h3>

        <form onSubmit={handleSubmit}>

          <div className="exam-form-grid">

            <div className="exam-form-group">
              <label>Exam Name *</label>
              <input
                type="text"
                name="exam_name"
                value={form.exam_name}
                onChange={handleChange}
                placeholder="Enter exam name"
                required
              />
            </div>

            <div className="exam-form-group">
              <label>Class *</label>
              <select
                name="class_id"
                value={form.class_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Class</option>

                {classes.map((item) => (
                  <option key={item.class_id} value={item.class_id}>
                    {item.class_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="exam-form-group">
              <label>Academic Year *</label>
              <input
                type="text"
                name="academic_year"
                value={form.academic_year}
                onChange={handleChange}
                placeholder="Example: 2026"
                required
              />
            </div>

            <div className="exam-form-group">
              <label>Start Date</label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
              />
            </div>

            <div className="exam-form-group">
              <label>End Date</label>
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                min={form.start_date || undefined}
              />
            </div>

            <div className="exam-form-group">
              <label>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

          </div>

          <button
            type="submit"
            className="exam-primary-btn"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : '+ Create Examination'}
          </button>

        </form>
      </div>

      <div className="exam-list-header">
        <h3>Examination List</h3>
      </div>

      {loading ? (
        <div className="exam-loading">
          Loading examinations...
        </div>
      ) : exams.length === 0 ? (
        <div className="exam-empty">
          No examinations found. Create your first examination above.
        </div>
      ) : (

        <div className="exam-table-wrapper">
          <table className="exam-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Exam Name</th>
                <th>Class ID</th>
                <th>Academic Year</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {exams.map((exam) => (
                <tr key={exam.exam_id}>
                  <td>{exam.exam_id}</td>
                  <td>{exam.exam_name}</td>
                  <td>{exam.class_id}</td>
                  <td>{exam.academic_year}</td>
                  <td>{exam.start_date?.slice(0, 10) || '-'}</td>
                  <td>{exam.end_date?.slice(0, 10) || '-'}</td>

                  <td>
                    <span className={`exam-status ${exam.status}`}>
                      {exam.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="exam-delete-btn"
                      onClick={() => handleDelete(exam.exam_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}

    </div>
  )
}

export default Examinations

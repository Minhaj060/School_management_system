
import { useEffect, useState } from 'react'
import API from '../api/axios'
import './Classes.css'

const initialForm = {
  class_name: '',
  academic_year: '',
  status: 'active',
}

function Classes() {
  const [classes, setClasses] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')

  const fetchClasses = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await API.get('/classes')
      setClasses(response.data.data || [])
    } catch (err) {
      console.error('Fetch classes error:', err)
      setError('Unable to load classes. Please check the backend server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setFormError('')
  }

  const validateForm = () => {
    if (!formData.class_name.trim()) {
      return 'Class name is required.'
    }

    if (formData.class_name.trim().length > 50) {
      return 'Class name cannot exceed 50 characters.'
    }

    if (!formData.academic_year.trim()) {
      return 'Academic year is required.'
    }

    if (formData.academic_year.trim().length > 20) {
      return 'Academic year cannot exceed 20 characters.'
    }

    if (!['active', 'inactive'].includes(formData.status)) {
      return 'Please select a valid status.'
    }

    return ''
  }

  const resetForm = () => {
    setFormData(initialForm)
    setEditingId(null)
    setShowForm(false)
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationMessage = validateForm()
    if (validationMessage) {
      setFormError(validationMessage)
      return
    }

    const payload = {
      class_name: formData.class_name.trim(),
      academic_year: formData.academic_year.trim(),
      status: formData.status,
    }

    try {
      setSaving(true)
      setFormError('')

      if (editingId) {
        await API.put(`/classes/${editingId}`, payload)
        alert('Class updated successfully!')
      } else {
        await API.post('/classes', payload)
        alert('Class added successfully!')
      }

      resetForm()
      await fetchClasses()
    } catch (err) {
      console.error('Save class error:', err)
      setFormError(
        err.response?.data?.message || 'Failed to save class. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const editClass = (item) => {
    setEditingId(item.class_id)
    setFormData({
      class_name: item.class_name || '',
      academic_year: item.academic_year || '',
      status: item.status || 'active',
    })
    setFormError('')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteClass = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this class?'
    )

    if (!confirmed) return

    try {
      await API.delete(`/classes/${id}`)
      alert('Class deleted successfully!')
      await fetchClasses()
    } catch (err) {
      console.error('Delete class error:', err)
      alert(
        err.response?.data?.message ||
        'Failed to delete class. It may be linked to students or sections.'
      )
    }
  }

  const filteredClasses = classes.filter((item) => {
    const query = search.toLowerCase()
    return (
      (item.class_name || '').toLowerCase().includes(query) ||
      (item.academic_year || '').toLowerCase().includes(query) ||
      String(item.class_id).includes(query)
    )
  })

  return (
    <div className="dashboard-content">
      <div className="section-title class-heading">
        <div>
          <h2>Class Management</h2>
          <p>Manage classes and academic years</p>
        </div>

        <button
          className="class-primary-btn"
          onClick={() => {
            if (showForm && !editingId) {
              resetForm()
            } else {
              setFormData(initialForm)
              setEditingId(null)
              setFormError('')
              setShowForm(true)
            }
          }}
        >
          + Add Class
        </button>
      </div>

      {showForm && (
        <div className="content-card class-form-card">
          <h3>{editingId ? 'Update Class' : 'Add New Class'}</h3>

          <form onSubmit={handleSubmit} className="class-form">
            {formError && (
              <p className="class-error full-width">{formError}</p>
            )}

            <div className="class-form-group">
              <label htmlFor="class_name">Class Name *</label>
              <input
                id="class_name"
                name="class_name"
                value={formData.class_name}
                onChange={handleChange}
                placeholder="e.g. Class 6"
                maxLength={50}
                required
              />
            </div>

            <div className="class-form-group">
              <label htmlFor="academic_year">Academic Year *</label>
              <input
                id="academic_year"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleChange}
                placeholder="e.g. 2026"
                maxLength={20}
                required
              />
            </div>

            <div className="class-form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="class-form-actions full-width">
              <button
                type="submit"
                className="class-primary-btn"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Update Class'
                    : 'Save Class'}
              </button>

              <button
                type="button"
                className="class-cancel-btn"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="content-card class-list-card">
        <div className="class-table-header">
          <div>
            <h3>Class List</h3>
            <p>Total Classes: {classes.length}</p>
          </div>

          <input
            className="class-search"
            type="search"
            placeholder="Search class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="class-message">Loading classes...</p>
        ) : error ? (
          <div className="class-message class-error">
            {error}
            <button onClick={fetchClasses}>Retry</button>
          </div>
        ) : filteredClasses.length === 0 ? (
          <p className="class-message">
            {classes.length === 0
              ? 'No classes found. Add your first class.'
              : 'No matching classes found.'}
          </p>
        ) : (
          <div className="table-responsive">
            <table className="class-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Class Name</th>
                  <th>Academic Year</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredClasses.map((item) => (
                  <tr key={item.class_id}>
                    <td>{item.class_id}</td>
                    <td>{item.class_name}</td>
                    <td>{item.academic_year}</td>
                    <td>
                      <span
                        className={`class-status ${
                          item.status === 'active' ? 'active' : 'inactive'
                        }`}
                      >
                        {item.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <div className="class-action-buttons">
                        <button
                          className="class-edit-btn"
                          onClick={() => editClass(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="class-delete-btn"
                          onClick={() => deleteClass(item.class_id)}
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

export default Classes

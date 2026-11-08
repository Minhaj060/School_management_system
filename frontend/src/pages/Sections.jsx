
import { useEffect, useState } from 'react'
import API from '../api/axios'
import './Sections.css'

const initialForm = {
  class_id: '',
  section_name: '',
  capacity: '40',
}

function Sections() {
  const [sections, setSections] = useState([])
  const [classes, setClasses] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const [sectionResponse, classResponse] = await Promise.all([
        API.get('/sections'),
        API.get('/classes'),
      ])

      setSections(sectionResponse.data.data || [])
      setClasses(classResponse.data.data || [])
    } catch (err) {
      console.error('Fetch sections error:', err)
      setError('Unable to load sections or classes. Check the backend server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setFormError('')
  }

  const validateForm = () => {
    if (!formData.class_id) {
      return 'Please select a class.'
    }

    if (!formData.section_name.trim()) {
      return 'Section name is required.'
    }

    if (formData.section_name.trim().length > 20) {
      return 'Section name cannot exceed 20 characters.'
    }

    if (
      formData.capacity !== '' &&
      (!Number.isInteger(Number(formData.capacity)) ||
        Number(formData.capacity) <= 0)
    ) {
      return 'Capacity must be a positive whole number.'
    }

    const selectedClass = classes.find(
      (item) => Number(item.class_id) === Number(formData.class_id)
    )

    if (!selectedClass) {
      return 'Selected class does not exist. Please select another class.'
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
      class_id: Number(formData.class_id),
      section_name: formData.section_name.trim(),
      capacity: formData.capacity === '' ? null : Number(formData.capacity),
    }

    try {
      setSaving(true)
      setFormError('')

      if (editingId) {
        await API.put(`/sections/${editingId}`, payload)
        alert('Section updated successfully!')
      } else {
        await API.post('/sections', payload)
        alert('Section added successfully!')
      }

      resetForm()
      await fetchData()
    } catch (err) {
      console.error('Save section error:', err)
      setFormError(
        err.response?.data?.message ||
        'Failed to save section. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const editSection = (section) => {
    setEditingId(section.section_id)
    setFormData({
      class_id: String(section.class_id || ''),
      section_name: section.section_name || '',
      capacity: section.capacity == null ? '' : String(section.capacity),
    })
    setFormError('')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteSection = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this section?'
    )

    if (!confirmed) return

    try {
      await API.delete(`/sections/${id}`)
      alert('Section deleted successfully!')
      await fetchData()
    } catch (err) {
      console.error('Delete section error:', err)
      alert(
        err.response?.data?.message ||
        'Failed to delete section. It may be linked to students.'
      )
    }
  }

  const getClassName = (classId) => {
    const found = classes.find(
      (item) => Number(item.class_id) === Number(classId)
    )
    return found?.class_name || `Class ID: ${classId}`
  }

  const filteredSections = sections.filter((section) => {
    const query = search.toLowerCase()

    return (
      (section.section_name || '').toLowerCase().includes(query) ||
      getClassName(section.class_id).toLowerCase().includes(query) ||
      String(section.section_id).includes(query)
    )
  })

  return (
    <div className="dashboard-content">
      <div className="section-title section-heading">
        <div>
          <h2>Section Management</h2>
          <p>Manage class sections and student capacity</p>
        </div>

        <button
          className="section-primary-btn"
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
          disabled={classes.length === 0}
          title={classes.length === 0 ? 'Create a class first' : ''}
        >
          + Add Section
        </button>
      </div>

      {classes.length === 0 && !loading && (
        <div className="section-notice">
          No classes found. Create a class before adding a section.
        </div>
      )}

      {showForm && (
        <div className="content-card section-form-card">
          <h3>{editingId ? 'Update Section' : 'Add New Section'}</h3>

          <form onSubmit={handleSubmit} className="section-form">
            {formError && (
              <p className="section-error full-width">{formError}</p>
            )}

            <div className="section-form-group">
              <label htmlFor="section_class_id">Class *</label>
              <select
                id="section_class_id"
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Class</option>
                {classes.map((item) => (
                  <option key={item.class_id} value={item.class_id}>
                    {item.class_name} ({item.academic_year})
                  </option>
                ))}
              </select>
            </div>

            <div className="section-form-group">
              <label htmlFor="section_name">Section Name *</label>
              <input
                id="section_name"
                name="section_name"
                value={formData.section_name}
                onChange={handleChange}
                placeholder="e.g. A"
                maxLength={20}
                required
              />
            </div>

            <div className="section-form-group">
              <label htmlFor="capacity">Student Capacity</label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                step="1"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="Default: 40"
              />
            </div>

            <div className="section-form-actions full-width">
              <button
                type="submit"
                className="section-primary-btn"
                disabled={saving || classes.length === 0}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Update Section'
                    : 'Save Section'}
              </button>

              <button
                type="button"
                className="section-cancel-btn"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="content-card section-list-card">
        <div className="section-table-header">
          <div>
            <h3>Section List</h3>
            <p>Total Sections: {sections.length}</p>
          </div>

          <input
            className="section-search"
            type="search"
            placeholder="Search section or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="section-message">Loading sections...</p>
        ) : error ? (
          <div className="section-message section-error">
            {error}
            <button onClick={fetchData}>Retry</button>
          </div>
        ) : filteredSections.length === 0 ? (
          <p className="section-message">
            {sections.length === 0
              ? 'No sections found. Add your first section.'
              : 'No matching sections found.'}
          </p>
        ) : (
          <div className="table-responsive">
            <table className="section-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Class</th>
                  <th>Section Name</th>
                  <th>Capacity</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSections.map((section) => (
                  <tr key={section.section_id}>
                    <td>{section.section_id}</td>
                    <td>{getClassName(section.class_id)}</td>
                    <td>{section.section_name}</td>
                    <td>{section.capacity ?? 40}</td>
                    <td>
                      <div className="section-action-buttons">
                        <button
                          className="section-edit-btn"
                          onClick={() => editSection(section)}
                        >
                          Edit
                        </button>

                        <button
                          className="section-delete-btn"
                          onClick={() => deleteSection(section.section_id)}
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

export default Sections


import { useState } from 'react'
import API from '../api/axios'
import './ChangePassword.css'

function ChangePassword({ onLogout }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [changed, setChanged] = useState(false)

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirm password do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await API.put('/auth/change-password', form)

      setMessage(response.data.message || 'Password changed successfully.')
      setChanged(true)
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-card change-password-card">
        <div className="password-heading">
          <div className="password-icon">🔐</div>
          <div>
            <h2>Change Password</h2>
            <p>Update your account password securely.</p>
          </div>
        </div>

        {message && (
          <div className="password-success">{message}</div>
        )}

        {error && (
          <div className="password-error">{error}</div>
        )}

        {!changed ? (
          <form onSubmit={handleSubmit} className="password-form">

            <label>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password"
              autoComplete="current-password"
              required
            />

            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              autoComplete="new-password"
              minLength={8}
              required
            />

            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              autoComplete="new-password"
              required
            />

            <p className="password-hint">
              Password must contain at least 8 characters.
            </p>

            <button
              type="submit"
              className="password-submit"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>

          </form>
        ) : (
          <button
            className="password-submit"
            onClick={onLogout}
          >
            Login Again
          </button>
        )}
      </div>
    </div>
  )
}

export default ChangePassword

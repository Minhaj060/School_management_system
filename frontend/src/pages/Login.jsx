
import { useState } from 'react'
import API from '../api/axios'
import './Login.css'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await API.post('/auth/login', {
        email,
        password
      })

      const { token, user } = response.data

      sessionStorage.setItem('token', token)
      onLogin(user)

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Login failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">

      <div className="login-card">

        <div className="login-brand">
          <div className="login-brand-icon">E</div>
          <h1>EduManage</h1>
          <p>School Management System</p>
        </div>

        <div className="login-heading">
          <h2>Welcome Back!</h2>
          <p>Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleLogin}>

          <div className="login-input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In →'}
          </button>

        </form>

        <div className="login-footer">
          <span>🔒</span>
          Secure Admin Portal
        </div>

      </div>

      <p className="login-copyright">
        © 2026 EduManage School Management System
      </p>

    </div>
  )
}

export default Login


import { useState, useEffect } from 'react'
import './App.css'
import Students from './pages/Students'
import API from './api/axios'

function App() {
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [stats, setStats] = useState([
  { title: 'Total Students', value: 0, icon: '🎓', color: 'blue' },
  { title: 'Total Teachers', value: 0, icon: '👨‍🏫', color: 'green' },
  { title: 'Total Classes', value: 0, icon: '🏫', color: 'orange' },
  { title: 'Total Subjects', value: 0, icon: '📚', color: 'purple' }
])

  const menuItems = [
    'Dashboard',
    'Students',
    'Teachers',
    'Classes',
    'Sections',
    'Subjects',
    'Attendance',
    'Examinations',
    'Results',
    'Fees & Accounts',
    'Settings'
  ]

  useEffect(() => {
  if (activeMenu !== 'Dashboard') return

  const fetchDashboardStats = async () => {
    try {
      const [students, teachers, classes, subjects] =
        await Promise.all([
          API.get('/students'),
          API.get('/teachers'),
          API.get('/classes'),
          API.get('/subjects')
        ])

      setStats([
        {
          title: 'Total Students',
          value: students.data.data.length,
          icon: '🎓',
          color: 'blue'
        },
        {
          title: 'Total Teachers',
          value: teachers.data.data.length,
          icon: '👨‍🏫',
          color: 'green'
        },
        {
          title: 'Total Classes',
          value: classes.data.data.length,
          icon: '🏫',
          color: 'orange'
        },
        {
          title: 'Total Subjects',
          value: subjects.data.data.length,
          icon: '📚',
          color: 'purple'
        }
      ])
    } catch (error) {
      console.error('Dashboard statistics error:', error)
    }
  }

  fetchDashboardStats()
}, [activeMenu])

  return (
    <div className="app-container">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <h2>EduManage</h2>
            <p>School Management</p>
          </div>
        </div>

        <div className="menu-heading">MAIN MENU</div>

        <nav className="sidebar-menu">
          {menuItems.map((item, index) => (
            <button
              key={item}
              className={`menu-item ${activeMenu === item ? 'active' : ''}`}
              onClick={() => setActiveMenu(item)}
            >
              <span>{['▦', '♟', '♙', '▤', '▣', '📚', '✓', '📝', '📊', '💳', '⚙'][index]}</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <p>System Admin</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">

        {/* Navbar */}
        <header className="topbar">
          <div>
            <h2>{activeMenu}</h2>
            <p>Welcome to your school management system</p>
          </div>

          <div className="topbar-right">
            <button className="notification">🔔</button>
            <div className="profile">
              <div className="admin-avatar">A</div>
              <div>
                <strong>Admin</strong>
                <p>Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard */}
        {activeMenu === 'Dashboard' ? (
          <div className="dashboard-content">

            <div className="welcome-banner">
              <div>
                <h1>Welcome to EduManage 👋</h1>
                <p>Manage your school's activities from one place.</p>
              </div>
              <div className="welcome-icon">🏫</div>
            </div>

            <div className="section-title">
              <h2>Overview</h2>
              <p>School statistics at a glance</p>
            </div>

            <div className="stats-grid">
              {stats.map((stat) => (
                <div className="stat-card" key={stat.title}>
                  <div className={`stat-icon ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p>{stat.title}</p>
                    <h2>{stat.value}</h2>
                  </div>
                </div>
              ))}
            </div>

            <div className="bottom-grid">
              <div className="content-card">
                <h3>Recent Activities</h3>
                <p className="muted">Your latest school activities will appear here.</p>
                <div className="empty-state">
                  <span>📋</span>
                  <p>No recent activities available.</p>
                </div>
              </div>

              <div className="content-card">
                <h3>Quick Information</h3>
                <div className="info-row">
                  <span>Academic Year</span>
                  <strong>2026</strong>
                </div>
                <div className="info-row">
                  <span>System Status</span>
                  <strong className="status">● Active</strong>
                </div>
                <div className="info-row">
                  <span>User Role</span>
                  <strong>Administrator</strong>
                </div>
              </div>
            </div>

          </div>
        ) : activeMenu === 'Students' ? (
  <Students />
) : (
  <div className="dashboard-content">
    <div className="content-card page-placeholder">
      <h2>{activeMenu} Management</h2>
      <p className="muted">
        This module will be developed with backend API integration.
      </p>
    </div>
  </div>
)}

      </main>
    </div>
  )
}

export default App

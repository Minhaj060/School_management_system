
import { useEffect, useMemo, useState } from 'react'
import API from '../api/axios'
import './StudentAttendance.css'

const today = () => {
  const date = new Date()
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

const firstDayOfMonth = () => `${today().slice(0, 7)}-01`
const statusOptions = ['present', 'absent', 'late', 'leave']

function StudentAttendance({ userRole }) {
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [date, setDate] = useState(today())

  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [startDate, setStartDate] = useState(firstDayOfMonth())
  const [endDate, setEndDate] = useState(today())
  const [report, setReport] = useState([])
  const [parentStudentId, setParentStudentId] = useState('')

  // Class report states
  const [classReport, setClassReport] = useState([])
  const [reportClassId, setReportClassId] = useState('')
  const [reportSectionId, setReportSectionId] = useState('')
  const [reportStartDate, setReportStartDate] = useState(firstDayOfMonth())
  const [reportEndDate, setReportEndDate] = useState(today())

  // Individual report states
  const [individualSearch, setIndividualSearch] = useState('')
  const [individualClassId, setIndividualClassId] = useState('')
  const [individualSectionId, setIndividualSectionId] = useState('')
  const [individualStudents, setIndividualStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [individualStartDate, setIndividualStartDate] = useState(firstDayOfMonth())
  const [individualEndDate, setIndividualEndDate] = useState(today())
  const [individualReport, setIndividualReport] = useState(null)
  const [searchingStudents, setSearchingStudents] = useState(false)
  const [loadingIndividualReport, setLoadingIndividualReport] = useState(false)

  const canManage = ['admin', 'teacher'].includes(userRole)

  const filteredSections = useMemo(
    () => sections.filter(
      section => String(section.class_id) === String(classId)
    ),
    [sections, classId]
  )

  const individualSections = useMemo(
    () => sections.filter(
      section => String(section.class_id) === String(individualClassId)
    ),
    [sections, individualClassId]
  )

  // Load classes and sections
  useEffect(() => {
    if (!canManage) return

    const loadOptions = async () => {
      try {
        const [classResponse, sectionResponse] = await Promise.all([
          API.get('/classes'),
          API.get('/sections')
        ])

        setClasses(classResponse.data.data || [])
        setSections(sectionResponse.data.data || [])
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Could not load classes and sections.'
        )
      }
    }

    loadOptions()
  }, [canManage])

  // Load students for daily attendance
  const loadStudents = async () => {
    if (!classId || !sectionId || !date) {
      setError('Please select class, section and date.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')
    setStudents([])
    setAttendance({})

    try {
      const response = await API.get(
        `/attendance/classes/${classId}/sections/${sectionId}/students`,
        { params: { date } }
      )

      const list = response.data.data || []
      setStudents(list)

      const initialAttendance = {}

      list.forEach(student => {
        initialAttendance[student.student_id] =
          student.attendance?.status || 'present'
      })

      setAttendance(initialAttendance)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not load student attendance.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Change attendance status
  const changeStatus = (studentId, status) => {
    setAttendance(previous => ({
      ...previous,
      [studentId]: status
    }))
  }

  // Save attendance
  const saveAttendance = async () => {
    if (!students.length) {
      setError('No students available to save.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const records = students.map(student => ({
        student_id: student.student_id,
        status: attendance[student.student_id] || 'present',
        remarks: ''
      }))

      const response = await API.post('/attendance/bulk', {
        class_id: Number(classId),
        section_id: Number(sectionId),
        attendance_date: date,
        attendance: records
      })

      setMessage(
        response.data.message || 'Attendance saved successfully!'
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not save attendance.'
      )
    } finally {
      setSaving(false)
    }
  }

  // Load class attendance report
  const loadClassReport = async () => {
    if (!reportClassId || !reportSectionId) {
      setError('Please select class and section.')
      return
    }

    if (
      !reportStartDate ||
      !reportEndDate ||
      reportStartDate > reportEndDate
    ) {
      setError('Please select a valid date range.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')
    setClassReport([])

    try {
      const response = await API.get('/attendance/report', {
        params: {
          class_id: reportClassId,
          section_id: reportSectionId,
          start_date: reportStartDate,
          end_date: reportEndDate
        }
      })

      setClassReport(response.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load class report.')
    } finally {
      setLoading(false)
    }
  }

  // Student and parent report
  const loadMyReport = async () => {
    if (!startDate || !endDate || startDate > endDate) {
      setError('Please select a valid date range.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')
    setReport([])

    try {
      let response

      if (userRole === 'student') {
        response = await API.get('/attendance/my', {
          params: {
            start_date: startDate,
            end_date: endDate
          }
        })
      } else {
        if (!parentStudentId.trim()) {
          setError('Please enter your linked student ID.')
          setLoading(false)
          return
        }

        response = await API.get(
          `/attendance/children/${parentStudentId}`,
          {
            params: {
              start_date: startDate,
              end_date: endDate
            }
          }
        )
      }

      setReport(response.data.data || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not load attendance report.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Search students for individual report
  const searchIndividualStudents = async () => {
    setSearchingStudents(true)
    setError('')
    setIndividualStudents([])
    setSelectedStudent(null)
    setIndividualReport(null)

    try {
      const params = {
        search: individualSearch.trim()
      }

      if (individualClassId) {
        params.class_id = individualClassId
      }

      if (individualSectionId) {
        params.section_id = individualSectionId
      }

      const response = await API.get('/attendance/individual/students', {
        params
      })

      setIndividualStudents(response.data.data || [])

      if (!response.data.data?.length) {
        setMessage('No students found.')
      } else {
        setMessage(`${response.data.data.length} student(s) found.`)
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not search students.'
      )
    } finally {
      setSearchingStudents(false)
    }
  }

  // Select student
  const selectIndividualStudent = (student) => {
    setSelectedStudent(student)
    setIndividualReport(null)
    setError('')
    setMessage('')
  }

  // Load individual student attendance report
  const loadIndividualReport = async () => {
    if (!selectedStudent) {
      setError('Please select a student first.')
      return
    }

    if (
      !individualStartDate ||
      !individualEndDate ||
      individualStartDate > individualEndDate
    ) {
      setError('Please select a valid date range.')
      return
    }

    setLoadingIndividualReport(true)
    setError('')
    setMessage('')
    setIndividualReport(null)

    try {
      const response = await API.get(
        `/attendance/individual/${selectedStudent.student_id}`,
        {
          params: {
            start_date: individualStartDate,
            end_date: individualEndDate
          }
        }
      )

      setIndividualReport(response.data)
      setMessage('Individual attendance report generated successfully.')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not load individual attendance report.'
      )
    } finally {
      setLoadingIndividualReport(false)
    }
  }

  const counts = {
    present: Object.values(attendance).filter(v => v === 'present').length,
    absent: Object.values(attendance).filter(v => v === 'absent').length,
    late: Object.values(attendance).filter(v => v === 'late').length,
    leave: Object.values(attendance).filter(v => v === 'leave').length
  }

  // Student / Parent view
  if (userRole === 'student' || userRole === 'parent') {
    return (
      <div className="attendance-page">
        <div className="attendance-heading">
          <div>
            <h1>My Attendance</h1>
            <p>View attendance records by date range.</p>
          </div>
        </div>

        <div className="attendance-filter">
          {userRole === 'parent' && (
            <div className="attendance-field">
              <label>Linked Student ID</label>
              <input
                type="number"
                min="1"
                value={parentStudentId}
                onChange={e => setParentStudentId(e.target.value)}
                placeholder="Enter student ID"
              />
            </div>
          )}

          <div className="attendance-field">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div className="attendance-field">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>

          <button
            className="attendance-primary-btn"
            onClick={loadMyReport}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'View Attendance'}
          </button>
        </div>

        {error && <div className="attendance-alert error">{error}</div>}
        {message && <div className="attendance-alert success">{message}</div>}

        <div className="attendance-card">
          <h3>Attendance History</h3>

          {report.length === 0 ? (
            <div className="attendance-empty">
              No attendance records to display.
            </div>
          ) : (
            <div className="attendance-table-wrap">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map(item => (
                    <tr key={item.attendance_id}>
                      <td>{String(item.attendance_date).slice(0, 10)}</td>
                      <td>
                        <span className={`attendance-status ${item.status}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.remarks || '-'}</td>
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

  // Admin / Teacher view
  return (
    <div className="attendance-page">
      <div className="attendance-heading">
        <div>
          <h1>Student Attendance</h1>
          <p>Manage daily student attendance.</p>
        </div>
      </div>

      {error && <div className="attendance-alert error">{error}</div>}
      {message && <div className="attendance-alert success">{message}</div>}

      {/* Daily Attendance */}
      <div className="attendance-filter">
        <div className="attendance-field">
          <label>Class</label>
          <select
            value={classId}
            onChange={e => {
              setClassId(e.target.value)
              setSectionId('')
              setStudents([])
              setAttendance({})
              setMessage('')
              setError('')
            }}
          >
            <option value="">Select Class</option>
            {classes.map(item => (
              <option key={item.class_id} value={item.class_id}>
                {item.class_name}
              </option>
            ))}
          </select>
        </div>

        <div className="attendance-field">
          <label>Section</label>
          <select
            value={sectionId}
            onChange={e => {
              setSectionId(e.target.value)
              setStudents([])
              setAttendance({})
              setMessage('')
              setError('')
            }}
            disabled={!classId}
          >
            <option value="">Select Section</option>
            {filteredSections.map(item => (
              <option key={item.section_id} value={item.section_id}>
                {item.section_name}
              </option>
            ))}
          </select>
        </div>

        <div className="attendance-field">
          <label>Attendance Date</label>
          <input
            type="date"
            value={date}
            onChange={e => {
              setDate(e.target.value)
              setMessage('')
              setError('')
            }}
          />
        </div>

        <button
          className="attendance-primary-btn"
          onClick={loadStudents}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load Students'}
        </button>
      </div>

      {students.length > 0 && (
        <>
          <div className="attendance-summary">
            {statusOptions.map(status => (
              <div className="attendance-summary-card" key={status}>
                <span>{status}</span>
                <strong>{counts[status]}</strong>
              </div>
            ))}
          </div>

          <div className="attendance-card">
            <div className="attendance-card-heading">
              <div>
                <h3>Student List</h3>
                <p>{students.length} students found</p>
              </div>

              <button
                className="attendance-primary-btn"
                onClick={saveAttendance}
                disabled={saving || loading}
              >
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>

            <div className="attendance-table-wrap">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Roll</th>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.student_id}>
                      <td>{student.roll_number ?? '-'}</td>
                      <td>{student.student_code}</td>
                      <td>{student.full_name}</td>
                      <td>
                        <select
                          className={`status-select ${attendance[student.student_id]}`}
                          value={attendance[student.student_id] || 'present'}
                          onChange={e =>
                            changeStatus(student.student_id, e.target.value)
                          }
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && students.length === 0 && !error && (
        <div className="attendance-card attendance-empty">
          Select a class, section and date, then click Load Students.
        </div>
      )}

      {/* Class Attendance Report */}
      <div className="attendance-card" style={{ marginTop: 25 }}>
        <h3>Class Attendance Report</h3>
        <p>View attendance history for an entire class or section.</p>

        <div className="attendance-filter">
          <div className="attendance-field">
            <label>Class</label>
            <select
              value={reportClassId}
              onChange={e => {
                setReportClassId(e.target.value)
                setReportSectionId('')
              }}
            >
              <option value="">Select Class</option>
              {classes.map(item => (
                <option key={item.class_id} value={item.class_id}>
                  {item.class_name}
                </option>
              ))}
            </select>
          </div>

          <div className="attendance-field">
            <label>Section</label>
            <select
              value={reportSectionId}
              onChange={e => setReportSectionId(e.target.value)}
              disabled={!reportClassId}
            >
              <option value="">Select Section</option>
              {sections
                .filter(item => String(item.class_id) === String(reportClassId))
                .map(item => (
                  <option key={item.section_id} value={item.section_id}>
                    {item.section_name}
                  </option>
                ))}
            </select>
          </div>

          <div className="attendance-field">
            <label>Start Date</label>
            <input
              type="date"
              value={reportStartDate}
              onChange={e => setReportStartDate(e.target.value)}
            />
          </div>

          <div className="attendance-field">
            <label>End Date</label>
            <input
              type="date"
              value={reportEndDate}
              onChange={e => setReportEndDate(e.target.value)}
            />
          </div>

          <button
            className="attendance-primary-btn"
            onClick={loadClassReport}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>

        {classReport.length > 0 && (
          <>
            <div className="attendance-summary">
              {statusOptions.map(status => (
                <div className="attendance-summary-card" key={status}>
                  <span>{status}</span>
                  <strong>
                    {classReport.filter(item => item.status === status).length}
                  </strong>
                </div>
              ))}
            </div>

            <div className="attendance-table-wrap">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Roll</th>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {classReport.map(item => (
                    <tr key={item.attendance_id}>
                      <td>{String(item.attendance_date).slice(0, 10)}</td>
                      <td>{item.roll_number ?? '-'}</td>
                      <td>{item.student_code}</td>
                      <td>{item.full_name}</td>
                      <td>
                        <span className={`attendance-status ${item.status}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {classReport.length === 0 && (
          <div className="attendance-empty">
            No report data available. Select filters and generate a report.
          </div>
        )}
      </div>

      {/* Individual Student Attendance Report */}
      <div className="attendance-card" style={{ marginTop: 25 }}>
        <h3>Individual Student Attendance Report</h3>
        <p>Search a student and view their complete attendance history.</p>

        <div className="attendance-filter">
          <div className="attendance-field">
            <label>Search Student</label>
            <input
              type="text"
              value={individualSearch}
              onChange={e => setIndividualSearch(e.target.value)}
              placeholder="Student name, ID or roll..."
              onKeyDown={e => {
                if (e.key === 'Enter') searchIndividualStudents()
              }}
            />
          </div>

          <div className="attendance-field">
            <label>Class (Optional)</label>
            <select
              value={individualClassId}
              onChange={e => {
                setIndividualClassId(e.target.value)
                setIndividualSectionId('')
                setIndividualStudents([])
                setSelectedStudent(null)
                setIndividualReport(null)
              }}
            >
              <option value="">All Classes</option>
              {classes.map(item => (
                <option key={item.class_id} value={item.class_id}>
                  {item.class_name}
                </option>
              ))}
            </select>
          </div>

          <div className="attendance-field">
            <label>Section (Optional)</label>
            <select
              value={individualSectionId}
              onChange={e => {
                setIndividualSectionId(e.target.value)
                setIndividualStudents([])
                setSelectedStudent(null)
                setIndividualReport(null)
              }}
              disabled={!individualClassId}
            >
              <option value="">All Sections</option>
              {individualSections.map(item => (
                <option key={item.section_id} value={item.section_id}>
                  {item.section_name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="attendance-primary-btn"
            onClick={searchIndividualStudents}
            disabled={searchingStudents}
          >
            {searchingStudents ? 'Searching...' : 'Search Students'}
          </button>
        </div>

        {/* Search Results */}
        {individualStudents.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h4>Search Results ({individualStudents.length})</h4>

            <div className="attendance-table-wrap">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Roll</th>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Class ID</th>
                    <th>Section ID</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {individualStudents.map(student => (
                    <tr key={student.student_id}>
                      <td>{student.roll_number ?? '-'}</td>
                      <td>{student.student_code}</td>
                      <td>{student.full_name}</td>
                      <td>{student.class_id}</td>
                      <td>{student.section_id}</td>
                      <td>
                        <button
                          className="attendance-primary-btn"
                          onClick={() => selectIndividualStudent(student)}
                        >
                          {selectedStudent?.student_id === student.student_id
                            ? 'Selected'
                            : 'Select'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Selected Student and Date Range */}
        {selectedStudent && (
          <div style={{ marginTop: 25 }}>
            <h4>Selected Student</h4>

            <div className="attendance-summary">
              <div className="attendance-summary-card">
                <span>Student Name</span>
                <strong>{selectedStudent.full_name}</strong>
              </div>

              <div className="attendance-summary-card">
                <span>Student ID</span>
                <strong>{selectedStudent.student_code}</strong>
              </div>

              <div className="attendance-summary-card">
                <span>Roll Number</span>
                <strong>{selectedStudent.roll_number ?? '-'}</strong>
              </div>
            </div>

            <div className="attendance-filter">
              <div className="attendance-field">
                <label>Start Date</label>
                <input
                  type="date"
                  value={individualStartDate}
                  onChange={e => setIndividualStartDate(e.target.value)}
                />
              </div>

              <div className="attendance-field">
                <label>End Date</label>
                <input
                  type="date"
                  value={individualEndDate}
                  onChange={e => setIndividualEndDate(e.target.value)}
                />
              </div>

              <button
                className="attendance-primary-btn"
                onClick={loadIndividualReport}
                disabled={loadingIndividualReport}
              >
                {loadingIndividualReport
                  ? 'Generating...'
                  : 'Generate Individual Report'}
              </button>
            </div>
          </div>
        )}

        {/* Individual Report Result */}
        {individualReport && (
          <div style={{ marginTop: 25 }}>
            <h4>Attendance Summary</h4>

            <div className="attendance-summary">
              <div className="attendance-summary-card">
                <span>Total Recorded Days</span>
                <strong>{individualReport.summary.total}</strong>
              </div>

              <div className="attendance-summary-card">
                <span>Present</span>
                <strong>{individualReport.summary.present}</strong>
              </div>

              <div className="attendance-summary-card">
                <span>Absent</span>
                <strong>{individualReport.summary.absent}</strong>
              </div>

              <div className="attendance-summary-card">
                <span>Late</span>
                <strong>{individualReport.summary.late}</strong>
              </div>

              <div className="attendance-summary-card">
                <span>Leave</span>
                <strong>{individualReport.summary.leave}</strong>
              </div>

              <div className="attendance-summary-card">
                <span>Attendance Percentage</span>
                <strong>
                  {individualReport.summary.attendance_percentage}%
                </strong>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#777', marginTop: 10 }}>
              Percentage is calculated from recorded attendance days.
              Present and Late count as attended.
            </p>

            <h4 style={{ marginTop: 25 }}>Individual Attendance History</h4>

            {individualReport.data.length === 0 ? (
              <div className="attendance-empty">
                No attendance records found for this date range.
              </div>
            ) : (
              <div className="attendance-table-wrap">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {individualReport.data.map(item => (
                      <tr key={item.attendance_id}>
                        <td>{String(item.attendance_date).slice(0, 10)}</td>
                        <td>
                          <span className={`attendance-status ${item.status}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>{item.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentAttendance

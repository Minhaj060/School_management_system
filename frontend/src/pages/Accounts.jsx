

import { useEffect, useState } from 'react'
import API from '../api/axios'
import './Accounts.css'

function Accounts({ user }) {
  const role = user?.role?.toLowerCase() || ''
  const isStudent = role === 'student'
  const isAdminOrAccountant = ['admin', 'accountant'].includes(role)

  const studentTabs = [
    { id: 'my-fees', label: 'My Fees' },
    { id: 'my-dues', label: 'My Dues' },
    { id: 'my-payments', label: 'Payment History' }
  ]

  const adminTabs = [
    { id: 'fees', label: 'Fee Structure' },
    { id: 'student-fees', label: 'Student Fees' },
    { id: 'dues', label: 'Dues' },
    { id: 'payments', label: 'Payments' },
    { id: 'income', label: 'Income' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'payslips', label: 'Payslips' }
  ]

  const tabs = isStudent ? studentTabs : adminTabs

  const [activeTab, setActiveTab] = useState(
    isStudent ? 'my-fees' : 'fees'
  )

  const [data, setData] = useState({
    fees: [],
    studentFees: [],
    dues: [],
    payments: [],
    income: [],
    expenses: [],
    payslips: []
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      let response
      let key

      const endpoints = {
        'my-fees': ['/accounts/student/my-fees', 'studentFees'],
        'my-dues': ['/accounts/student/my-dues', 'dues'],
        'my-payments': ['/accounts/student/my-payments', 'payments'],
        fees: ['/accounts/fee-structures', 'fees'],
        'student-fees': ['/accounts/student-fees', 'studentFees'],
        dues: ['/accounts/dues', 'dues'],
        payments: ['/accounts/payments', 'payments'],
        income: ['/accounts/income', 'income'],
        expenses: ['/accounts/expenses', 'expenses'],
        payslips: ['/accounts/payslips', 'payslips']
      }

      const endpoint = endpoints[activeTab]
      if (!endpoint) return

      response = await API.get(endpoint[0])
      key = endpoint[1]

      setData(previous => ({
        ...previous,
        [key]: response.data.data || []
      }))
    } catch (err) {
      console.error('Accounts fetch error:', err)
      setError(
        err.response?.data?.message ||
        'Unable to load account information.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isStudent || isAdminOrAccountant) {
      fetchData()
    }
  }, [activeTab])

  const getCurrentData = () => {
    const keys = {
      'my-fees': 'studentFees',
      'my-dues': 'dues',
      'my-payments': 'payments',
      fees: 'fees',
      'student-fees': 'studentFees',
      dues: 'dues',
      payments: 'payments',
      income: 'income',
      expenses: 'expenses',
      payslips: 'payslips'
    }

    return data[keys[activeTab]] || []
  }

  const currentData = getCurrentData()

  const filteredData = currentData.filter(item =>
    Object.values(item).some(value =>
      String(value ?? '').toLowerCase().includes(search.toLowerCase())
    )
  )

  const formatLabel = key =>
    key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())

  const getId = item =>
    item.fee_id ||
    item.income_id ||
    item.expense_id ||
    item.payslip_id ||
    item.student_fee_id ||
    item.payment_id

  // Fields accepted by the existing controller
  const getFields = () => {
    switch (activeTab) {
      case 'fees':
        return [
          { name: 'class_id', label: 'Class ID', type: 'number' },
          { name: 'fee_name', label: 'Fee Name' },
          { name: 'amount', label: 'Amount', type: 'number' },
          {
            name: 'frequency',
            label: 'Frequency',
            type: 'select',
            options: ['monthly', 'yearly', 'one_time']
          },
          { name: 'description', label: 'Description' }
        ]

      case 'student-fees':
        return [
          { name: 'student_id', label: 'Student ID', type: 'number' },
          { name: 'fee_id', label: 'Fee ID', type: 'number' }
        ]

      case 'payments':
        return [
          { name: 'student_id', label: 'Student ID', type: 'number' },
          { name: 'student_fee_id', label: 'Student Fee ID', type: 'number' },
          { name: 'amount', label: 'Payment Amount', type: 'number' },
          {
            name: 'payment_method',
            label: 'Payment Method',
            type: 'select',
            options: ['cash', 'bkash', 'nagad', 'bank', 'card']
          },
          { name: 'transaction_number', label: 'Transaction Number' }
        ]

      case 'income':
        return [
          { name: 'source', label: 'Income Source' },
          { name: 'amount', label: 'Amount', type: 'number' },
          { name: 'income_date', label: 'Income Date', type: 'date' },
          { name: 'description', label: 'Description' }
        ]

      case 'expenses':
        return [
          { name: 'category', label: 'Expense Category' },
          { name: 'amount', label: 'Amount', type: 'number' },
          { name: 'expense_date', label: 'Expense Date', type: 'date' },
          { name: 'description', label: 'Description' }
        ]

      case 'payslips':
        return [
          { name: 'user_id', label: 'Employee User ID', type: 'number' },
          { name: 'salary_month', label: 'Salary Month', placeholder: '2026-11' },
          { name: 'allowance', label: 'Allowance', type: 'number' },
          { name: 'deduction', label: 'Deduction', type: 'number' }
        ]

      default:
        return []
    }
  }

  const openAddForm = () => {
    setEditingId(null)
    setFormError('')

    const initial = {}
    getFields().forEach(field => {
      if (field.type === 'date') initial[field.name] = today
      else if (field.name === 'frequency') initial[field.name] = 'monthly'
      else if (field.name === 'payment_method') initial[field.name] = 'cash'
      else if (field.name === 'allowance' || field.name === 'deduction') {
        initial[field.name] = 0
      } else {
        initial[field.name] = ''
      }
    })

    setFormData(initial)
    setShowForm(true)
  }

  const openEditForm = item => {
    const id = getId(item)

    if (!id) {
      setError('Could not identify this record.')
      return
    }

    setEditingId(id)
    setFormError('')

    const fields = getFields()
    const values = {}

    fields.forEach(field => {
      values[field.name] = item[field.name] ?? ''
    })

    setFormData(values)
    setShowForm(true)
  }

  const handleFormChange = (name, value) => {
    setFormData(previous => ({
      ...previous,
      [name]: value
    }))
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setSaving(true)
    setFormError('')

    try {
      let url = ''
      let method = 'post'

      if (activeTab === 'fees') {
        url = editingId
          ? `/accounts/fee-structures/${editingId}`
          : '/accounts/fee-structures'
        method = editingId ? 'put' : 'post'
      } else if (activeTab === 'student-fees') {
        url = '/accounts/student-fees'
      } else if (activeTab === 'payments') {
        url = '/accounts/payments'
      } else if (activeTab === 'income') {
        url = editingId
          ? `/accounts/income/${editingId}`
          : '/accounts/income'
        method = editingId ? 'put' : 'post'
      } else if (activeTab === 'expenses') {
        url = editingId
          ? `/accounts/expenses/${editingId}`
          : '/accounts/expenses'
        method = editingId ? 'put' : 'post'
      } else if (activeTab === 'payslips') {
        url = '/accounts/payslips'
      }

      const payload = { ...formData }

      Object.keys(payload).forEach(key => {
        if (payload[key] === '') delete payload[key]
      })

      await API[method](url, payload)

      setShowForm(false)
      setEditingId(null)
      await fetchData()
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        'Unable to save this record.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async item => {
    const id = getId(item)
    if (!id) return

    if (!window.confirm('Are you sure you want to delete this record?')) {
      return
    }

    try {
      let url = ''

      if (activeTab === 'fees') {
        url = `/accounts/fee-structures/${id}`
      } else if (activeTab === 'income') {
        url = `/accounts/income/${id}`
      } else if (activeTab === 'expenses') {
        url = `/accounts/expenses/${id}`
      } else {
        return
      }

      await API.delete(url)
      await fetchData()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete this record.'
      )
    }
  }

  const handleMarkPaid = async item => {
    const id = item.payslip_id
    if (!id) return

    const paymentDate = window.prompt(
      'Enter payment date (YYYY-MM-DD):',
      today
    )

    if (!paymentDate) return

    try {
      await API.put(`/accounts/payslips/${id}/pay`, {
        payment_date: paymentDate
      })
      await fetchData()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update payslip.'
      )
    }
  }

  if (!isStudent && !isAdminOrAccountant) {
    return (
      <div className="dashboard-content">
        <div className="content-card">
          <p className="account-message">
            You do not have permission to access Accounts.
          </p>
        </div>
      </div>
    )
  }

  const canAdd = !isStudent &&
    ['fees', 'student-fees', 'payments', 'income', 'expenses', 'payslips'].includes(activeTab)

  const canEdit = !isStudent &&
    ['fees', 'income', 'expenses'].includes(activeTab)

  const canDelete = !isStudent &&
    ['fees', 'income', 'expenses'].includes(activeTab)

  return (
    <div className="dashboard-content">
      <div className="section-title account-heading">
        <div>
          <h2>Fees & Accounts</h2>
          <p>
            {isStudent
              ? 'View your fees, outstanding dues and payment history'
              : 'Manage school fees and financial records'}
          </p>
        </div>
      </div>

      <div className="account-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`account-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id)
              setSearch('')
              setError('')
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="content-card account-list-card">
        <div className="account-table-header">
          <div>
            <h3>{tabs.find(tab => tab.id === activeTab)?.label}</h3>
            <p>Total Records: {currentData.length}</p>
          </div>

          <input
            className="account-search"
            type="search"
            placeholder="Search records..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />

          {canAdd && (
            <button className="account-action-button" onClick={openAddForm}>
              {activeTab === 'student-fees'
                ? '+ Assign Fee'
                : activeTab === 'payments'
                  ? '+ Record Payment'
                  : activeTab === 'payslips'
                    ? '+ Create Payslip'
                    : '+ Add New'}
            </button>
          )}
        </div>

        {loading ? (
          <p className="account-message">Loading records...</p>
        ) : error ? (
          <div className="account-message account-error">
            {error}
            <button onClick={fetchData}>Retry</button>
          </div>
        ) : filteredData.length === 0 ? (
          <p className="account-message">No records found.</p>
        ) : (
          <div className="table-responsive">
            <table className="account-table">
              <thead>
                <tr>
                  {Object.keys(filteredData[0]).map(key => (
                    <th key={key}>{formatLabel(key)}</th>
                  ))}
                  {!isStudent && (
                    <th>Actions</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={getId(item) || index}>
                    {Object.keys(filteredData[0]).map(key => (
                      <td key={key}>
                        {item[key] === null || item[key] === undefined || item[key] === ''
                          ? 'N/A'
                          : typeof item[key] === 'object'
                            ? JSON.stringify(item[key])
                            : String(item[key])}
                      </td>
                    ))}

                    {!isStudent && (
                      <td className="account-row-actions">
                        {canEdit && (
                          <button
                            className="account-edit-button"
                            onClick={() => openEditForm(item)}
                          >
                            Edit
                          </button>
                        )}

                        {canDelete && (
                          <button
                            className="account-delete-button"
                            onClick={() => handleDelete(item)}
                          >
                            Delete
                          </button>
                        )}

                        {activeTab === 'payslips' && (
                          <button
                            className="account-edit-button"
                            onClick={() => handleMarkPaid(item)}
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="account-modal-backdrop">
          <div className="account-modal">
            <div className="account-modal-header">
              <h3>
                {editingId ? 'Update' : 'Add'}{' '}
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h3>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="account-modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {getFields().map(field => (
                <div className="account-form-group" key={field.name}>
                  <label htmlFor={field.name}>{field.label}</label>

                  {field.type === 'select' ? (
                    <select
                      id={field.name}
                      value={formData[field.name] ?? ''}
                      onChange={event =>
                        handleFormChange(field.name, event.target.value)
                      }
                      required
                    >
                      {field.options.map(option => (
                        <option key={option} value={option}>
                          {formatLabel(option)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={field.name}
                      type={field.type || 'text'}
                      placeholder={field.placeholder || field.label}
                      value={formData[field.name] ?? ''}
                      onChange={event =>
                        handleFormChange(field.name, event.target.value)
                      }
                      required={!['description', 'transaction_number', 'allowance', 'deduction'].includes(field.name)}
                      min={field.type === 'number' ? 0 : undefined}
                      step={field.type === 'number' ? '0.01' : undefined}
                    />
                  )}
                </div>
              ))}

              {formError && (
                <p className="account-error">{formError}</p>
              )}

              <div className="account-form-actions">
                <button
                  type="button"
                  className="account-cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="account-action-button"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Accounts

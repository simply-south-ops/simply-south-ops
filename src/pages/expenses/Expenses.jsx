import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronRight } from 'lucide-react'

const emptyForm = {
  event_id: '', paid_by: '', category: 'decor', amount: '',
  date: '', description: '', receipt_url: '', is_reimbursable: true
}

const categories = ['decor', 'transport', 'labour', 'food', 'rental', 'misc']
const sortOptions = [
  { value: 'date_desc', label: 'Date (newest first)' },
  { value: 'date_asc', label: 'Date (oldest first)' },
  { value: 'amount_desc', label: 'Amount (highest first)' },
  { value: 'amount_asc', label: 'Amount (lowest first)' },
  { value: 'category', label: 'Category (A–Z)' },
]

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('date_desc')
  const [collapsed, setCollapsed] = useState({})
  const [initialized, setInitialized] = useState(false)
  const [eventFilter, setEventFilter] = useState('')
  const [uploading, setUploading] = useState(false)

  const fetchAll = async () => {
    const [expRes, evRes, usRes] = await Promise.all([
      fetch('/api/expenses'),
      fetch('/api/events'),
      fetch('/api/users')
    ])
    setExpenses(await expRes.json())
    setEvents(await evRes.json())
    setUsers(await usRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  // default all groups to collapsed on first load
  useEffect(() => {
    if (!initialized && expenses.length > 0) {
      const allKeys = [...new Set(expenses.map(e => e.event_id ? String(e.event_id) : 'none'))]
      const initialCollapsed = {}
      allKeys.forEach(k => { initialCollapsed[k] = true })
      setCollapsed(initialCollapsed)
      setInitialized(true)
    }
  }, [expenses, initialized])

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const data = new FormData()
    data.append('file', file)
    data.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      { method: 'POST', body: data }
    )
    const result = await res.json()
    setForm(f => ({ ...f, receipt_url: result.secure_url }))
    setUploading(false)
  }

  const handleSubmit = async () => {
    if (!form.amount) return alert('Amount is required')
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { ...form, id: editId } : form
    await fetch('/api/expenses', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setForm(emptyForm)
    setEditId(null)
    setShowForm(false)
    fetchAll()
  }

  const handleEdit = (expense) => {
    setForm({
      event_id: expense.event_id, paid_by: expense.paid_by,
      category: expense.category, amount: expense.amount,
      date: expense.date?.split('T')[0], description: expense.description,
      receipt_url: expense.receipt_url || '', is_reimbursable: expense.is_reimbursable
    })
    setEditId(expense.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    await fetch('/api/expenses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchAll()
  }

  const toggleCollapse = (key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const sortExpenses = (list) => {
    const sorted = [...list]
    switch (sortBy) {
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      case 'amount_asc':
        return sorted.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))
      case 'amount_desc':
        return sorted.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
      case 'category':
        return sorted.sort((a, b) => a.category.localeCompare(b.category))
      default:
        return sorted
    }
  }

  const filteredExpenses = eventFilter
    ? expenses.filter(e => String(e.event_id) === eventFilter)
    : expenses

  const grouped = filteredExpenses.reduce((acc, exp) => {
    const key = exp.event_id ? String(exp.event_id) : 'none'
    if (!acc[key]) {
      acc[key] = {
        eventName: exp.event_name || 'No event assigned',
        items: []
      }
    }
    acc[key].items.push(exp)
    return acc
  }, {})

  const groupEntries = Object.entries(grouped)
    .map(([key, group]) => {
      const byPartner = {}
      group.items.forEach(exp => {
        const name = exp.paid_by_name || 'Unassigned'
        byPartner[name] = (byPartner[name] || 0) + parseFloat(exp.amount || 0)
      })
      const partnerTotals = Object.entries(byPartner)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)

      return {
        key,
        eventName: group.eventName,
        items: sortExpenses(group.items),
        total: group.items.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
        partnerTotals
      }
    })
    .sort((a, b) => a.eventName.localeCompare(b.eventName))

  const total = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Total: <span className="font-semibold text-gray-700">${total.toFixed(2)}</span></p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Add Expense</span>
        </button>
      </div>

      {/* Filter + Sort controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          value={eventFilter}
          onChange={e => setEventFilter(e.target.value)}
        >
          <option value="">All events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
        <select
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editId ? 'Edit Expense' : 'New Expense'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.event_id}
                onChange={e => setForm({ ...form, event_id: e.target.value })}
              >
                <option value="">Select event</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.paid_by}
                onChange={e => setForm({ ...form, paid_by: e.target.value })}
              >
                <option value="">Who paid?</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>

              {/* Receipt upload — images or PDF */}
              <div className="border border-dashed border-gray-300 rounded-lg p-3">
                {form.receipt_url ? (
                  <div className="flex items-center justify-between">
                    <a
                      href={form.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium truncate"
                    >
                      View uploaded receipt
                    </a>
                    <button
                      onClick={() => setForm({ ...form, receipt_url: '' })}
                      className="text-xs text-gray-400 hover:text-gray-600 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex items-center justify-center gap-2 text-sm text-gray-500 py-2">
                    {uploading ? 'Uploading...' : 'Upload receipt (image or PDF)'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      disabled={uploading}
                      onChange={handleReceiptUpload}
                    />
                  </label>
                )}
              </div>

              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Amount *"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
              />
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.is_reimbursable}
                  onChange={e => setForm({ ...form, is_reimbursable: e.target.checked })}
                />
                Reimbursable to partner
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="flex-1 bg-rose-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
              >
                {editId ? 'Update' : 'Save'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : groupEntries.length === 0 ? (
        <p className="text-gray-500 text-sm">No expenses yet.</p>
      ) : (
        <div className="space-y-3">
          {groupEntries.map(group => {
            const isCollapsed = collapsed[group.key]
            return (
              <div key={group.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleCollapse(group.key)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? <ChevronRight size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    <span className="font-semibold text-gray-900 text-sm">{group.eventName}</span>
                    <span className="text-xs text-gray-400">({group.items.length})</span>
                  </div>
                  <span className="font-semibold text-gray-700 text-sm">${group.total.toFixed(2)}</span>
                </button>

                {!isCollapsed && (
                  <>
                    {group.partnerTotals.length > 0 && (
                      <div className="px-4 py-3 bg-gray-50/60 border-b border-gray-100 flex flex-wrap gap-x-6 gap-y-1">
                        {group.partnerTotals.map(p => (
                          <div key={p.name} className="text-xs text-gray-600">
                            <span className="font-medium text-gray-800">{p.name}</span>: ${p.amount.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-gray-100">
                      {group.items.map(expense => (
                        <div key={expense.id} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{expense.paid_by_name || '—'}</p>
                            </div>
                            <span className="font-bold text-gray-900">${parseFloat(expense.amount).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">{expense.category}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${expense.is_reimbursable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {expense.is_reimbursable ? 'Reimbursable' : 'Not reimbursable'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">
                            {expense.date ? new Date(expense.date).toLocaleDateString() : '—'}
                          </p>
                          {expense.description && <p className="text-xs text-gray-400 mb-2">{expense.description}</p>}
                          {expense.receipt_url && (
                            <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs text-rose-600 font-medium block mb-2">
                              View receipt
                            </a>
                          )}
                          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                            <button onClick={() => handleEdit(expense)} className="text-xs text-gray-500 font-medium">Edit</button>
                            <button onClick={() => handleDelete(expense.id)} className="text-xs text-rose-600 font-medium">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <table className="hidden md:table w-full text-sm">
                      <thead className="bg-gray-50 border-b border-t border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Paid By</th>
                          <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Category</th>
                          <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Amount</th>
                          <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Date</th>
                          <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Description</th>
                          <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Reimburse</th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {group.items.map(expense => (
                          <tr key={expense.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{expense.paid_by_name || '—'}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">{expense.category}</span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">${parseFloat(expense.amount).toFixed(2)}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {expense.date ? new Date(expense.date).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                              {expense.description || '—'}
                              {expense.receipt_url && (
                                <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="block text-rose-600 font-medium text-xs mt-0.5">
                                  View receipt
                                </a>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${expense.is_reimbursable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {expense.is_reimbursable ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 justify-end">
                                <button onClick={() => handleEdit(expense)} className="text-gray-400 hover:text-gray-600">
                                  <Pencil size={15} />
                                </button>
                                <button onClick={() => handleDelete(expense.id)} className="text-gray-400 hover:text-rose-600">
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
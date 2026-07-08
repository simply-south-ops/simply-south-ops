import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const emptyForm = {
  event_id: '', paid_by: '', category: 'decor', amount: '',
  date: '', description: '', receipt_url: '', is_reimbursable: true
}

const categories = ['decor', 'transport', 'labour', 'food', 'rental', 'misc']

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)

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
      receipt_url: expense.receipt_url, is_reimbursable: expense.is_reimbursable
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

  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
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
                className="flex-1 bg-rose-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-rose-700"
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
      ) : expenses.length === 0 ? (
        <p className="text-gray-500 text-sm">No expenses yet.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {expenses.map(expense => (
              <div key={expense.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{expense.paid_by_name || '—'}</p>
                    <p className="text-xs text-gray-500">{expense.event_name || '—'}</p>
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
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <button onClick={() => handleEdit(expense)} className="text-xs text-gray-500 font-medium">Edit</button>
                  <button onClick={() => handleDelete(expense.id)} className="text-xs text-rose-600 font-medium">Delete</button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Event</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Paid By</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Category</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Description</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Reimburse</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{expense.event_name || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{expense.paid_by_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">{expense.category}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">${parseFloat(expense.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {expense.date ? new Date(expense.date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{expense.description || '—'}</td>
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
          </div>
        </>
      )}
    </div>
  )
}

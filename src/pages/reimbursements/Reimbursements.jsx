import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const emptyForm = {
  expense_id: '', partner_id: '', amount_owed: '', is_paid: false,
  payment_mode: 'cash', paid_date: '', notes: ''
}

const paymentModes = ['cash', 'interac', 'e-transfer', 'other']

export default function Reimbursements() {
  const [reimbursements, setReimbursements] = useState([])
  const [expenses, setExpenses] = useState([])
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    const [rRes, eRes, uRes] = await Promise.all([
      fetch('/api/reimbursements'),
      fetch('/api/expenses'),
      fetch('/api/users')
    ])
    setReimbursements(await rRes.json())
    setExpenses(await eRes.json())
    setUsers(await uRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleSubmit = async () => {
    if (!form.expense_id || !form.partner_id) return alert('Expense and partner are required')
    if (!form.amount_owed) return alert('Amount owed is required')
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { ...form, id: editId } : form
    await fetch('/api/reimbursements', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setForm(emptyForm)
    setEditId(null)
    setShowForm(false)
    fetchAll()
  }

  const handleEdit = (r) => {
    setForm({
      expense_id: r.expense_id, partner_id: r.partner_id,
      amount_owed: r.amount_owed, is_paid: r.is_paid,
      payment_mode: r.payment_mode || 'cash',
      paid_date: r.paid_date?.split('T')[0] || '', notes: r.notes
    })
    setEditId(r.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this reimbursement record?')) return
    await fetch('/api/reimbursements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchAll()
  }

  const outstanding = reimbursements.filter(r => !r.is_paid)
  const outstandingTotal = outstanding.reduce((sum, r) => sum + parseFloat(r.amount_owed || 0), 0)

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reimbursements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Outstanding: <span className="font-semibold text-gray-700">${outstandingTotal.toFixed(2)}</span> · {outstanding.length} unpaid
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Add Reimbursement</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editId ? 'Edit Reimbursement' : 'New Reimbursement'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.expense_id}
                onChange={e => setForm({ ...form, expense_id: e.target.value })}
              >
                <option value="">Select expense *</option>
                {expenses.map(exp => (
                  <option key={exp.id} value={exp.id}>
                    {exp.event_name || 'No event'} — {exp.category} — ${parseFloat(exp.amount).toFixed(2)} ({exp.paid_by_name})
                  </option>
                ))}
              </select>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.partner_id}
                onChange={e => setForm({ ...form, partner_id: e.target.value })}
              >
                <option value="">Partner to reimburse *</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <input
                type="number"
                step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Amount owed *"
                value={form.amount_owed}
                onChange={e => setForm({ ...form, amount_owed: e.target.value })}
              />
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.payment_mode}
                onChange={e => setForm({ ...form, payment_mode: e.target.value })}
              >
                {paymentModes.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.is_paid}
                  onChange={e => setForm({ ...form, is_paid: e.target.checked })}
                />
                Paid
              </label>
              {form.is_paid && (
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={form.paid_date}
                  onChange={e => setForm({ ...form, paid_date: e.target.value })}
                />
              )}
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Notes"
                rows={2}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
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
      ) : reimbursements.length === 0 ? (
        <p className="text-gray-500 text-sm">No reimbursements tracked yet.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {reimbursements.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{r.partner_name || '—'}</p>
                    <p className="text-xs text-gray-500">{r.event_name || '—'} · {r.expense_category}</p>
                  </div>
                  <span className="font-bold text-gray-900">${parseFloat(r.amount_owed).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.is_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {r.is_paid ? 'Paid' : 'Unpaid'}
                  </span>
                  {r.payment_mode && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">{r.payment_mode}</span>
                  )}
                </div>
                {r.paid_date && <p className="text-xs text-gray-500">Paid {new Date(r.paid_date).toLocaleDateString()}</p>}
                <div className="flex items-center gap-3 pt-2 mt-2 border-t border-gray-100">
                  <button onClick={() => handleEdit(r)} className="text-xs text-gray-500 font-medium">Edit</button>
                  <button onClick={() => handleDelete(r.id)} className="text-xs text-rose-600 font-medium">Delete</button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Partner</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Event / Expense</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Mode</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Paid Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reimbursements.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.partner_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.event_name || '—'} · {r.expense_category}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">${parseFloat(r.amount_owed).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.is_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.is_paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{r.payment_mode || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.paid_date ? new Date(r.paid_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleEdit(r)} className="text-gray-400 hover:text-gray-600">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-rose-600">
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

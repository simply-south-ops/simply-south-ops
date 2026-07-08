import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const emptyForm = {
  event_id: '', user_id: '', hours: '', rate_per_hour: '', date: '', notes: ''
}

export default function Labour() {
  const [logs, setLogs] = useState([])
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    const [logRes, evRes, usRes] = await Promise.all([
      fetch('/api/labour'),
      fetch('/api/events'),
      fetch('/api/users')
    ])
    setLogs(await logRes.json())
    setEvents(await evRes.json())
    setUsers(await usRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleSubmit = async () => {
    if (!form.event_id || !form.user_id) return alert('Event and partner are required')
    if (!form.hours || !form.rate_per_hour) return alert('Hours and rate are required')
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { ...form, id: editId } : form
    await fetch('/api/labour', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setForm(emptyForm)
    setEditId(null)
    setShowForm(false)
    fetchAll()
  }

  const handleEdit = (log) => {
    setForm({
      event_id: log.event_id, user_id: log.user_id, hours: log.hours,
      rate_per_hour: log.rate_per_hour, date: log.date?.split('T')[0], notes: log.notes
    })
    setEditId(log.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this labour log?')) return
    await fetch('/api/labour', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchAll()
  }

  const previewTotal = (form.hours && form.rate_per_hour)
    ? (parseFloat(form.hours) * parseFloat(form.rate_per_hour)).toFixed(2)
    : '0.00'

  const grandTotal = logs.reduce((sum, l) => sum + parseFloat(l.total_pay || 0), 0)

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Labour</h1>
          <p className="text-sm text-gray-500 mt-1">
            Total paid: <span className="font-semibold text-gray-700">${grandTotal.toFixed(2)}</span>
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Log Hours</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editId ? 'Edit Labour Log' : 'New Labour Log'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.event_id}
                onChange={e => setForm({ ...form, event_id: e.target.value })}
              >
                <option value="">Select event *</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.user_id}
                onChange={e => setForm({ ...form, user_id: e.target.value })}
              >
                <option value="">Select partner *</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.5"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Hours *"
                  value={form.hours}
                  onChange={e => setForm({ ...form, hours: e.target.value })}
                />
                <input
                  type="number"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Rate / hour *"
                  value={form.rate_per_hour}
                  onChange={e => setForm({ ...form, rate_per_hour: e.target.value })}
                />
              </div>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Notes"
                rows={2}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                Total pay: <span className="font-semibold">${previewTotal}</span>
              </div>
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
      ) : logs.length === 0 ? (
        <p className="text-gray-500 text-sm">No labour logs yet.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {logs.map(log => (
              <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{log.user_name || '—'}</p>
                    <p className="text-xs text-gray-500">{log.event_name || '—'}</p>
                  </div>
                  <span className="font-bold text-gray-900">${parseFloat(log.total_pay).toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  {log.hours}h × ${parseFloat(log.rate_per_hour).toFixed(2)}/hr
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  {log.date ? new Date(log.date).toLocaleDateString() : '—'}
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <button onClick={() => handleEdit(log)} className="text-xs text-gray-500 font-medium">Edit</button>
                  <button onClick={() => handleDelete(log.id)} className="text-xs text-rose-600 font-medium">Delete</button>
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
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Partner</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Hours</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Rate</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Total</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{log.event_name || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{log.user_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{log.hours}</td>
                    <td className="px-4 py-3 text-gray-600">${parseFloat(log.rate_per_hour).toFixed(2)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">${parseFloat(log.total_pay).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {log.date ? new Date(log.date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleEdit(log)} className="text-gray-400 hover:text-gray-600">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(log.id)} className="text-gray-400 hover:text-rose-600">
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

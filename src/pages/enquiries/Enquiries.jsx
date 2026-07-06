import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const emptyForm = {
  client_name: '', phone: '', email: '', event_date: '',
  event_type: '', status: 'new', notes: ''
}

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  follow_up: 'bg-yellow-100 text-yellow-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700'
}

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchEnquiries = async () => {
    const res = await fetch('/api/enquiries')
    const data = await res.json()
    setEnquiries(data)
    setLoading(false)
  }

  useEffect(() => { fetchEnquiries() }, [])

  const handleSubmit = async () => {
    if (!form.client_name) return alert('Client name is required')
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { ...form, id: editId } : form
    await fetch('/api/enquiries', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setForm(emptyForm)
    setEditId(null)
    setShowForm(false)
    fetchEnquiries()
  }

  const handleEdit = (enquiry) => {
    setForm({
      client_name: enquiry.client_name, phone: enquiry.phone,
      email: enquiry.email, event_date: enquiry.event_date?.split('T')[0],
      event_type: enquiry.event_type, status: enquiry.status, notes: enquiry.notes
    })
    setEditId(enquiry.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this enquiry?')) return
    await fetch('/api/enquiries', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchEnquiries()
  }

  const counts = {
    new: enquiries.filter(e => e.status === 'new').length,
    follow_up: enquiries.filter(e => e.status === 'follow_up').length,
    converted: enquiries.filter(e => e.status === 'converted').length,
    lost: enquiries.filter(e => e.status === 'lost').length,
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700"
        >
          <Plus size={16} /> Add Enquiry
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'New', key: 'new', color: 'bg-blue-50 text-blue-700' },
          { label: 'Follow Up', key: 'follow_up', color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Converted', key: 'converted', color: 'bg-green-50 text-green-700' },
          { label: 'Lost', key: 'lost', color: 'bg-red-50 text-red-700' },
        ].map(({ label, key, color }) => (
          <div key={key} className={`rounded-xl p-4 ${color}`}>
            <p className="text-2xl font-bold">{counts[key]}</p>
            <p className="text-sm font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editId ? 'Edit Enquiry' : 'New Enquiry'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Client name *"
                value={form.client_name}
                onChange={e => setForm({ ...form, client_name: e.target.value })}
              />
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Phone"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={form.event_date}
                  onChange={e => setForm({ ...form, event_date: e.target.value })}
                />
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Event type"
                  value={form.event_type}
                  onChange={e => setForm({ ...form, event_type: e.target.value })}
                />
              </div>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="new">New</option>
                <option value="follow_up">Follow Up</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Notes"
                rows={3}
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
      ) : enquiries.length === 0 ? (
        <p className="text-gray-500 text-sm">No enquiries yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Client</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Phone</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Event Type</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Event Date</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enquiries.map(enquiry => (
                <tr key={enquiry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{enquiry.client_name}</td>
                  <td className="px-4 py-3 text-gray-600">{enquiry.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{enquiry.event_type || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {enquiry.event_date ? new Date(enquiry.event_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[enquiry.status]}`}>
                      {enquiry.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{enquiry.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => handleEdit(enquiry)} className="text-gray-400 hover:text-gray-600">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(enquiry.id)} className="text-gray-400 hover:text-rose-600">
                        <Trash2 size={15} />
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
  )
}
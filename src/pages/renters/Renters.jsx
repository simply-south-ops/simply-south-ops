import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const emptyForm = { name: '', phone: '', email: '', notes: '' }

export default function Renters() {
  const [renters, setRenters] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchRenters = async () => {
    const res = await fetch('/api/rental-system?resource=renters')
    const data = await res.json()
    setRenters(data)
    setLoading(false)
  }

  useEffect(() => { fetchRenters() }, [])

  const handleSubmit = async () => {
    if (!form.name) return alert('Renter name is required')
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { ...form, id: editId } : form
    await fetch('/api/rental-system?resource=renters', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, resource: 'renters' })
    })
    setForm(emptyForm)
    setEditId(null)
    setShowForm(false)
    fetchRenters()
  }

  const handleEdit = (renter) => {
    setForm({ name: renter.name, phone: renter.phone, email: renter.email, notes: renter.notes })
    setEditId(renter.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this renter?')) return
    await fetch('/api/rental-system?resource=renters', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchRenters()
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Renters</h1>
          <p className="text-sm text-gray-500 mt-1">People and businesses renting your inventory</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Add Renter</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editId ? 'Edit Renter' : 'New Renter'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Full name *"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
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
      ) : renters.length === 0 ? (
        <p className="text-gray-500 text-sm">No renters yet.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {renters.map(renter => (
              <div key={renter.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900 text-sm mb-1">{renter.name}</p>
                {renter.phone && <p className="text-xs text-gray-500">{renter.phone}</p>}
                {renter.email && <p className="text-xs text-gray-500">{renter.email}</p>}
                {renter.notes && <p className="text-xs text-gray-400 mt-2">{renter.notes}</p>}
                <div className="flex items-center gap-3 pt-2 mt-2 border-t border-gray-100">
                  <button onClick={() => handleEdit(renter)} className="text-xs text-gray-500 font-medium">Edit</button>
                  <button onClick={() => handleDelete(renter.id)} className="text-xs text-rose-600 font-medium">Delete</button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Notes</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {renters.map(renter => (
                  <tr key={renter.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{renter.name}</td>
                    <td className="px-4 py-3 text-gray-600">{renter.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{renter.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{renter.notes || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleEdit(renter)} className="text-gray-400 hover:text-gray-600">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(renter.id)} className="text-gray-400 hover:text-rose-600">
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
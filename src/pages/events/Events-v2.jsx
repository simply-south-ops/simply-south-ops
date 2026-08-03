import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const emptyForm = {
  name: '', client_id: '', event_date: '', venue: '', event_type: '',
  status: 'enquiry', quote_amount: '', deposit_paid: '', balance_due: '',
  is_paid: false, payment_method: '', notes: '', is_internal: false,
  source_enquiry_id: ''
}

const statusColors = {
  enquiry: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [clients, setClients] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [convertingFrom, setConvertingFrom] = useState('')

  const fetchAll = async () => {
    const [evRes, clRes, enRes] = await Promise.all([
      fetch('/api/events'),
      fetch('/api/clients'),
      fetch('/api/enquiries')
    ])
    setEvents(await evRes.json())
    setClients(await clRes.json())
    setEnquiries((await enRes.json()).filter(e => e.status !== 'converted'))
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleConvertFrom = (enquiryId) => {
    setConvertingFrom(enquiryId)
    if (!enquiryId) return
    const enquiry = enquiries.find(e => e.id === parseInt(enquiryId))
    if (!enquiry) return

    // Try to match an existing client by name (case-insensitive)
    const existingClient = clients.find(
      c => c.name.trim().toLowerCase() === enquiry.client_name.trim().toLowerCase()
    )

    setForm(f => ({
      ...f,
      name: `${enquiry.client_name}'s ${enquiry.event_type || 'Event'}`,
      client_id: existingClient ? existingClient.id : '',
      event_date: enquiry.event_date?.split('T')[0] || '',
      event_type: enquiry.event_type || '',
      notes: enquiry.notes || '',
      source_enquiry_id: enquiry.id,
      _needsNewClient: !existingClient,
      _newClientData: !existingClient ? {
        name: enquiry.client_name, phone: enquiry.phone, email: enquiry.email
      } : null
    }))
  }

  const handleSubmit = async () => {
    if (!form.name) return alert('Event name is required')

    let clientId = form.client_id

    // If converting from an enquiry with no matching client, create one first
    if (form._needsNewClient && form._newClientData) {
      const clientRes = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form._newClientData)
      })
      const newClient = await clientRes.json()
      clientId = newClient.id
    }

    const { _needsNewClient, _newClientData, ...cleanForm } = form
    const method = editId ? 'PUT' : 'POST'
    const body = editId
      ? { ...cleanForm, client_id: clientId, id: editId }
      : { ...cleanForm, client_id: clientId }

    await fetch('/api/events', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setForm(emptyForm)
    setEditId(null)
    setConvertingFrom('')
    setShowForm(false)
    fetchAll()
  }

  const handleEdit = (event) => {
    setForm({
      name: event.name, client_id: event.client_id, event_date: event.event_date?.split('T')[0],
      venue: event.venue, event_type: event.event_type, status: event.status,
      quote_amount: event.quote_amount, deposit_paid: event.deposit_paid,
      balance_due: event.balance_due, is_paid: event.is_paid,
      payment_method: event.payment_method, notes: event.notes, is_internal: event.is_internal,
      source_enquiry_id: ''
    })
    setConvertingFrom('')
    setEditId(event.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return
    await fetch('/api/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchAll()
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); setConvertingFrom('') }}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Add Event</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editId ? 'Edit Event' : 'New Event'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>

            {!editId && enquiries.length > 0 && (
              <div className="mb-4 bg-blue-50 rounded-lg p-3">
                <label className="text-xs font-medium text-blue-700 mb-1 block">
                  Convert from an enquiry (optional)
                </label>
                <select
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white"
                  value={convertingFrom}
                  onChange={e => handleConvertFrom(e.target.value)}
                >
                  <option value="">— Start blank —</option>
                  {enquiries.map(en => (
                    <option key={en.id} value={en.id}>
                      {en.client_name} — {en.event_type || 'Unspecified'} — {en.event_date ? new Date(en.event_date).toLocaleDateString() : 'No date'}
                    </option>
                  ))}
                </select>
                {form._needsNewClient && (
                  <p className="text-xs text-blue-600 mt-1">
                    No matching client found — a new client record will be created for {form._newClientData?.name} on save.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="sm:col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Event name *"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.client_id}
                onChange={e => setForm({ ...form, client_id: e.target.value, _needsNewClient: false, _newClientData: null })}
                disabled={form._needsNewClient}
              >
                <option value="">
                  {form._needsNewClient ? `New: ${form._newClientData?.name}` : 'Select client'}
                </option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.event_date}
                onChange={e => setForm({ ...form, event_date: e.target.value })}
              />
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Venue"
                value={form.venue}
                onChange={e => setForm({ ...form, venue: e.target.value })}
              />
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Event type (e.g. Birthday, Baby Shower)"
                value={form.event_type}
                onChange={e => setForm({ ...form, event_type: e.target.value })}
              />
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="enquiry">Enquiry</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Payment method"
                value={form.payment_method}
                onChange={e => setForm({ ...form, payment_method: e.target.value })}
              />
              <input
                type="number"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Quote amount"
                value={form.quote_amount}
                onChange={e => setForm({ ...form, quote_amount: e.target.value })}
              />
              <input
                type="number"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Deposit paid"
                value={form.deposit_paid}
                onChange={e => setForm({ ...form, deposit_paid: e.target.value })}
              />
              <input
                type="number"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Balance due"
                value={form.balance_due}
                onChange={e => setForm({ ...form, balance_due: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.is_paid}
                  onChange={e => setForm({ ...form, is_paid: e.target.checked })}
                />
                Fully paid
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.is_internal}
                  onChange={e => setForm({ ...form, is_internal: e.target.checked })}
                />
                Internal event (not a client booking)
              </label>
              <textarea
                className="sm:col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
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
      ) : events.length === 0 ? (
        <p className="text-gray-500 text-sm">No events yet. Add your first event.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{event.name}</p>
                    <p className="text-xs text-gray-500">{event.client_name || '—'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[event.status]}`}>
                    {event.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  {event.event_date ? new Date(event.event_date).toLocaleDateString() : '—'} · {event.event_type || '—'}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-gray-900">${event.quote_amount || '0'}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.is_paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {event.is_paid ? 'Paid' : 'Pending'}
                  </span>
                </div>
                {event.is_internal && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    Internal
                  </span>
                )}
                <div className="flex items-center gap-3 pt-2 mt-2 border-t border-gray-100">
                  <button onClick={() => handleEdit(event)} className="text-xs text-gray-500 font-medium">Edit</button>
                  <button onClick={() => handleDelete(event.id)} className="text-xs text-rose-600 font-medium">Delete</button>
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
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Client</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Quote</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Paid</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map(event => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {event.name}
                      {event.is_internal && (
                        <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          Internal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{event.client_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {event.event_date ? new Date(event.event_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{event.event_type || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[event.status]}`}>
                        {event.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">${event.quote_amount || '0'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.is_paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {event.is_paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleEdit(event)} className="text-gray-400 hover:text-gray-600">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(event.id)} className="text-gray-400 hover:text-rose-600">
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

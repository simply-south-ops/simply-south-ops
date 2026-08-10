import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const emptyForm = {
  renter_id: '', inventory_id: '', quantity: '', pickup_date: '', return_date: '',
  rental_amount: '', deposit_amount: '', deposit_returned: false,
  additional_charges: '', discounts: '', payment_status: 'pending',
  payment_method: '', notes: '', status: 'booked'
}

const statusColors = {
  booked: 'bg-blue-100 text-blue-700',
  out_on_rent: 'bg-amber-100 text-amber-700',
  returned: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600'
}

const paymentStatuses = ['pending', 'partial', 'paid']
const paymentMethods = ['cash', 'interac', 'e-transfer', 'other']

export default function Rentals() {
  const [rentals, setRentals] = useState([])
  const [renters, setRenters] = useState([])
  const [inventory, setInventory] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    const [rRes, rtRes, invRes] = await Promise.all([
      fetch('/api/rental-system?resource=rentals'),
      fetch('//api/rental-system?resource=renters'),
      fetch('/api/inventory')
    ])
    setRentals(await rRes.json())
    setRenters(await rtRes.json())
    setInventory((await invRes.json()).filter(i => i.rentable))
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleSubmit = async () => {
    if (!form.renter_id || !form.inventory_id) return alert('Renter and item are required')
    if (!form.quantity || !form.pickup_date || !form.return_date) return alert('Quantity, pickup date, and return date are required')
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { ...form, id: editId } : form
    await fetch('/api/rental-system?resource=rentals', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setForm(emptyForm)
    setEditId(null)
    setShowForm(false)
    fetchAll()
  }

  const handleEdit = (rental) => {
    setForm({
      renter_id: rental.renter_id, inventory_id: rental.inventory_id,
      quantity: rental.quantity, pickup_date: rental.pickup_date?.split('T')[0],
      return_date: rental.return_date?.split('T')[0], rental_amount: rental.rental_amount || '',
      deposit_amount: rental.deposit_amount || '', deposit_returned: rental.deposit_returned,
      additional_charges: rental.additional_charges || '', discounts: rental.discounts || '',
      payment_status: rental.payment_status, payment_method: rental.payment_method || '',
      notes: rental.notes, status: rental.status
    })
    setEditId(rental.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this rental?')) return
    await fetch('/api/rental-system?resource=rentals', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchAll()
  }

  const isOverdue = (rental) => {
    return rental.status === 'out_on_rent' && new Date(rental.return_date) < new Date()
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rentals</h1>
          <p className="text-sm text-gray-500 mt-1">{rentals.length} rental records</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700"
        >
          <Plus size={16} /> <span className="hidden sm:inline">New Rental</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editId ? 'Edit Rental' : 'New Rental'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.renter_id}
                onChange={e => setForm({ ...form, renter_id: e.target.value })}
              >
                <option value="">Select renter *</option>
                {renters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.inventory_id}
                onChange={e => setForm({ ...form, inventory_id: e.target.value })}
              >
                <option value="">Select item *</option>
                {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (total: {i.quantity})</option>)}
              </select>
              <input
                type="number"
                min="1"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Quantity *"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })}
              />
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="booked">Booked</option>
                <option value="out_on_rent">Out on Rent</option>
                <option value="returned">Returned</option>
                <option value="closed">Closed</option>
              </select>
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Pickup date"
                value={form.pickup_date}
                onChange={e => setForm({ ...form, pickup_date: e.target.value })}
              />
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Return date"
                value={form.return_date}
                onChange={e => setForm({ ...form, return_date: e.target.value })}
              />
              <input
                type="number"
                step="0.01"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Rental amount"
                value={form.rental_amount}
                onChange={e => setForm({ ...form, rental_amount: e.target.value })}
              />
              <input
                type="number"
                step="0.01"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Deposit amount"
                value={form.deposit_amount}
                onChange={e => setForm({ ...form, deposit_amount: e.target.value })}
              />
              <input
                type="number"
                step="0.01"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Additional charges"
                value={form.additional_charges}
                onChange={e => setForm({ ...form, additional_charges: e.target.value })}
              />
              <input
                type="number"
                step="0.01"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Discounts"
                value={form.discounts}
                onChange={e => setForm({ ...form, discounts: e.target.value })}
              />
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.payment_status}
                onChange={e => setForm({ ...form, payment_status: e.target.value })}
              >
                {paymentStatuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.payment_method}
                onChange={e => setForm({ ...form, payment_method: e.target.value })}
              >
                <option value="">Payment method</option>
                {paymentMethods.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.deposit_returned}
                  onChange={e => setForm({ ...form, deposit_returned: e.target.checked })}
                />
                Deposit returned to renter
              </label>
              <textarea
                className="sm:col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
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
      ) : rentals.length === 0 ? (
        <p className="text-gray-500 text-sm">No rentals yet.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {rentals.map(rental => (
              <div key={rental.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{rental.item_name || '—'}</p>
                    <p className="text-xs text-gray-500">{rental.renter_name || '—'} · Qty: {rental.quantity}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[rental.status]}`}>
                    {rental.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  {new Date(rental.pickup_date).toLocaleDateString()} → {new Date(rental.return_date).toLocaleDateString()}
                </p>
                {isOverdue(rental) && (
                  <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium mb-1">Overdue</span>
                )}
                <p className="text-sm font-bold text-gray-900">${parseFloat(rental.rental_amount || 0).toFixed(2)}</p>
                <div className="flex items-center gap-3 pt-2 mt-2 border-t border-gray-100">
                  <button onClick={() => handleEdit(rental)} className="text-xs text-gray-500 font-medium">Edit</button>
                  <button onClick={() => handleDelete(rental.id)} className="text-xs text-rose-600 font-medium">Delete</button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Item</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Renter</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Qty</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Pickup</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Return</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rentals.map(rental => (
                  <tr key={rental.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{rental.item_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{rental.renter_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{rental.quantity}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(rental.pickup_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(rental.return_date).toLocaleDateString()}
                      {isOverdue(rental) && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Overdue</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">${parseFloat(rental.rental_amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[rental.status]}`}>
                        {rental.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleEdit(rental)} className="text-gray-400 hover:text-gray-600">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(rental.id)} className="text-gray-400 hover:text-rose-600">
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
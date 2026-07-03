import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Image } from 'lucide-react'

const emptyForm = {
  name: '', category: '', purchase_date: '', cost: '',
  condition: 'good', photo_url: '', notes: ''
}

const conditions = ['good', 'fair', 'damaged']

export default function Inventory() {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchItems = async () => {
    const res = await fetch('/api/inventory')
    const data = await res.json()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [])

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const data = new FormData()
    data.append('file', file)
    data.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: data }
    )
    const result = await res.json()
    setForm(f => ({ ...f, photo_url: result.secure_url }))
    setUploading(false)
  }

  const handleSubmit = async () => {
    if (!form.name) return alert('Item name is required')
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { ...form, id: editId } : form
    await fetch('/api/inventory', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setForm(emptyForm)
    setEditId(null)
    setShowForm(false)
    fetchItems()
  }

  const handleEdit = (item) => {
    setForm({
      name: item.name, category: item.category,
      purchase_date: item.purchase_date?.split('T')[0],
      cost: item.cost, condition: item.condition,
      photo_url: item.photo_url, notes: item.notes
    })
    setEditId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    await fetch('/api/inventory', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchItems()
  }

  const conditionColors = {
    good: 'bg-green-100 text-green-700',
    fair: 'bg-yellow-100 text-yellow-700',
    damaged: 'bg-red-100 text-red-700'
  }

  const totalValue = items.reduce((sum, i) => sum + parseFloat(i.cost || 0), 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            {items.length} items · Total value: <span className="font-semibold text-gray-700">${totalValue.toFixed(2)}</span>
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editId ? 'Edit Item' : 'New Item'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Item name *"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Category (e.g. Backdrop, Floral, Lighting)"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={form.purchase_date}
                  onChange={e => setForm({ ...form, purchase_date: e.target.value })}
                />
                <input
                  type="number"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Cost"
                  value={form.cost}
                  onChange={e => setForm({ ...form, cost: e.target.value })}
                />
              </div>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.condition}
                onChange={e => setForm({ ...form, condition: e.target.value })}
              >
                {conditions.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>

              {/* Photo upload */}
              <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                {form.photo_url ? (
                  <div className="space-y-2">
                    <img src={form.photo_url} alt="preview" className="w-full h-40 object-cover rounded-lg" />
                    <button
                      onClick={() => setForm({ ...form, photo_url: '' })}
                      className="text-xs text-rose-600 hover:text-rose-700"
                    >
                      Remove photo
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Image size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      {uploading ? 'Uploading...' : 'Click to upload photo'}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

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
                disabled={uploading}
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
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-sm">No inventory items yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {item.photo_url ? (
                <img src={item.photo_url} alt={item.name} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                  <Image size={32} className="text-gray-300" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{item.category || '—'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${conditionColors[item.condition]}`}>
                    {item.condition}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-semibold text-gray-900">${parseFloat(item.cost || 0).toFixed(2)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-gray-600">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-rose-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {item.notes && <p className="text-xs text-gray-400 mt-2">{item.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
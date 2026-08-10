import { useState, useEffect } from 'react'
import { Copy, Trash2, Check } from 'lucide-react'

const statusColors = {
  draft: 'bg-gray-100 text-gray-600',
  ready: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-400'
}

export default function Marketplace() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [copiedId, setCopiedId] = useState(null)

  const fetchListings = async () => {
    const res = await fetch('/api/rental-system?resource=listings')
    setListings(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchListings() }, [])

  const startEdit = (listing) => {
    setEditForm({
      title: listing.title, description: listing.description,
      suggested_price: listing.suggested_price || '', suggested_deposit: listing.suggested_deposit || '',
      dimensions: listing.dimensions || '', whats_included: listing.whats_included || '',
      rental_terms: listing.rental_terms || '', pickup_return_info: listing.pickup_return_info || '',
      photo_guidance: listing.photo_guidance || '', keywords: listing.keywords || '',
      status: listing.status
    })
    setEditingId(listing.id)
  }

  const saveEdit = async () => {
    await fetch('/api/rental-system?resource=listings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource: 'listings', id: editingId, ...editForm })
    })
    setEditingId(null)
    fetchListings()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this listing?')) return
    await fetch('/api/rental-system?resource=listings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource: 'listings', id })
    })
    fetchListings()
  }

  const buildCopyText = (listing) => {
    return `${listing.title}

${listing.description}

💰 Suggested price: $${listing.suggested_price || 'TBD'}
🔒 Deposit: $${listing.suggested_deposit || 'TBD'}

What's included:
${listing.whats_included || '—'}

Rental terms:
${listing.rental_terms || '—'}

Pickup & return:
${listing.pickup_return_info || '—'}

Tags: ${listing.keywords || '—'}`
  }

  const handleCopy = (listing) => {
    navigator.clipboard.writeText(buildCopyText(listing))
    setCopiedId(listing.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marketplace Listings</h1>
        <p className="text-sm text-gray-500 mt-1">Generated from rentable inventory — edit, then copy-paste to Facebook Marketplace</p>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No listings yet. Go to Inventory and click "Generate Listing" on a rentable item.
        </p>
      ) : (
        <div className="space-y-4">
          {listings.map(listing => (
            <div key={listing.id} className="bg-white rounded-xl border border-gray-200 p-5">
              {editingId === listing.id ? (
                <div className="space-y-3">
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium"
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  />
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    rows={3}
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="0.01"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      placeholder="Suggested price"
                      value={editForm.suggested_price}
                      onChange={e => setEditForm({ ...editForm, suggested_price: e.target.value })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      placeholder="Suggested deposit"
                      value={editForm.suggested_deposit}
                      onChange={e => setEditForm({ ...editForm, suggested_deposit: e.target.value })}
                    />
                  </div>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Dimensions / specifications"
                    value={editForm.dimensions}
                    onChange={e => setEditForm({ ...editForm, dimensions: e.target.value })}
                  />
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="What's included"
                    rows={2}
                    value={editForm.whats_included}
                    onChange={e => setEditForm({ ...editForm, whats_included: e.target.value })}
                  />
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Rental terms"
                    rows={2}
                    value={editForm.rental_terms}
                    onChange={e => setEditForm({ ...editForm, rental_terms: e.target.value })}
                  />
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Pickup & return info"
                    rows={2}
                    value={editForm.pickup_return_info}
                    onChange={e => setEditForm({ ...editForm, pickup_return_info: e.target.value })}
                  />
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Photo guidance"
                    rows={2}
                    value={editForm.photo_guidance}
                    onChange={e => setEditForm({ ...editForm, photo_guidance: e.target.value })}
                  />
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Keywords / tags"
                    value={editForm.keywords}
                    onChange={e => setEditForm({ ...editForm, keywords: e.target.value })}
                  />
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 bg-rose-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-rose-700">
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {listing.item_name} · Qty {listing.item_quantity} · {listing.condition}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[listing.status]}`}>
                      {listing.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{listing.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span>Price: <span className="font-medium text-gray-700">${listing.suggested_price || 'TBD'}</span></span>
                    <span>Deposit: <span className="font-medium text-gray-700">${listing.suggested_deposit || 'TBD'}</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCopy(listing)}
                      className="flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700"
                    >
                      {copiedId === listing.id ? <Check size={13} /> : <Copy size={13} />}
                      {copiedId === listing.id ? 'Copied!' : 'Copy for Facebook'}
                    </button>
                    <button onClick={() => startEdit(listing)} className="text-xs text-gray-500 font-medium">Edit</button>
                    <button onClick={() => handleDelete(listing.id)} className="text-xs text-rose-600 font-medium flex items-center gap-1">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
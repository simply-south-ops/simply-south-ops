import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const paymentModes = ['cash', 'interac', 'e-transfer', 'other']

export default function Reimbursements() {
  const [reimbursements, setReimbursements] = useState([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState(null)
  const [payForm, setPayForm] = useState({ payment_mode: 'cash', paid_date: '', notes: '' })

  const fetchAll = async () => {
    const res = await fetch('/api/reimbursements')
    setReimbursements(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const openPayModal = (r) => {
    setPayForm({ payment_mode: 'cash', paid_date: new Date().toISOString().split('T')[0], notes: '' })
    setPayingId(r.id)
  }

  const confirmPaid = async () => {
    await fetch('/api/reimbursements', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: payingId,
        is_paid: true,
        payment_mode: payForm.payment_mode,
        paid_date: payForm.paid_date,
        notes: payForm.notes
      })
    })
    setPayingId(null)
    fetchAll()
  }

  const unpaid = reimbursements.filter(r => !r.is_paid)
  const paid = reimbursements.filter(r => r.is_paid)
  const outstandingTotal = unpaid.reduce((sum, r) => sum + parseFloat(r.amount_owed || 0), 0)

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reimbursements</h1>
        <p className="text-sm text-gray-500 mt-1">
          Outstanding: <span className="font-semibold text-gray-700">${outstandingTotal.toFixed(2)}</span> · {unpaid.length} unpaid
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Totals are calculated automatically from reimbursable expenses per event, per partner.
        </p>
      </div>

      {payingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Mark as Paid</h2>
              <button onClick={() => setPayingId(null)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={payForm.payment_mode}
                onChange={e => setPayForm({ ...payForm, payment_mode: e.target.value })}
              >
                {paymentModes.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={payForm.paid_date}
                onChange={e => setPayForm({ ...payForm, paid_date: e.target.value })}
              />
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Notes (optional)"
                rows={2}
                value={payForm.notes}
                onChange={e => setPayForm({ ...payForm, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={confirmPaid} className="flex-1 bg-rose-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-rose-700">
                Confirm Paid
              </button>
              <button onClick={() => setPayingId(null)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <div className="space-y-6">
          {/* Unpaid */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Outstanding</p>
            {unpaid.length === 0 ? (
              <p className="text-sm text-gray-400">Nothing owed right now.</p>
            ) : (
              <div className="space-y-3">
                {unpaid.map(r => (
                  <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{r.partner_name || '—'}</p>
                      <p className="text-xs text-gray-500">{r.event_name || '—'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">${parseFloat(r.amount_owed).toFixed(2)}</span>
                      <button
                        onClick={() => openPayModal(r)}
                        className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-gray-900"
                      >
                        Mark Paid
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Paid history */}
          {paid.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Paid History</p>
              <div className="space-y-2">
                {paid.map(r => (
                  <div key={r.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700 text-sm">{r.partner_name || '—'}</p>
                      <p className="text-xs text-gray-500">
                        {r.event_name || '—'} · {r.paid_date ? new Date(r.paid_date).toLocaleDateString() : '—'} · {r.payment_mode}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-500">${parseFloat(r.amount_owed).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
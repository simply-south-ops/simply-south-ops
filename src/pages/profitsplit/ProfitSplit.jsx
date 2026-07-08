import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

export default function ProfitSplit() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [splitData, setSplitData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [allSplits, setAllSplits] = useState([])

  const fetchEvents = async () => {
    const res = await fetch('/api/events')
    setEvents(await res.json())
  }

  const fetchAllSplits = async () => {
    const res = await fetch('/api/profitsplit')
    setAllSplits(await res.json())
  }

  useEffect(() => { fetchEvents(); fetchAllSplits() }, [])

  const calculateSplit = async () => {
    if (!selectedEvent) return alert('Select an event first')
    setLoading(true)
    const res = await fetch('/api/profitsplit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: selectedEvent })
    })
    const data = await res.json()
    setSplitData(data)
    setLoading(false)
    fetchAllSplits()
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profit Split</h1>

      {/* Calculator */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Calculate split for an event</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={selectedEvent}
            onChange={e => { setSelectedEvent(e.target.value); setSplitData(null) }}
          >
            <option value="">Select event</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <button
            onClick={calculateSplit}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Calculating...' : 'Calculate'}
          </button>
        </div>
      </div>

      {/* Result */}
      {splitData && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{splitData.event_name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-lg font-bold text-gray-900">${parseFloat(splitData.total_revenue).toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Total Expenses</p>
              <p className="text-lg font-bold text-gray-900">${parseFloat(splitData.total_expenses).toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Salary Deducted</p>
              <p className="text-lg font-bold text-gray-900">${parseFloat(splitData.salary_deducted).toFixed(2)}</p>
            </div>
          </div>
          <div className={`rounded-lg p-4 mb-6 ${parseFloat(splitData.net_profit) >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-xs text-gray-600">Net Profit</p>
            <p className={`text-2xl font-bold ${parseFloat(splitData.net_profit) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              ${parseFloat(splitData.net_profit).toFixed(2)}
            </p>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-3">Partner Payouts</p>
          <div className="space-y-2">
            {Object.entries(splitData.partner_payouts).map(([name, data]) => (
              <div key={name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-gray-100 rounded-lg p-3 gap-1">
                <span className="font-medium text-gray-900">{name}</span>
                <div className="sm:text-right text-sm">
                  <p className="text-gray-500">Reimbursement: ${data.reimbursement.toFixed(2)} · Profit share: ${data.profit_share.toFixed(2)}</p>
                  <p className="font-bold text-gray-900">Total: ${data.total.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {allSplits.length > 0 && (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            <p className="text-sm font-medium text-gray-700">Calculated Splits</p>
            {allSplits.map(split => (
              <div key={split.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-gray-900 text-sm">{split.event_name}</p>
                  {split.is_internal && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      Internal
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Revenue: ${parseFloat(split.total_revenue).toFixed(2)} · Expenses: ${parseFloat(split.total_expenses).toFixed(2)}
                </p>
                <p className={`text-sm font-bold mt-1 ${parseFloat(split.net_profit) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  Net Profit: ${parseFloat(split.net_profit).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">Calculated Splits</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Event</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Revenue</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Expenses</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allSplits.map(split => (
                  <tr key={split.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {split.event_name}
                      {split.is_internal && (
                        <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          Internal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">${parseFloat(split.total_revenue).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">${parseFloat(split.total_expenses).toFixed(2)}</td>
                    <td className={`px-4 py-3 font-semibold ${parseFloat(split.net_profit) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      ${parseFloat(split.net_profit).toFixed(2)}
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

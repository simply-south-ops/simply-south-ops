import { useState, useEffect } from 'react'
import { Calendar, DollarSign, AlertCircle, Package, TrendingUp, Users } from 'lucide-react'

export default function Dashboard() {
  const [events, setEvents] = useState([])
  const [expenses, setExpenses] = useState([])
  const [invoices, setInvoices] = useState([])
  const [inventory, setInventory] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [splits, setSplits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const [evRes, exRes, invRes, invtRes, enqRes, spRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/expenses'),
        fetch('/api/invoices'),
        fetch('/api/inventory'),
        fetch('/api/enquiries'),
        fetch('/api/profitsplit')
      ])
      setEvents(await evRes.json())
      setExpenses(await exRes.json())
      setInvoices(await invRes.json())
      setInventory(await invtRes.json())
      setEnquiries(await enqRes.json())
      setSplits(await spRes.json())
      setLoading(false)
    }
    fetchAll()
  }, [])

  if (loading) return <div className="p-8"><p className="text-gray-500 text-sm">Loading...</p></div>

  const clientEvents = events.filter(e => !e.is_internal)
  const upcoming = clientEvents
    .filter(e => e.event_date && new Date(e.event_date) >= new Date() && e.status !== 'cancelled')
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 5)

  const outstandingInvoices = invoices.filter(i => i.status !== 'paid')
  const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0)

  const totalRevenue = clientEvents.reduce((sum, e) => sum + parseFloat(e.quote_amount || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

  const clientSplits = splits.filter(s => !s.is_internal)
  const totalNetProfit = clientSplits.reduce((sum, s) => sum + parseFloat(s.net_profit || 0), 0)

  const inventoryValue = inventory.reduce((sum, i) => sum + parseFloat(i.cost || 0), 0)

  const newEnquiries = enquiries.filter(e => e.status === 'new' || e.status === 'follow_up').length

  const statusColors = {
    enquiry: 'bg-gray-100 text-gray-600',
    confirmed: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">Overview of your business</p>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Total Revenue</p>
            <DollarSign size={16} className="text-green-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
        </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Net Profit (Client Events)</p>
            <TrendingUp size={16} className={totalNetProfit >= 0 ? 'text-green-500' : 'text-red-500'} />
          </div>
          {clientSplits.length === 0 ? (
            <>
              <p className="text-xl font-bold text-gray-400">—</p>
              <p className="text-xs text-gray-400 mt-1">No splits calculated yet</p>
            </>
          ) : (
            <>
              <p className={`text-xl font-bold ${totalNetProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {totalNetProfit >= 0 ? '$' : '-$'}{Math.abs(totalNetProfit).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {clientSplits.length} event{clientSplits.length !== 1 ? 's' : ''} calculated
                {totalNetProfit < 0 && ' · Loss'}
              </p>
            </>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Outstanding Invoices</p>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">${outstandingTotal.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{outstandingInvoices.length} unpaid</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Inventory Value</p>
            <Package size={16} className="text-blue-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">${inventoryValue.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{inventory.length} items</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming events */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">Upcoming Events</h2>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming events.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(event => (
                <div key={event.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{event.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {event.client_name || '—'} · {new Date(event.event_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[event.status]}`}>
                    {event.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">Quick Summary</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Total events</span>
              <span className="font-semibold text-gray-900">{clientEvents.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Active enquiries</span>
              <span className="font-semibold text-gray-900">{newEnquiries}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Total expenses</span>
              <span className="font-semibold text-gray-900">${totalExpenses.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Invoices sent</span>
              <span className="font-semibold text-gray-900">{invoices.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { Calendar, DollarSign, AlertCircle, Package, TrendingUp, Users, Boxes } from 'lucide-react'

export default function Dashboard() {
  const [events, setEvents] = useState([])
  const [expenses, setExpenses] = useState([])
  const [invoices, setInvoices] = useState([])
  const [inventory, setInventory] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [splits, setSplits] = useState([])
  const [rentalProfit, setRentalProfit] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const [evRes, exRes, invRes, invtRes, enqRes, spRes, rpRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/expenses'),
        fetch('/api/invoices'),
        fetch('/api/inventory'),
        fetch('/api/enquiries'),
        fetch('/api/profitsplit'),
        fetch('/api/rental-system?resource=rental-profit')
      ])
      setEvents(await evRes.json())
      setExpenses(await exRes.json())
      setInvoices(await invRes.json())
      setInventory(await invtRes.json())
      setEnquiries(await enqRes.json())
      setSplits(await spRes.json())
      setRentalProfit(await rpRes.json())
      setLoading(false)
    }
    fetchAll()
  }, [])

  if (loading) return <div className="p-4 md:p-8"><p className="text-gray-500 text-sm">Loading...</p></div>

  const clientEvents = events.filter(e => !e.is_internal)
  const upcoming = clientEvents
    .filter(e => e.event_date && new Date(e.event_date) >= new Date() && e.status !== 'cancelled')
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 5)

  const outstandingInvoices = invoices.filter(i => i.status !== 'paid')
  const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0)

  const totalRevenue = clientEvents.reduce((sum, e) => sum + parseFloat(e.quote_amount || 0), 0)
  // exclude rental-linked expenses — they share the same table but must
  // stay out of the event-expense figure per business requirement
  const eventExpensesOnly = expenses.filter(e => e.event_id)
  const totalExpenses = eventExpensesOnly.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

  const clientSplits = splits.filter(s => !s.is_internal)
  const eventNetProfit = clientSplits.reduce((sum, s) => sum + parseFloat(s.net_profit || 0), 0)

  const rentalNetProfit = rentalProfit ? parseFloat(rentalProfit.rental_net_profit || 0) : 0
  const combinedProfit = eventNetProfit + rentalNetProfit

  const inventoryValue = inventory.reduce((sum, i) => sum + parseFloat(i.cost || 0), 0)
  const newEnquiries = enquiries.filter(e => e.status === 'new' || e.status === 'follow_up').length

  const statusColors = {
    enquiry: 'bg-gray-100 text-gray-600',
    confirmed: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  }

  const ProfitFigure = ({ value, hasData }) => {
    if (!hasData) {
      return <p className="text-xl font-bold text-gray-400">—</p>
    }
    return (
      <p className={`text-xl font-bold ${value >= 0 ? 'text-green-700' : 'text-red-600'}`}>
        {value >= 0 ? '$' : '-$'}{Math.abs(value).toFixed(2)}
      </p>
    )
  }

  return (
    <div className="p-4 md:p-8">
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
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Active Enquiries</p>
            <Users size={16} className="text-purple-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">{newEnquiries}</p>
        </div>
      </div>

      {/* Profit breakdown - kept explicitly separate per business requirement */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Event Profit</p>
            <TrendingUp size={16} className={eventNetProfit >= 0 ? 'text-green-500' : 'text-red-500'} />
          </div>
          <ProfitFigure value={eventNetProfit} hasData={clientSplits.length > 0} />
          <p className="text-xs text-gray-400 mt-1">
            {clientSplits.length > 0 ? `${clientSplits.length} event${clientSplits.length !== 1 ? 's' : ''} calculated` : 'No splits calculated yet'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Rental Profit</p>
            <Boxes size={16} className={rentalNetProfit >= 0 ? 'text-green-500' : 'text-red-500'} />
          </div>
          <ProfitFigure value={rentalNetProfit} hasData={rentalProfit && rentalProfit.completed_rentals_count > 0} />
          <p className="text-xs text-gray-400 mt-1">
            {rentalProfit && rentalProfit.completed_rentals_count > 0
              ? `${rentalProfit.completed_rentals_count} rental${rentalProfit.completed_rentals_count !== 1 ? 's' : ''} returned/closed`
              : 'No completed rentals yet'}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-300">Combined Total</p>
            <TrendingUp size={16} className="text-gray-300" />
          </div>
          <p className={`text-xl font-bold ${combinedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {combinedProfit >= 0 ? '$' : '-$'}{Math.abs(combinedProfit).toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Event + Rental combined</p>
        </div>
      </div>
      {/* Rental analytics */}
      {rentalProfit && (rentalProfit.overdue_rentals?.length > 0 || rentalProfit.currently_rented?.length > 0 || rentalProfit.upcoming_rentals?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {rentalProfit.overdue_rentals?.length > 0 && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-5">
              <p className="text-xs font-semibold text-red-700 mb-3">Overdue Returns</p>
              <div className="space-y-2">
                {rentalProfit.overdue_rentals.map(r => (
                  <div key={r.id} className="text-xs">
                    <p className="font-medium text-red-900">{r.item_name} × {r.quantity}</p>
                    <p className="text-red-600">{r.renter_name} · due {new Date(r.return_date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rentalProfit.currently_rented?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-700 mb-3">Currently Rented Out</p>
              <div className="space-y-2">
                {rentalProfit.currently_rented.slice(0, 5).map(r => (
                  <div key={r.id} className="text-xs">
                    <p className="font-medium text-gray-900">{r.item_name} × {r.quantity}</p>
                    <p className="text-gray-500">{r.renter_name} · back {new Date(r.return_date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rentalProfit.upcoming_rentals?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-700 mb-3">Upcoming Rentals</p>
              <div className="space-y-2">
                {rentalProfit.upcoming_rentals.map(r => (
                  <div key={r.id} className="text-xs">
                    <p className="font-medium text-gray-900">{r.item_name} × {r.quantity}</p>
                    <p className="text-gray-500">{r.renter_name} · picks up {new Date(r.pickup_date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {rentalProfit?.most_rented_items?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <p className="text-xs font-semibold text-gray-700 mb-3">Most Rented Items</p>
          <div className="space-y-2">
            {rentalProfit.most_rented_items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-900">{item.name || 'Unknown item'}</span>
                <span className="text-gray-500">{item.rental_count} rental{item.rental_count !== '1' ? 's' : ''} · {item.total_units_rented} units total</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
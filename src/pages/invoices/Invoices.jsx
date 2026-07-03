import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, FileDown } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const emptyForm = {
  event_id: '',
  invoice_number: '',
  issued_date: '',
  status: 'draft',
  line_items: [{ description: '', amount: '' }]
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [events, setEvents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    const [invRes, evRes] = await Promise.all([
      fetch('/api/invoices'),
      fetch('/api/events')
    ])
    setInvoices(await invRes.json())
    setEvents(await evRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const updateLineItem = (index, field, value) => {
    const items = [...form.line_items]
    items[index][field] = value
    setForm({ ...form, line_items: items })
  }

  const addLineItem = () => {
    setForm({ ...form, line_items: [...form.line_items, { description: '', amount: '' }] })
  }

  const removeLineItem = (index) => {
    const items = form.line_items.filter((_, i) => i !== index)
    setForm({ ...form, line_items: items })
  }

  const total = form.line_items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)

  const handleSubmit = async () => {
    if (!form.event_id) return alert('Please select an event')
    if (!form.invoice_number) return alert('Invoice number is required')
    const method = editId ? 'PUT' : 'POST'
    const body = editId
      ? { ...form, id: editId, total_amount: total }
      : { ...form, total_amount: total }
    await fetch('/api/invoices', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setForm(emptyForm)
    setEditId(null)
    setShowForm(false)
    fetchAll()
  }

  const handleEdit = (invoice) => {
    setForm({
      event_id: invoice.event_id,
      invoice_number: invoice.invoice_number,
      issued_date: invoice.issued_date?.split('T')[0],
      status: invoice.status,
      line_items: invoice.line_items || [{ description: '', amount: '' }]
    })
    setEditId(invoice.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return
    await fetch('/api/invoices', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchAll()
  }

  const generatePDF = (invoice) => {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(22)
    doc.setTextColor(190, 30, 45)
    doc.text('Simply South Events', 14, 22)

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text('simplysouthevents@gmail.com', 14, 30)

    doc.setFontSize(16)
    doc.setTextColor(30)
    doc.text('INVOICE', 160, 22)

    doc.setFontSize(10)
    doc.setTextColor(80)
    doc.text(`Invoice #: ${invoice.invoice_number}`, 140, 30)
    doc.text(`Date: ${invoice.issued_date ? new Date(invoice.issued_date).toLocaleDateString() : ''}`, 140, 36)
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 140, 42)

    // Client info
    doc.setFontSize(11)
    doc.setTextColor(30)
    doc.text('Bill To:', 14, 48)
    doc.setFontSize(10)
    doc.setTextColor(80)
    doc.text(invoice.client_name || '—', 14, 55)
    doc.text(invoice.client_phone || '', 14, 61)
    doc.text(invoice.client_email || '', 14, 67)

    // Event info
    doc.setFontSize(10)
    doc.setTextColor(80)
    doc.text(`Event: ${invoice.event_name || '—'}`, 14, 78)

    // Line items table
    autoTable(doc, {
      startY: 85,
      head: [['Description', 'Amount']],
      body: (invoice.line_items || []).map(item => [
        item.description,
        `$${parseFloat(item.amount || 0).toFixed(2)}`
      ]),
      foot: [['Total', `$${parseFloat(invoice.total_amount || 0).toFixed(2)}`]],
      headStyles: { fillColor: [190, 30, 45] },
      footStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontStyle: 'bold' },
      styles: { fontSize: 10 }
    })

    // Footer
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text('Thank you for choosing Simply South Events!', 14, pageHeight - 15)

    doc.save(`invoice-${invoice.invoice_number}.pdf`)
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700'
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700"
        >
          <Plus size={16} /> New Invoice
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editId ? 'Edit Invoice' : 'New Invoice'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.event_id}
                onChange={e => setForm({ ...form, event_id: e.target.value })}
              >
                <option value="">Select event</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Invoice number (e.g. SSE-001)"
                value={form.invoice_number}
                onChange={e => setForm({ ...form, invoice_number: e.target.value })}
              />
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.issued_date}
                onChange={e => setForm({ ...form, issued_date: e.target.value })}
              />
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {/* Line Items */}
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Line Items</p>
              {form.line_items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Description"
                    value={item.description}
                    onChange={e => updateLineItem(index, 'description', e.target.value)}
                  />
                  <input
                    type="number"
                    className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={e => updateLineItem(index, 'amount', e.target.value)}
                  />
                  {form.line_items.length > 1 && (
                    <button onClick={() => removeLineItem(index)} className="text-gray-400 hover:text-rose-600">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addLineItem}
                className="text-sm text-rose-600 hover:text-rose-700 font-medium"
              >
                + Add line item
              </button>
            </div>

            <div className="text-right text-sm font-semibold text-gray-900 mb-4">
              Total: ${total.toFixed(2)}
            </div>

            <div className="flex gap-2">
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
      ) : invoices.length === 0 ? (
        <p className="text-gray-500 text-sm">No invoices yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Invoice #</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Event</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Client</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Total</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{invoice.invoice_number}</td>
                  <td className="px-4 py-3 text-gray-600">{invoice.event_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{invoice.client_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {invoice.issued_date ? new Date(invoice.issued_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    ${parseFloat(invoice.total_amount || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => generatePDF(invoice)} className="text-gray-400 hover:text-rose-600" title="Download PDF">
                        <FileDown size={15} />
                      </button>
                      <button onClick={() => handleEdit(invoice)} className="text-gray-400 hover:text-gray-600">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(invoice.id)} className="text-gray-400 hover:text-rose-600">
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
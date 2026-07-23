import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/dashboard/Dashboard'
import Events from './pages/events/Events'
import Expenses from './pages/expenses/Expenses'
import Inventory from './pages/inventory/Inventory'
import Invoices from './pages/invoices/Invoices'
import Clients from './pages/clients/Clients'
import Enquiries from './pages/enquiries/Enquiries'
import ProfitSplit from './pages/profitsplit/ProfitSplit'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="events" element={<Events />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="clients" element={<Clients />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="profitsplit" element={<ProfitSplit />} />
      </Route>
    </Routes>
  )
}
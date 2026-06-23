import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Receipt,
  Package,
  FileText,
  Users,
  ClipboardList,
  PieChart,
  Clock
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/enquiries', label: 'Enquiries', icon: ClipboardList },
  { to: '/profitsplit', label: 'Profit Split', icon: PieChart },
  { to: '/labour', label: 'Labour', icon: Clock },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Simply South</h1>
          <p className="text-xs text-gray-500 mt-1">Events Dashboard</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-rose-50 text-rose-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">Simply South Events © 2025</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
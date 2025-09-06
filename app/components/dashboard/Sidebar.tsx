export default function Sidebar() {
  return (
    <aside class="hidden md:block w-64 shrink-0 border-r bg-white min-h-[calc(100vh-4rem)]">
      <nav class="p-4 space-y-1">
        <a href="/dashboard" class="block px-3 py-2 rounded hover:bg-gray-50 text-sm font-medium text-slate-700">Overview</a>
        <a href="/dashboard/student" class="block px-3 py-2 rounded hover:bg-gray-50 text-sm font-medium text-slate-700">Students</a>
        <a href="/dashboard/attendance" class="block px-3 py-2 rounded hover:bg-gray-50 text-sm font-medium text-slate-700">Attendance</a>
        <a href="/dashboard/marks" class="block px-3 py-2 rounded hover:bg-gray-50 text-sm font-medium text-slate-700">Marks</a>
        <a href="/dashboard/backlogs" class="block px-3 py-2 rounded hover:bg-gray-50 text-sm font-medium text-slate-700">Backlogs</a>
        <a href="/dashboard/fees" class="block px-3 py-2 rounded hover:bg-gray-50 text-sm font-medium text-slate-700">Fees</a>
        <a href="/dashboard/risk-flags" class="block px-3 py-2 rounded hover:bg-gray-50 text-sm font-medium text-slate-700">Risk Flags</a>
        <a href="#" class="block px-3 py-2 rounded hover:bg-gray-50 text-sm font-medium text-slate-700">Reports</a>
        <a href="/dashboard/shortcut" class="block px-3 py-2 rounded hover:bg-gray-50 text-sm font-medium text-slate-700">Shortcut</a>
      </nav>
    </aside>
  )
}



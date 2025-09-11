export default function Sidebar(props: { currentPath?: string }) {
  const currentPath = props?.currentPath || ''
  const isActive = (href: string) => {
    if (href === '/dashboard') return currentPath === '/dashboard'
    return currentPath.startsWith(href)
  }
  const baseLink = 'block px-3 py-2 rounded text-sm font-medium'
  const activeLink = 'bg-slate-800 text-white'
  const idleLink = 'hover:bg-slate-800'
  return (
    <aside class="hidden md:block w-64 shrink-0 border-r border-slate-800 bg-slate-900 min-h-[calc(100vh-4rem)] text-slate-200">
      <nav class="p-4 space-y-1">
        <a href="/dashboard" class={`${baseLink} ${isActive('/dashboard') ? activeLink : idleLink}`}>Overview</a>
        <a href="/dashboard/student" class={`${baseLink} ${isActive('/dashboard/student') ? activeLink : idleLink}`}>Students</a>
        <a href="/dashboard/attendance" class={`${baseLink} ${isActive('/dashboard/attendance') ? activeLink : idleLink}`}>Attendance</a>
        <a href="/dashboard/marks" class={`${baseLink} ${isActive('/dashboard/marks') ? activeLink : idleLink}`}>Marks</a>
        <a href="/dashboard/backlogs" class={`${baseLink} ${isActive('/dashboard/backlogs') ? activeLink : idleLink}`}>Backlogs</a>
        <a href="/dashboard/fees" class={`${baseLink} ${isActive('/dashboard/fees') ? activeLink : idleLink}`}>Fees</a>
        <a href="/dashboard/risk-flags" class={`${baseLink} ${isActive('/dashboard/risk-flags') ? activeLink : idleLink}`}>Risk Flags</a>
        <a href="#" class={`${baseLink} ${idleLink}`}>Reports</a>
        <a href="/dashboard/shortcut" class={`${baseLink} ${isActive('/dashboard/shortcut') ? activeLink : idleLink}`}>Shortcut</a>
      </nav>
    </aside>
  )
}



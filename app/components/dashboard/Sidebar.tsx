interface SidebarProps {
  currentPath?: string
}

interface MenuSection {
  id: string
  label: string
  icon?: string
  href?: string
  children?: MenuSection[]
}

export default function Sidebar({ currentPath = '' }: SidebarProps) {
  const isActive = (href: string) => {
    if (href === '/dashboard') return currentPath === '/dashboard'
    return currentPath.startsWith(href)
  }

  const baseLink = 'block px-3 py-2 rounded text-sm font-medium'
  const activeLink = 'bg-white text-[#FC816B]'
  const idleLink = 'hover:bg-white hover:text-[#FC816B]'

  return (
    <aside className="hidden md:block w-64 shrink-0 border-r border-white min-h-screen text-slate-200 dark-scrollbar overflow-y-auto rounded-r-lg" style={{ backgroundColor: '#FC816B' }}>
      {/* Logo and Brand Section */}
      <div className="p-4 border-b border-white/20">
        <a href="/" className="flex items-center gap-3 font-semibold text-white">
          <img src="/Logo.png" alt="EduPulse Logo" className="h-12 w-12 object-contain" />
          <span className="text-lg">EduPulse</span>
        </a>
      </div>
      
      {/* Navigation Links */}
      <nav className="p-4 space-y-1">
        <a href="/dashboard" className={`${baseLink} ${isActive('/dashboard') ? activeLink : idleLink}`}>
          📊 Overview
        </a>
        
        {/* Students Section */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2 px-3">Students</div>
          <a href="/dashboard/students/courses" className={`${baseLink} ${isActive('/dashboard/students/courses') ? activeLink : idleLink} ml-3`}>
            📚 Courses
          </a>
        </div>
        
        {/* Mentees Section */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2 px-3">Mentees</div>
          <a href="/dashboard/mentees/student-details" className={`${baseLink} ${isActive('/dashboard/mentees/student-details') ? activeLink : idleLink} ml-3`}>
            👤 Student Details
          </a>
          <a href="/dashboard/mentees/attendance" className={`${baseLink} ${isActive('/dashboard/mentees/attendance') ? activeLink : idleLink} ml-3`}>
            📅 Attendance
          </a>
        </div>
        
        {/* Supervise Section */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2 px-3">Supervise</div>
          <a href="/dashboard/supervise/projects" className={`${baseLink} ${isActive('/dashboard/supervise/projects') ? activeLink : idleLink} ml-3`}>
            📋 Projects
          </a>
          <a href="/dashboard/supervise/phd" className={`${baseLink} ${isActive('/dashboard/supervise/phd') ? activeLink : idleLink} ml-3`}>
            🎓 PhD
          </a>
          <div className="ml-3">
            <div className="text-xs font-medium text-white/60 mb-1 px-3">Fellowship</div>
            <a href="/dashboard/supervise/fellowship/full-time" className={`${baseLink} ${isActive('/dashboard/supervise/fellowship/full-time') ? activeLink : idleLink} ml-6`}>
              💰 Full Time
            </a>
            <a href="/dashboard/supervise/fellowship/part-time" className={`${baseLink} ${isActive('/dashboard/supervise/fellowship/part-time') ? activeLink : idleLink} ml-6`}>
              💰 Part Time
            </a>
          </div>
        </div>
        
        {/* Legacy Features */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2 px-3">Legacy Features</div>
          <a href="/dashboard/marks" className={`${baseLink} ${isActive('/dashboard/marks') ? activeLink : idleLink} ml-3`}>
            📊 Marks
          </a>
          <a href="/dashboard/backlogs" className={`${baseLink} ${isActive('/dashboard/backlogs') ? activeLink : idleLink} ml-3`}>
            ⚠️ Backlogs
          </a>
          <a href="/dashboard/fees" className={`${baseLink} ${isActive('/dashboard/fees') ? activeLink : idleLink} ml-3`}>
            💳 Fees
          </a>
          <a href="/dashboard/risk-flags" className={`${baseLink} ${isActive('/dashboard/risk-flags') ? activeLink : idleLink} ml-3`}>
            🚩 Risk Flags
          </a>
          <a href="/dashboard/shortcut" className={`${baseLink} ${isActive('/dashboard/shortcut') ? activeLink : idleLink} ml-3`}>
            ⚡ Shortcut
          </a>
        </div>
      </nav>
    </aside>
  )
}



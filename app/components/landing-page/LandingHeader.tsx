type LandingHeaderProps = {
  isAuthed: boolean
  userName?: string | null
  userEmail?: string | null
  userPicture?: string | null
}

function getInitials(nameOrEmail: string | undefined | null): string {
  if (!nameOrEmail) return 'U'
  const str = nameOrEmail.trim()
  if (str.includes(' ')) {
    const parts = str.split(/\s+/)
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
  }
  if (str.includes('@')) {
    return str[0]?.toUpperCase() ?? 'U'
  }
  return str[0]?.toUpperCase() ?? 'U'
}

export default function LandingHeader(props: LandingHeaderProps) {
  const { isAuthed, userName, userEmail, userPicture } = props
  const displayName = userName || userEmail || 'User'
  const initials = getInitials(userName || userEmail)

  return (
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2 font-semibold text-gray-900 hover:text-[#3399FF] transition-colors">
          <img src="/Logo.png" alt="EduPulse Logo" class="h-16 w-20 object-contain" />
          GuideED
        </a>
        <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#features" class="text-gray-700 hover:text-[#3399FF] transition-colors">Features</a>
          <a href="#about" class="text-gray-700 hover:text-[#3399FF] transition-colors">About</a>
          <a href="#problem" class="text-gray-700 hover:text-[#3399FF] transition-colors">Problem</a>
          <a href="#solution" class="text-gray-700 hover:text-[#3399FF] transition-colors">Solution</a>
          <a href="#dashboard" class="text-gray-700 hover:text-[#3399FF] transition-colors">Dashboard</a>
          <a href="#tech" class="text-gray-700 hover:text-[#3399FF] transition-colors">Tech</a>
        </nav>
        <div class="flex items-center gap-3">
          {!isAuthed ? (
            <>
              <a class="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors" href="/dashboard/auth/login">Login</a>
              <a class="px-4 py-2 text-sm font-medium rounded-lg bg-[#3399FF] text-white hover:bg-[#e8735f] transition-colors shadow-sm" href="/dashboard/auth/signup">Sign up</a>
            </>
          ) : (
            <details class="relative">
              <summary class="list-none">
                <button class="inline-flex items-center gap-2 rounded-full border border-gray-300 px-2 py-1 hover:bg-gray-50 transition-colors">
                  {userPicture ? (
                    <img src={userPicture} alt="avatar" class="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span class="h-8 w-8 rounded-full bg-[#3399FF] text-white grid place-items-center text-sm font-semibold">
                      {initials}
                    </span>
                  )}
                  <span class="hidden md:block text-sm text-gray-700 max-w-[12rem] truncate">{displayName}</span>
                </button>
              </summary>
              <div class="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg">
                <a href="/dashboard" class="block px-3 py-2 text-sm hover:bg-gray-50 rounded-t-lg">Dashboard</a>
                <a href="/logout" class="block px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg">Logout</a>
              </div>
            </details>
          )}
        </div>
      </div>
    </header>
  )
}



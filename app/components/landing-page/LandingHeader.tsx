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
    <header class="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2 font-semibold">
          <span class="inline-block h-8 w-8 rounded bg-blue-600"></span>
          EduPulse
        </a>
        <nav class="hidden md:flex items-center gap-6 text-sm">
          <a href="#features" class="hover:text-blue-600">Features</a>
          <a href="#about" class="hover:text-blue-600">About</a>
          <a href="#problem" class="hover:text-blue-600">Problem</a>
          <a href="#solution" class="hover:text-blue-600">Solution</a>
          <a href="#dashboard" class="hover:text-blue-600">Dashboard</a>
          <a href="#tech" class="hover:text-blue-600">Tech</a>
        </nav>
        <div class="flex items-center gap-2">
          {!isAuthed ? (
            <>
              <a class="px-3 py-2 text-sm rounded hover:bg-gray-100" href="/dashboard/auth/login">Login</a>
              <a class="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700" href="/dashboard/auth/signup">Sign up</a>
            </>
          ) : (
            <details class="relative">
              <summary class="list-none">
                <button class="inline-flex items-center gap-2 rounded-full border px-2 py-1 hover:bg-gray-50">
                  {userPicture ? (
                    <img src={userPicture} alt="avatar" class="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span class="h-8 w-8 rounded-full bg-blue-600 text-white grid place-items-center text-sm font-semibold">
                      {initials}
                    </span>
                  )}
                  <span class="hidden md:block text-sm text-gray-700 max-w-[12rem] truncate">{displayName}</span>
                </button>
              </summary>
              <div class="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-lg">
                <a href="/dashboard" class="block px-3 py-2 text-sm hover:bg-gray-50">Dashboard</a>
                <a href="/logout" class="block px-3 py-2 text-sm text-red-600 hover:bg-red-50">Logout</a>
              </div>
            </details>
          )}
        </div>
      </div>
    </header>
  )
}



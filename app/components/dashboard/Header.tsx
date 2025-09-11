function getInitials(nameOrEmail: string | undefined): string {
  if (!nameOrEmail) return 'U'
  const str = nameOrEmail.trim()
  if (str.includes(' ')) {
    const parts = str.split(' ').filter(Boolean)
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
  }
  return str[0]?.toUpperCase() ?? 'U'
}

export default function Header(props: any) {
  const { uid, userName, userEmail, userPicture } = props || {}
  const displayName = userName || userEmail || uid
  const initials = getInitials(userName || userEmail)
  return (
    <header class="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div class="px-4 h-16 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2 font-semibold text-white">
          <span class="inline-block h-8 w-8 rounded bg-slate-700"></span>
          EduPulse
        </a>
        <div class="flex items-center gap-3">
          <a href="/logout" class="hidden md:inline-flex items-center gap-2 rounded border border-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-800">
            Logout
          </a>
          <details class="relative">
            <summary class="list-none">
              <button class="inline-flex items-center gap-2 rounded-full border border-slate-700 px-2 py-1 hover:bg-slate-800">
                {userPicture ? (
                  <img src={userPicture} alt="avatar" class="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span class="h-8 w-8 rounded-full bg-slate-700 text-white grid place-items-center text-sm font-semibold">
                    {initials}
                  </span>
                )}
                <span class="hidden md:block text-sm text-slate-200 max-w-[12rem] truncate">{displayName}</span>
              </button>
            </summary>
            <div class="absolute right-0 mt-2 w-48 rounded-md border border-slate-700 bg-slate-900 text-slate-100 shadow-lg">
              <div class="px-3 py-2 text-sm text-slate-200 border-b border-slate-700">
                <div class="font-medium truncate">{displayName}</div>
                <div class="text-xs text-slate-400 truncate">{userEmail}</div>
              </div>
              <a href="#" class="block px-3 py-2 text-sm hover:bg-slate-800">Profile</a>
              <a href="/logout" class="block px-3 py-2 text-sm text-red-300 hover:bg-slate-800">Logout</a>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
}



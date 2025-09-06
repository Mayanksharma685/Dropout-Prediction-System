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
    <header class="sticky top-0 z-30 bg-white/90 backdrop-blur border-b">
      <div class="px-4 h-16 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2 font-semibold">
          <span class="inline-block h-8 w-8 rounded bg-blue-600"></span>
          EduPulse
        </a>
        <div class="flex items-center gap-3">
          <a href="/logout" class="hidden md:inline-flex items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-gray-50">
            Logout
          </a>
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
            <div class="absolute right-0 mt-2 w-48 rounded-md border bg-white shadow-lg">
              <div class="px-3 py-2 text-sm text-gray-700 border-b">
                <div class="font-medium truncate">{displayName}</div>
                <div class="text-xs text-gray-500 truncate">{userEmail}</div>
              </div>
              <a href="#" class="block px-3 py-2 text-sm hover:bg-gray-50">Profile</a>
              <a href="/logout" class="block px-3 py-2 text-sm text-red-600 hover:bg-red-50">Logout</a>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
}



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
    <header className="sticky top-0 z-30 backdrop-blur-sm border-b border-gray-200 bg-white text-gray-800">
      <div className="px-6 md:px-8 lg:px-12 h-16 flex items-center justify-between">
        {/* Left: Welcome & Status */}
        <div className="flex flex-col justify-center">
          <p className="text-lg font-medium text-gray-800 opacity-90 pt-2">
            Welcome back, {displayName || 'Teacher'}! Here's your academic summary.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="opacity-80">System Online</span>
            </div>

            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="opacity-80">Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Right: User Actions */}
        <div className="flex items-center gap-4">
          <a
            href="/logout"
            className="hidden md:inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            Logout
          </a>

          <details className="relative">
            <summary className="list-none">
              <button className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 hover:bg-gray-100 transition">
                {userPicture ? (
                  <img src={userPicture} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="h-8 w-8 rounded-full bg-[#FC816B] text-white grid place-items-center text-sm font-semibold">
                    {initials}
                  </span>
                )}
                <span className="hidden md:block text-sm text-gray-700 max-w-[12rem] truncate">
                  {displayName}
                </span>
              </button>
            </summary>

            <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white text-gray-800 shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="font-medium truncate">{displayName}</div>
                <div className="text-xs text-gray-500 truncate">{userEmail}</div>
              </div>
              <a href="#" className="block px-4 py-2 text-sm hover:bg-gray-100 transition">
                Profile
              </a>
              <a href="/logout" className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition">
                Logout
              </a>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}



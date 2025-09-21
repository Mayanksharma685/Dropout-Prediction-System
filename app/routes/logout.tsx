import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  c.header('Set-Cookie', 'auth=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax')
  c.header('Set-Cookie', 'uid=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax', { append: true } as any)
  c.header('Set-Cookie', 'role=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax', { append: true } as any)
  return c.render(
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
      <div class="max-w-md w-full mx-4">
        <div class="bg-white rounded-lg shadow-lg p-8 text-center">
          <div class="mb-6">
            <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Successfully logged out</h1>
            <p class="text-gray-600">You have been securely logged out of your account.</p>
          </div>
          
          <div class="space-y-3">
            <a 
              href="/dashboard/auth/login" 
              class="w-full text-white px-4 py-2 rounded-md transition-colors duration-200 inline-block" style="background-color: #E8734A" onmouseover="this.style.backgroundColor='#3399FF'" onmouseout="this.style.backgroundColor='#E8734A'"
            >
              Sign in again
            </a>
            <a 
              href="/" 
              class="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors duration-200 inline-block"
            >
              Go to Home
            </a>
          </div>
          
          <div class="mt-6 pt-6 border-t border-gray-200">
            <p class="text-sm text-gray-500">
              Thank you for using EduPulse
            </p>
          </div>
        </div>
      </div>
    </div>,
  )
})



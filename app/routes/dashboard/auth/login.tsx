import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'
import { verifyPassword } from '@/lib/password'

const LoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password is required'),
})

export default createRoute(async (c) => {
  return c.render(
    <div class="min-h-screen grid md:grid-cols-2 bg-gradient-to-br from-slate-50 to-white">
      <div class="hidden md:flex items-center justify-center p-10" style="background-color: #FC816B">
        <img 
          src="/login-left-side.png" 
          alt="EduPulse Login" 
          class="max-w-full max-h-full object-contain rounded-2xl"
        />
      </div>
      <div class="flex items-center justify-center p-6 md:p-10">
        <div class="w-full max-w-md">
          <div class="mb-6">
            <h1 class="text-2xl font-bold">Sign in</h1>
            <p class="text-gray-600">Use your registered email and password.</p>
          </div>

          <a href="/dashboard/login" class="group inline-flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="h-5 w-5"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.041,6.053,28.761,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.041,6.053,28.761,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c4.717,0,9.002-1.807,12.29-4.771l-5.671-4.773C28.542,36.602,26.403,37.5,24,37.5 c-5.202,0-9.619-3.317-11.277-7.953l-6.561,5.046C9.48,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.117,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.87,5.317C36.013,41.205,44,36,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
            <span>Continue with Google</span>
          </a>

          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t"></div></div>
            <div class="relative flex justify-center"><span class="bg-white px-2 text-gray-500 text-sm">or</span></div>
          </div>

          <form method="post" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <div class="mt-1 relative">
                <input class="w-full border rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-slate-400" type="email" name="email" placeholder="you@college.edu" required />
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12H8m8 0l-4 4m4-4l-4-4" /></svg>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Password</label>
              <div class="mt-1 relative">
                <input class="w-full border rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-slate-400" type="password" name="password" placeholder="••••••••" required />
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4" /></svg>
              </div>
            </div>
            <button class="w-full text-white px-4 py-2 rounded-md" style="background-color: #E8734A" onmouseover="this.style.backgroundColor='#FC816B'" onmouseout="this.style.backgroundColor='#E8734A'">Sign in</button>
          </form>

          <div class="mt-6 text-center text-sm text-gray-600">
            <span>Don’t have an account?</span>
            <a class="ml-1 text-blue-600 hover:underline" href="/dashboard/auth/signup">Create an account</a>
          </div>
        </div>
      </div>
    </div>,
  )
})

export const POST = createRoute(zValidator('form', LoginSchema), async (c) => {
  const data = c.req.valid('form')
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  const teacher = await prisma.teacher.findUnique({ where: { email: data.email } })
  if (!teacher) {
    return c.render(
      <div class="bg-white md:shadow p-6 space-y-4 text-center">
        <p class="text-red-600">No teacher found for this email.</p>
        <div class="space-x-2">
          <a class="text-blue-600 hover:underline" href="/dashboard/auth/signup">Sign up</a>
          <span class="text-gray-400">·</span>
          <a class="text-blue-600 hover:underline" href="/dashboard/auth/login">Try again</a>
        </div>
      </div>,
    )
  }

  if (!teacher.password) {
    return c.render(
      <div class="bg-white md:shadow p-6 space-y-4 text-center">
        <p class="text-red-600">This account was created with Google. Please login with Google.</p>
        <div class="space-x-2">
          <a class="text-blue-600 hover:underline" href="/dashboard/auth/login">Continue with Google</a>
        </div>
      </div>,
    )
  }

  const ok = await verifyPassword(data.password, teacher.password)
  if (!ok) {
    return c.render(
      <div class="bg-white md:shadow p-6 space-y-4 text-center">
        <p class="text-red-600">Invalid email or password.</p>
        <div class="space-x-2">
          <a class="text-blue-600 hover:underline" href="/dashboard/auth/login">Try again</a>
        </div>
      </div>,
    )
  }

  c.header('Set-Cookie', `auth=1; Path=/; HttpOnly; SameSite=Lax`)
  c.header('Set-Cookie', `uid=${encodeURIComponent(teacher.teacherId)}; Path=/; HttpOnly; SameSite=Lax`, { append: true } as any)
  c.header('Set-Cookie', `role=teacher; Path=/; HttpOnly; SameSite=Lax`, { append: true } as any)
  return c.redirect('/dashboard')
})



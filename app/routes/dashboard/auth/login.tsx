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
    <div class="bg-white md:shadow p-6 space-y-6">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold">Teacher Login</h1>
        <p class="text-gray-600">Log in with your registered email.</p>
      </div>
      <form method="post" class="space-y-4 text-left max-w-md mx-auto">
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input class="mt-1 w-full border rounded p-2" type="email" name="email" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Password</label>
          <input class="mt-1 w-full border rounded p-2" type="password" name="password" required />
        </div>
        <button class="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900" type="submit">Login</button>
      </form>
      <div class="text-center space-x-2">
        <a class="text-blue-600 hover:underline" href="/dashboard/login">Login with Google</a>
        <span class="text-gray-400">·</span>
        <a class="text-blue-600 hover:underline" href="/dashboard/auth/signup">Create an account</a>
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
          <a class="text-blue-600 hover:underline" href="/dashboard/login">Continue with Google</a>
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



import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'
import { hashPassword } from '@/lib/password'

const SignupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  department: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export default createRoute(async (c) => {
  return c.render(
    <div class="bg-white md:shadow p-6 space-y-6">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold">Teacher Sign up</h1>
        <p class="text-gray-600">Create your teacher profile according to the schema.</p>
      </div>
      <form method="post" class="space-y-4 text-left max-w-md mx-auto">
        <div>
          <label class="block text-sm font-medium text-gray-700">Name</label>
          <input class="mt-1 w-full border rounded p-2" type="text" name="name" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input class="mt-1 w-full border rounded p-2" type="email" name="email" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Phone</label>
          <input class="mt-1 w-full border rounded p-2" type="text" name="phone" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Department</label>
          <input class="mt-1 w-full border rounded p-2" type="text" name="department" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Password</label>
          <input class="mt-1 w-full border rounded p-2" type="password" name="password" required />
        </div>
        <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" type="submit">Sign up</button>
      </form>
      <div class="text-center">
        <a class="text-blue-600 hover:underline" href="/dashboard/login">Or continue with Google</a>
      </div>
    </div>,
  )
})

export const POST = createRoute(zValidator('form', SignupSchema), async (c) => {
  const data = c.req.valid('form')
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  // Use email as teacherId for manual signups (schema requires String id)
  const teacherId = data.email

  const passwordHash = await hashPassword(data.password)

  await prisma.teacher.upsert({
    where: { teacherId },
    update: ({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      department: data.department || null,
      password: passwordHash,
    } as any),
    create: ({
      teacherId,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      department: data.department || null,
      password: passwordHash,
    } as any),
  })

  c.header('Set-Cookie', `auth=1; Path=/; HttpOnly; SameSite=Lax`)
  c.header('Set-Cookie', `uid=${encodeURIComponent(teacherId)}; Path=/; HttpOnly; SameSite=Lax`, { append: true } as any)
  c.header('Set-Cookie', `role=teacher; Path=/; HttpOnly; SameSite=Lax`, { append: true } as any)
  return c.redirect('/dashboard')
})



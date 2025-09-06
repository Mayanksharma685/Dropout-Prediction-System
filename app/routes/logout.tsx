import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  c.header('Set-Cookie', 'auth=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax')
  c.header('Set-Cookie', 'uid=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax', { append: true } as any)
  c.header('Set-Cookie', 'role=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax', { append: true } as any)
  return c.render(
    <div class="bg-white md:shadow p-4">
      <p class="text-gray-700">Logged out.</p>
      <div class="mt-4 flex gap-2">
        <a class="text-blue-600 hover:underline" href="/">Home</a>
        <a class="text-blue-600 hover:underline" href="/dashboard/login">Login</a>
      </div>
    </div>,
  )
})



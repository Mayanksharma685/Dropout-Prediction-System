import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  return c.render(
    <div class="bg-white md:shadow p-6 space-y-4">
      <h1 class="text-2xl font-bold">Register</h1>
      <p class="text-gray-700">Continue with Google to create your teacher profile.</p>
      <a
        class="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
        href="/dashboard/login"
      >
        Continue with Google
      </a>
      <div class="pt-2">
        <a class="text-blue-600 hover:underline" href="/dashboard/auth/signup">Or sign up manually</a>
      </div>
    </div>,
  )
})



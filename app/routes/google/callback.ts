import { createRoute } from 'honox/factory'
import { verifyCode } from '@/lib/google'

export default createRoute(async (c) => {
  const code = c.req.query('code')
  if (!code) return c.text('Missing code', 400)

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = (c.env as any) || {}
  const oauthUser = await verifyCode(
    { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI },
    code,
  )

  const prisma = (c as any).get('prisma')
  // Upsert Teacher by unique email; keep teacherId as email for consistency
  await prisma.teacher.upsert({
    where: { email: oauthUser.email },
    update: {
      name: oauthUser.name ?? 'Unknown',
      picture: oauthUser.picture ?? null,
      googleId: oauthUser.id,
    },
    create: {
      teacherId: oauthUser.email,
      email: oauthUser.email,
      name: oauthUser.name ?? 'Unknown',
      picture: oauthUser.picture ?? null,
      googleId: oauthUser.id,
    },
  })

  c.header('Set-Cookie', `auth=1; Path=/; HttpOnly; SameSite=Lax`)
  c.header('Set-Cookie', `uid=${encodeURIComponent(oauthUser.email)}; Path=/; HttpOnly; SameSite=Lax`, { append: true } as any)
  c.header('Set-Cookie', `teacherId=${encodeURIComponent(oauthUser.email)}; Path=/; HttpOnly; SameSite=Lax`, { append: true } as any)
  c.header('Set-Cookie', `role=teacher; Path=/; HttpOnly; SameSite=Lax`, { append: true } as any)
  return c.redirect('/dashboard')
})



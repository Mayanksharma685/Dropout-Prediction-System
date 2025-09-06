import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

import { createRoute } from 'honox/factory'

export default createRoute(async (c, next) => {
  if (!(c as any).get('prisma')) {
    const adapter = new PrismaD1((c.env as any).DB)
    const prisma = new PrismaClient({ adapter })
    ;(c as any).set('prisma', prisma)
  }
  // Simple auth guard for dashboard-only pages (allow login/register without auth)
  const url = new URL(c.req.url)
  const path = url.pathname
  const isDashboardPublic =
    path === '/dashboard/login' ||
    path === '/dashboard/register' ||
    path === '/dashboard/auth/login' ||
    path === '/dashboard/auth/signup' ||
    path.startsWith('/google/callback')
  const isAuthed = c.req.raw.headers.get('Cookie')?.includes('auth=1')
  if (path.startsWith('/dashboard') && !isDashboardPublic && !isAuthed) {
    return c.redirect('/dashboard/login')
  }
  await next()
})

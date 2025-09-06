import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const data = await prisma.backlog.findMany({ take: 200 })
  return c.json(data)
})

export const POST = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const body = await c.req.json()
  const created = await prisma.backlog.create({ data: body as any })
  return c.json(created, 201)
})



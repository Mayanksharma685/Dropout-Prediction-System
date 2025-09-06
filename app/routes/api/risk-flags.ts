import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const data = await prisma.riskFlag.findMany({ take: 200, orderBy: { flagDate: 'desc' } })
  return c.json(data)
})

export const POST = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const body = await c.req.json()
  const created = await prisma.riskFlag.create({ data: body as any })
  return c.json(created, 201)
})



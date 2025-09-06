import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const students = await prisma.student.findMany({ take: 100 })
  return c.json(students)
})

export const POST = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const body = await c.req.json()
  const created = await prisma.student.create({ data: body as any })
  return c.json(created, 201)
})



import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'

const CourseSubjectSchema = z.object({
  courseId: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(1),
  semester: z.coerce.number().int().min(1).max(8),
  department: z.string().min(1),
})

export const GET = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  const url = new URL(c.req.url)
  const department = url.searchParams.get('department')
  const semester = url.searchParams.get('semester')
  const courseId = url.searchParams.get('courseId')
  
  const where: any = {}
  if (department) where.department = department
  if (semester) where.semester = parseInt(semester)
  if (courseId) where.courseId = courseId
  
  const data = await prisma.courseSubject.findMany({ 
    where,
    orderBy: [{ semester: 'asc' }, { name: 'asc' }],
    take: 200 
  })
  return c.json(data)
})

export const POST = createRoute(zValidator('json', CourseSubjectSchema), async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const data = c.req.valid('json')
  
  try {
    const created = await prisma.courseSubject.create({ data })
    return c.json(created, 201)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return c.json({ error: 'Course ID already exists' }, 400)
    }
    return c.json({ error: 'Failed to create course' }, 500)
  }
})

export const PUT = createRoute(zValidator('json', CourseSubjectSchema), async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const data = c.req.valid('json')
  
  try {
    const updated = await prisma.courseSubject.update({
      where: { courseId: data.courseId },
      data
    })
    return c.json(updated)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return c.json({ error: 'Course not found' }, 404)
    }
    return c.json({ error: 'Failed to update course' }, 500)
  }
})

export const DELETE = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const url = new URL(c.req.url)
  const courseId = url.searchParams.get('courseId')
  
  if (!courseId) {
    return c.json({ error: 'Course ID is required' }, 400)
  }
  
  try {
    await prisma.courseSubject.delete({
      where: { courseId }
    })
    return c.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return c.json({ error: 'Course not found' }, 404)
    }
    return c.json({ error: 'Failed to delete course' }, 500)
  }
})

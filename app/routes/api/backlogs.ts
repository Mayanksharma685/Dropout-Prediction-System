import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'

const BacklogSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  attempts: z.coerce.number().int().min(0),
  cleared: z.boolean(),
})

export const GET = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  const url = new URL(c.req.url)
  const studentId = url.searchParams.get('studentId')
  const courseId = url.searchParams.get('courseId')
  const cleared = url.searchParams.get('cleared')
  
  const where: any = {}
  if (studentId) where.studentId = studentId
  if (courseId) where.courseId = courseId
  if (cleared !== null) where.cleared = cleared === 'true'
  
  const data = await prisma.backlog.findMany({ 
    where,
    include: {
      student: true,
      courseSubject: true
    },
    orderBy: { backlogId: 'desc' },
    take: 200 
  })
  return c.json(data)
})

export const POST = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  try {
    const formData = await c.req.formData()
    
    const backlogData = {
      studentId: formData.get('studentId') as string,
      courseId: formData.get('courseId') as string,
      attempts: parseInt(formData.get('attempts') as string),
      cleared: formData.get('cleared') === 'true'
    }
    
    // Validate required fields
    if (!backlogData.studentId || !backlogData.courseId || isNaN(backlogData.attempts)) {
      return c.json({ error: 'Missing required fields: studentId, courseId, attempts' }, 400)
    }
    
    const created = await prisma.backlog.create({ 
      data: {
        studentId: backlogData.studentId,
        courseId: backlogData.courseId,
        attempts: backlogData.attempts,
        cleared: backlogData.cleared,
      },
      include: {
        student: true,
        courseSubject: true
      }
    })
    return c.json(created, 201)
  } catch (error: any) {
    console.error('Error creating backlog:', error)
    return c.json({ error: 'Failed to create backlog record: ' + error.message }, 500)
  }
})



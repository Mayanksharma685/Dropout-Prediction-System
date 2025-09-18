import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'

const TestScoreSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  testDate: z.string().min(1),
  score: z.coerce.number().min(0).max(100),
})

export const GET = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  const url = new URL(c.req.url)
  const studentId = url.searchParams.get('studentId')
  const courseId = url.searchParams.get('courseId')
  
  const where: any = {}
  if (studentId) where.studentId = studentId
  if (courseId) where.courseId = courseId
  
  const data = await prisma.testScore.findMany({ 
    where,
    include: {
      student: true,
      courseSubject: true
    },
    orderBy: { testDate: 'desc' },
    take: 200 
  })
  return c.json(data)
})

export const POST = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  try {
    const formData = await c.req.formData()
    
    const testData = {
      studentId: formData.get('studentId') as string,
      courseId: formData.get('courseId') as string,
      testDate: formData.get('testDate') as string,
      score: parseFloat(formData.get('score') as string)
    }
    
    // Validate required fields
    if (!testData.studentId || !testData.courseId || !testData.testDate || isNaN(testData.score)) {
      return c.json({ error: 'Missing required fields: studentId, courseId, testDate, score' }, 400)
    }
    
    const created = await prisma.testScore.create({ 
      data: {
        studentId: testData.studentId,
        courseId: testData.courseId,
        testDate: new Date(testData.testDate),
        score: testData.score,
      },
      include: {
        student: true,
        courseSubject: true
      }
    })
    return c.json(created, 201)
  } catch (error: any) {
    console.error('Error creating test score:', error)
    return c.json({ error: 'Failed to create test score record: ' + error.message }, 500)
  }
})



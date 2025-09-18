import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'

const AttendanceSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  month: z.string().min(1),
  attendancePercent: z.coerce.number().min(0).max(100),
})

export const GET = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  const url = new URL(c.req.url)
  const studentId = url.searchParams.get('studentId')
  const courseId = url.searchParams.get('courseId')
  
  const where: any = {}
  if (studentId) where.studentId = studentId
  if (courseId) where.courseId = courseId
  
  const data = await prisma.attendance.findMany({ 
    where,
    include: {
      student: true,
      courseSubject: true
    },
    orderBy: { month: 'desc' },
    take: 200 
  })
  return c.json(data)
})

export const POST = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  try {
    const formData = await c.req.formData()
    
    const attendanceData = {
      studentId: formData.get('studentId') as string,
      courseId: formData.get('courseId') as string,
      month: formData.get('month') as string,
      attendancePercent: parseFloat(formData.get('attendancePercent') as string)
    }
    
    // Validate required fields
    if (!attendanceData.studentId || !attendanceData.courseId || !attendanceData.month || isNaN(attendanceData.attendancePercent)) {
      return c.json({ error: 'Missing required fields: studentId, courseId, month, attendancePercent' }, 400)
    }
    
    const created = await prisma.attendance.create({ 
      data: {
        studentId: attendanceData.studentId,
        courseId: attendanceData.courseId,
        month: new Date(attendanceData.month),
        attendancePercent: attendanceData.attendancePercent,
      },
      include: {
        student: true,
        courseSubject: true
      }
    })
    return c.json(created, 201)
  } catch (error: any) {
    console.error('Error creating attendance:', error)
    return c.json({ error: 'Failed to create attendance record: ' + error.message }, 500)
  }
})



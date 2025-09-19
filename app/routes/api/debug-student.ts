import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  try {
    // Check authentication
    const teacherIdRaw = c.req.header('Cookie')?.match(/uid=([^;]+)/)?.[1]
    
    if (!teacherIdRaw) {
      return c.json({ 
        error: 'Authentication required',
        cookies: c.req.header('Cookie') || 'No cookies found',
        headers: Object.fromEntries(c.req.raw.headers.entries())
      }, 401)
    }
    
    const teacherId = decodeURIComponent(teacherIdRaw)
    const url = new URL(c.req.url)
    const studentId = url.searchParams.get('studentId')

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({ where: { teacherId } })
    
    // Get all students for this teacher
    const allStudents = await prisma.student.findMany({
      where: { teacherId },
      select: { studentId: true, name: true, email: true }
    })

    // Try to find the specific student if provided
    let specificStudent = null
    if (studentId) {
      specificStudent = await prisma.student.findUnique({
        where: { 
          studentId,
          teacherId: teacherId
        },
        select: { 
          studentId: true, 
          name: true, 
          email: true, 
          teacherId: true,
          department: true,
          currentSemester: true
        }
      })
    }

    return c.json({
      debug: {
        teacherIdRaw,
        teacherId,
        studentId,
        requestUrl: c.req.url,
        cookies: c.req.header('Cookie'),
      },
      teacher: teacher ? {
        teacherId: teacher.teacherId,
        name: teacher.name,
        email: teacher.email
      } : null,
      allStudents,
      specificStudent,
      counts: {
        totalStudents: allStudents.length
      }
    })

  } catch (error: any) {
    console.error('Debug error:', error)
    return c.json({ 
      error: 'Debug failed: ' + error.message,
      stack: error.stack 
    }, 500)
  }
})

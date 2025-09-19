import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  // Get authenticated teacher ID from cookies
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const teacherId = uidRaw ? decodeURIComponent(uidRaw) : undefined
  
  if (!teacherId) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  try {
    // Check what data exists in the database
    const [teacher, students, phdSupervisions, fellowships, projects] = await Promise.all([
      prisma.teacher.findUnique({ where: { teacherId } }),
      prisma.student.count({ where: { teacherId } }),
      prisma.phdSupervision.count({ where: { supervisorId: teacherId } }),
      prisma.fellowship.count({ where: { supervisorId: teacherId } }),
      prisma.project.count({ where: { supervisorId: teacherId } })
    ])

    // Get sample data
    const samplePhdSupervisions = await prisma.phdSupervision.findMany({
      where: { supervisorId: teacherId },
      take: 3,
      include: {
        student: {
          select: {
            studentId: true,
            name: true,
            department: true
          }
        }
      }
    })

    const sampleFellowships = await prisma.fellowship.findMany({
      where: { supervisorId: teacherId },
      take: 3,
      include: {
        student: {
          select: {
            studentId: true,
            name: true,
            department: true
          }
        }
      }
    })

    return c.json({
      teacherId,
      teacher: teacher ? { name: teacher.name, email: teacher.email } : null,
      counts: {
        students,
        phdSupervisions,
        fellowships,
        projects
      },
      sampleData: {
        phdSupervisions: samplePhdSupervisions,
        fellowships: sampleFellowships
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in debug data:', error)
    return c.json({ 
      error: 'Failed to fetch debug data', 
      details: error instanceof Error ? error.message : 'Unknown error',
      teacherId 
    }, 500)
  }
})

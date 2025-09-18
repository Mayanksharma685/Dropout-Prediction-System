import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  const url = new URL(c.req.url)
  const courseId = url.searchParams.get('courseId')
  
  if (!courseId) {
    return c.json({ error: 'Course ID is required' }, 400)
  }
  
  try {
    // Get course details
    const course = await prisma.courseSubject.findUnique({
      where: { courseId }
    })
    
    if (!course) {
      return c.json({ error: 'Course not found' }, 404)
    }
    
    // Get attendance statistics
    const attendanceStats = await prisma.attendance.aggregate({
      where: { courseId },
      _avg: { attendancePercent: true },
      _min: { attendancePercent: true },
      _max: { attendancePercent: true },
      _count: { attendanceId: true }
    })
    
    // Get attendance distribution (students with different attendance ranges)
    const attendanceDistribution = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN attendancePercent >= 90 THEN 'Excellent (90%+)'
          WHEN attendancePercent >= 75 THEN 'Good (75-89%)'
          WHEN attendancePercent >= 60 THEN 'Average (60-74%)'
          ELSE 'Poor (<60%)'
        END as range,
        COUNT(DISTINCT studentId) as count
      FROM Attendance 
      WHERE courseId = ${courseId}
      GROUP BY 
        CASE 
          WHEN attendancePercent >= 90 THEN 'Excellent (90%+)'
          WHEN attendancePercent >= 75 THEN 'Good (75-89%)'
          WHEN attendancePercent >= 60 THEN 'Average (60-74%)'
          ELSE 'Poor (<60%)'
        END
    ` as Array<{ range: string; count: number }>
    
    // Get test score statistics
    const testScoreStats = await prisma.testScore.aggregate({
      where: { courseId },
      _avg: { score: true },
      _min: { score: true },
      _max: { score: true },
      _count: { testId: true }
    })
    
    // Get test score distribution
    const testScoreDistribution = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN score >= 90 THEN 'A (90%+)'
          WHEN score >= 80 THEN 'B (80-89%)'
          WHEN score >= 70 THEN 'C (70-79%)'
          WHEN score >= 60 THEN 'D (60-69%)'
          ELSE 'F (<60%)'
        END as grade,
        COUNT(DISTINCT studentId) as count
      FROM TestScore 
      WHERE courseId = ${courseId}
      GROUP BY 
        CASE 
          WHEN score >= 90 THEN 'A (90%+)'
          WHEN score >= 80 THEN 'B (80-89%)'
          WHEN score >= 70 THEN 'C (70-79%)'
          WHEN score >= 60 THEN 'D (60-69%)'
          ELSE 'F (<60%)'
        END
    ` as Array<{ grade: string; count: number }>
    
    // Get backlog statistics
    const backlogStats = await prisma.backlog.aggregate({
      where: { courseId },
      _count: { backlogId: true }
    })
    
    const clearedBacklogs = await prisma.backlog.count({
      where: { courseId, cleared: true }
    })
    
    const pendingBacklogs = await prisma.backlog.count({
      where: { courseId, cleared: false }
    })
    
    // Get unique students enrolled in this course
    const enrolledStudents = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT studentId) as count
      FROM (
        SELECT studentId FROM Attendance WHERE courseId = ${courseId}
        UNION
        SELECT studentId FROM TestScore WHERE courseId = ${courseId}
        UNION
        SELECT studentId FROM Backlog WHERE courseId = ${courseId}
      )
    ` as Array<{ count: number }>
    
    // Get recent activity (last 10 entries across all types)
    const recentAttendance = await prisma.attendance.findMany({
      where: { courseId },
      include: { student: { select: { name: true } } },
      orderBy: { month: 'desc' },
      take: 5
    })
    
    const recentTestScores = await prisma.testScore.findMany({
      where: { courseId },
      include: { student: { select: { name: true } } },
      orderBy: { testDate: 'desc' },
      take: 5
    })
    
    const recentBacklogs = await prisma.backlog.findMany({
      where: { courseId },
      include: { student: { select: { name: true } } },
      orderBy: { backlogId: 'desc' },
      take: 5
    })
    
    const summary = {
      course,
      enrollment: {
        totalStudents: enrolledStudents[0]?.count || 0
      },
      attendance: {
        average: attendanceStats._avg.attendancePercent || 0,
        minimum: attendanceStats._min.attendancePercent || 0,
        maximum: attendanceStats._max.attendancePercent || 0,
        totalRecords: attendanceStats._count.attendanceId || 0,
        distribution: attendanceDistribution
      },
      testScores: {
        average: testScoreStats._avg.score || 0,
        minimum: testScoreStats._min.score || 0,
        maximum: testScoreStats._max.score || 0,
        totalTests: testScoreStats._count.testId || 0,
        distribution: testScoreDistribution
      },
      backlogs: {
        total: backlogStats._count.backlogId || 0,
        cleared: clearedBacklogs,
        pending: pendingBacklogs
      },
      recentActivity: {
        attendance: recentAttendance,
        testScores: recentTestScores,
        backlogs: recentBacklogs
      }
    }
    
    return c.json(summary)
  } catch (error: any) {
    console.error('Error fetching course summary:', error)
    return c.json({ error: 'Failed to fetch course summary' }, 500)
  }
})

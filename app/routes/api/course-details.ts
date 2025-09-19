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
    
    // Get all students enrolled in this course with their performance data
    const studentsData = await prisma.$queryRaw`
      SELECT DISTINCT
        s.studentId,
        s.name,
        s.email,
        COALESCE(AVG(a.attendancePercent), 0) as attendancePercent,
        COALESCE(AVG(ts.score), 0) as avgTestScore,
        COALESCE(COUNT(DISTINCT CASE WHEN b.cleared = false THEN b.backlogId END), 0) as backlogCount
      FROM Student s
      LEFT JOIN Attendance a ON s.studentId = a.studentId AND a.courseId = ${courseId}
      LEFT JOIN TestScore ts ON s.studentId = ts.studentId AND ts.courseId = ${courseId}
      LEFT JOIN Backlog b ON s.studentId = b.studentId AND b.courseId = ${courseId}
      WHERE s.studentId IN (
        SELECT DISTINCT studentId FROM Attendance WHERE courseId = ${courseId}
        UNION
        SELECT DISTINCT studentId FROM TestScore WHERE courseId = ${courseId}
        UNION
        SELECT DISTINCT studentId FROM Backlog WHERE courseId = ${courseId}
      )
      GROUP BY s.studentId, s.name, s.email
      ORDER BY s.name
    ` as Array<{
      studentId: string;
      name: string;
      email: string;
      attendancePercent: number;
      avgTestScore: number;
      backlogCount: number;
    }>

    // Get attendance statistics
    const attendanceStats = await prisma.attendance.aggregate({
      where: { courseId },
      _avg: { attendancePercent: true },
      _min: { attendancePercent: true },
      _max: { attendancePercent: true },
      _count: { attendanceId: true }
    })
    
    // Get attendance distribution
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
      ORDER BY 
        CASE 
          WHEN attendancePercent >= 90 THEN 1
          WHEN attendancePercent >= 75 THEN 2
          WHEN attendancePercent >= 60 THEN 3
          ELSE 4
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
      ORDER BY 
        CASE 
          WHEN score >= 90 THEN 1
          WHEN score >= 80 THEN 2
          WHEN score >= 70 THEN 3
          WHEN score >= 60 THEN 4
          ELSE 5
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

    // Get monthly trends for the last 12 months (SQLite compatible)
    const monthlyTrends = await prisma.$queryRaw`
      WITH RECURSIVE months(month) AS (
        SELECT date('now', 'start of month', '-11 months')
        UNION ALL
        SELECT date(month, '+1 month')
        FROM months
        WHERE month < date('now', 'start of month')
      )
      SELECT 
        m.month,
        COALESCE(AVG(a.attendancePercent), 0) as avgAttendance,
        COALESCE(AVG(ts.score), 0) as avgTestScore,
        COUNT(DISTINCT a.studentId) as activeStudents
      FROM months m
      LEFT JOIN Attendance a ON date(a.month, 'start of month') = m.month AND a.courseId = ${courseId}
      LEFT JOIN TestScore ts ON date(ts.testDate, 'start of month') = m.month AND ts.courseId = ${courseId}
      GROUP BY m.month
      ORDER BY m.month ASC
    ` as Array<{
      month: string;
      avgAttendance: number;
      avgTestScore: number;
      activeStudents: number;
    }>
    
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

    // Get course performance insights (SQLite compatible)
    const performanceInsights = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT CASE WHEN a.attendancePercent >= 90 THEN a.studentId ELSE NULL END) as excellentAttendance,
        COUNT(DISTINCT CASE WHEN a.attendancePercent >= 75 AND a.attendancePercent < 90 THEN a.studentId ELSE NULL END) as goodAttendance,
        COUNT(DISTINCT CASE WHEN a.attendancePercent >= 60 AND a.attendancePercent < 75 THEN a.studentId ELSE NULL END) as averageAttendance,
        COUNT(DISTINCT CASE WHEN a.attendancePercent < 60 THEN a.studentId ELSE NULL END) as poorAttendance,
        COUNT(DISTINCT CASE WHEN ts.score >= 90 THEN ts.studentId ELSE NULL END) as gradeA,
        COUNT(DISTINCT CASE WHEN ts.score >= 80 AND ts.score < 90 THEN ts.studentId ELSE NULL END) as gradeB,
        COUNT(DISTINCT CASE WHEN ts.score >= 70 AND ts.score < 80 THEN ts.studentId ELSE NULL END) as gradeC,
        COUNT(DISTINCT CASE WHEN ts.score >= 60 AND ts.score < 70 THEN ts.studentId ELSE NULL END) as gradeD,
        COUNT(DISTINCT CASE WHEN ts.score < 60 THEN ts.studentId ELSE NULL END) as gradeF
      FROM Attendance a
      LEFT JOIN TestScore ts ON a.studentId = ts.studentId AND a.courseId = ts.courseId
      WHERE a.courseId = ${courseId}
    ` as Array<{
      excellentAttendance: number;
      goodAttendance: number;
      averageAttendance: number;
      poorAttendance: number;
      gradeA: number;
      gradeB: number;
      gradeC: number;
      gradeD: number;
      gradeF: number;
    }>

    const details = {
      course,
      enrollment: {
        totalStudents: studentsData.length
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
      students: studentsData,
      monthlyTrends: monthlyTrends, // Already ordered oldest to newest
      performanceInsights: performanceInsights[0] || {},
      recentActivity: {
        attendance: recentAttendance,
        testScores: recentTestScores,
        backlogs: recentBacklogs
      }
    }
    
    return c.json(details)
  } catch (error: any) {
    console.error('Error fetching course details:', error)
    return c.json({ error: 'Failed to fetch course details' }, 500)
  }
})

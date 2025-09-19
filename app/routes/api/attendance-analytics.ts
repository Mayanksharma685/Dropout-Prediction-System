import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  try {
    // Check authentication
    const authenticatedTeacherIdRaw = c.req.header('Cookie')?.match(/uid=([^;]+)/)?.[1]
    
    if (!authenticatedTeacherIdRaw) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    const authenticatedTeacherId = decodeURIComponent(authenticatedTeacherIdRaw)

    const url = new URL(c.req.url)
    const studentId = url.searchParams.get('studentId')
    const requestedTeacherId = url.searchParams.get('teacherId')
    
    // Ensure teacher can only access their own data
    const teacherId = requestedTeacherId === authenticatedTeacherId ? requestedTeacherId : authenticatedTeacherId
    
    // Build where clause - always filter by authenticated teacher's students
    const whereClause: any = {
      student: {
        teacherId: teacherId
      }
    }
    
    // If specific student requested, add that filter too
    if (studentId) {
      whereClause.studentId = studentId
    }

    // Get all attendance records with student and course details
    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            studentId: true,
            name: true,
            department: true,
            currentSemester: true,
            batchId: true
          }
        },
        courseSubject: {
          select: {
            courseId: true,
            name: true,
            code: true,
            semester: true,
            department: true
          }
        }
      },
      orderBy: [
        { month: 'desc' },
        { studentId: 'asc' }
      ]
    })

    // Calculate overall statistics
    const totalRecords = attendanceRecords.length
    const averageAttendance = totalRecords > 0 
      ? attendanceRecords.reduce((sum, record) => sum + record.attendancePercent, 0) / totalRecords 
      : 0

    // Group by student for student-wise analytics
    const studentStats = attendanceRecords.reduce((acc, record) => {
      const studentKey = record.studentId
      if (!acc[studentKey]) {
        acc[studentKey] = {
          student: record.student,
          totalRecords: 0,
          totalAttendance: 0,
          courses: new Set(),
          monthlyData: [],
          courseWiseData: {}
        }
      }
      
      acc[studentKey].totalRecords++
      acc[studentKey].totalAttendance += record.attendancePercent
      acc[studentKey].courses.add(record.courseSubject.name)
      acc[studentKey].monthlyData.push({
        month: record.month,
        attendance: record.attendancePercent,
        course: record.courseSubject.name,
        courseCode: record.courseSubject.code
      })

      // Course-wise data
      const courseKey = record.courseId
      if (!acc[studentKey].courseWiseData[courseKey]) {
        acc[studentKey].courseWiseData[courseKey] = {
          course: record.courseSubject,
          records: [],
          average: 0
        }
      }
      acc[studentKey].courseWiseData[courseKey].records.push({
        month: record.month,
        attendance: record.attendancePercent
      })

      return acc
    }, {} as any)

    // Calculate averages and format data
    const formattedStudentStats = Object.values(studentStats).map((stat: any) => {
      const averageAttendance = stat.totalAttendance / stat.totalRecords
      
      // Calculate course-wise averages
      const courseWiseStats = Object.values(stat.courseWiseData).map((courseData: any) => {
        const courseAverage = courseData.records.reduce((sum: number, record: any) => sum + record.attendance, 0) / courseData.records.length
        return {
          ...courseData,
          average: Math.round(courseAverage * 100) / 100,
          recordCount: courseData.records.length
        }
      })

      return {
        student: stat.student,
        averageAttendance: Math.round(averageAttendance * 100) / 100,
        totalCourses: stat.courses.size,
        totalRecords: stat.totalRecords,
        monthlyData: stat.monthlyData.sort((a: any, b: any) => new Date(b.month).getTime() - new Date(a.month).getTime()),
        courseWiseStats: courseWiseStats.sort((a: any, b: any) => b.average - a.average)
      }
    })

    // Attendance distribution
    const attendanceDistribution = {
      excellent: attendanceRecords.filter(r => r.attendancePercent >= 90).length,
      good: attendanceRecords.filter(r => r.attendancePercent >= 75 && r.attendancePercent < 90).length,
      average: attendanceRecords.filter(r => r.attendancePercent >= 60 && r.attendancePercent < 75).length,
      poor: attendanceRecords.filter(r => r.attendancePercent < 60).length
    }

    // Monthly trends (last 6 months)
    const monthlyTrends = attendanceRecords.reduce((acc, record) => {
      const monthKey = record.month.toISOString().substring(0, 7) // YYYY-MM format
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          totalRecords: 0,
          totalAttendance: 0,
          students: new Set()
        }
      }
      acc[monthKey].totalRecords++
      acc[monthKey].totalAttendance += record.attendancePercent
      acc[monthKey].students.add(record.studentId)
      return acc
    }, {} as any)

    const formattedMonthlyTrends = Object.values(monthlyTrends)
      .map((trend: any) => ({
        month: trend.month,
        averageAttendance: Math.round((trend.totalAttendance / trend.totalRecords) * 100) / 100,
        studentCount: trend.students.size,
        recordCount: trend.totalRecords
      }))
      .sort((a: any, b: any) => b.month.localeCompare(a.month))
      .slice(0, 6)

    // Course-wise analytics
    const courseStats = attendanceRecords.reduce((acc, record) => {
      const courseKey = record.courseId
      if (!acc[courseKey]) {
        acc[courseKey] = {
          course: record.courseSubject,
          totalRecords: 0,
          totalAttendance: 0,
          students: new Set()
        }
      }
      acc[courseKey].totalRecords++
      acc[courseKey].totalAttendance += record.attendancePercent
      acc[courseKey].students.add(record.studentId)
      return acc
    }, {} as any)

    const formattedCourseStats = Object.values(courseStats).map((stat: any) => ({
      course: stat.course,
      averageAttendance: Math.round((stat.totalAttendance / stat.totalRecords) * 100) / 100,
      studentCount: stat.students.size,
      recordCount: stat.totalRecords
    })).sort((a: any, b: any) => b.averageAttendance - a.averageAttendance)

    // Recent activity (last 10 records)
    const recentActivity = attendanceRecords
      .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
      .slice(0, 10)
      .map(record => ({
        studentName: record.student.name,
        studentId: record.studentId,
        courseName: record.courseSubject.name,
        courseCode: record.courseSubject.code,
        month: record.month,
        attendance: record.attendancePercent,
        status: record.attendancePercent >= 75 ? 'good' : record.attendancePercent >= 60 ? 'average' : 'poor'
      }))

    return c.json({
      summary: {
        totalStudents: formattedStudentStats.length,
        totalRecords,
        averageAttendance: Math.round(averageAttendance * 100) / 100,
        totalCourses: formattedCourseStats.length
      },
      attendanceDistribution,
      monthlyTrends: formattedMonthlyTrends,
      studentStats: formattedStudentStats,
      courseStats: formattedCourseStats,
      recentActivity
    })

  } catch (error: any) {
    console.error('Error fetching attendance analytics:', error)
    return c.json({ error: 'Failed to fetch attendance analytics: ' + error.message }, 500)
  }
})

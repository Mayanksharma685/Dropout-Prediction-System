import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  try {
    // Check authentication
    const teacherIdRaw = c.req.header('Cookie')?.match(/uid=([^;]+)/)?.[1]
    
    if (!teacherIdRaw) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    const teacherId = decodeURIComponent(teacherIdRaw)

    const url = new URL(c.req.url)
    const studentId = url.searchParams.get('studentId')
    
    console.log('Student Details API - Teacher ID:', teacherId)
    console.log('Student Details API - Student ID:', studentId)
    
    if (!studentId) {
      return c.json({ error: 'Student ID is required' }, 400)
    }

    // Get comprehensive student information - only for students mentored by this teacher
    const student = await prisma.student.findUnique({
      where: { 
        studentId,
        teacherId: teacherId // Ensure teacher can only access their own students
      },
      include: {
        teacher: {
          select: {
            teacherId: true,
            name: true,
            email: true,
            department: true
          }
        },
        batch: {
          include: {
            course: {
              select: {
                courseId: true,
                name: true,
                code: true,
                semester: true,
                department: true
              }
            }
          }
        },
        attendance: {
          include: {
            courseSubject: {
              select: {
                courseId: true,
                name: true,
                code: true,
                semester: true
              }
            }
          },
          orderBy: { month: 'desc' },
          take: 20
        },
        testScores: {
          include: {
            courseSubject: {
              select: {
                courseId: true,
                name: true,
                code: true,
                semester: true
              }
            }
          },
          orderBy: { testDate: 'desc' },
          take: 20
        },
        backlogs: {
          include: {
            courseSubject: {
              select: {
                courseId: true,
                name: true,
                code: true,
                semester: true
              }
            }
          }
        },
        feePayments: {
          orderBy: { dueDate: 'desc' },
          take: 10
        },
        riskFlags: {
          orderBy: { flagDate: 'desc' },
          take: 10
        },
        notifications: {
          orderBy: { sentDate: 'desc' },
          take: 10
        },
        projects: {
          include: {
            supervisor: {
              select: {
                teacherId: true,
                name: true,
                email: true
              }
            }
          }
        },
        phdSupervision: {
          include: {
            supervisor: {
              select: {
                teacherId: true,
                name: true,
                email: true
              }
            }
          }
        },
        fellowships: {
          include: {
            supervisor: {
              select: {
                teacherId: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    console.log('Student query result:', student ? 'Found' : 'Not found')
    
    if (!student) {
      // Let's also check if the student exists but with different teacherId
      const studentExists = await prisma.student.findUnique({
        where: { studentId },
        select: { studentId: true, teacherId: true, name: true }
      })
      
      console.log('Student exists check:', studentExists)
      
      return c.json({ 
        error: 'Student not found or not assigned to this teacher',
        debug: {
          requestedStudentId: studentId,
          requestedByTeacher: teacherId,
          studentExists: studentExists ? {
            studentId: studentExists.studentId,
            assignedToTeacher: studentExists.teacherId,
            name: studentExists.name
          } : null
        }
      }, 404)
    }

    // Calculate attendance statistics
    const attendanceStats = {
      totalRecords: student.attendance.length,
      averageAttendance: student.attendance.length > 0 
        ? Math.round((student.attendance.reduce((sum, att) => sum + att.attendancePercent, 0) / student.attendance.length) * 100) / 100
        : 0,
      courseWiseAttendance: student.attendance.reduce((acc, att) => {
        const courseKey = att.courseId
        if (!acc[courseKey]) {
          acc[courseKey] = {
            course: att.courseSubject,
            records: [],
            average: 0
          }
        }
        acc[courseKey].records.push({
          month: att.month,
          attendance: att.attendancePercent
        })
        return acc
      }, {} as any)
    }

    // Calculate course-wise averages
    Object.values(attendanceStats.courseWiseAttendance).forEach((courseData: any) => {
      courseData.average = Math.round((courseData.records.reduce((sum: number, record: any) => sum + record.attendance, 0) / courseData.records.length) * 100) / 100
    })

    // Calculate test score statistics
    const testScoreStats = {
      totalTests: student.testScores.length,
      averageScore: student.testScores.length > 0
        ? Math.round((student.testScores.reduce((sum, test) => sum + test.score, 0) / student.testScores.length) * 100) / 100
        : 0,
      courseWiseScores: student.testScores.reduce((acc, test) => {
        const courseKey = test.courseId
        if (!acc[courseKey]) {
          acc[courseKey] = {
            course: test.courseSubject,
            scores: [],
            average: 0,
            highest: 0,
            lowest: 100
          }
        }
        acc[courseKey].scores.push({
          date: test.testDate,
          score: test.score
        })
        acc[courseKey].highest = Math.max(acc[courseKey].highest, test.score)
        acc[courseKey].lowest = Math.min(acc[courseKey].lowest, test.score)
        return acc
      }, {} as any)
    }

    // Calculate course-wise test averages
    Object.values(testScoreStats.courseWiseScores).forEach((courseData: any) => {
      courseData.average = Math.round((courseData.scores.reduce((sum: number, score: any) => sum + score.score, 0) / courseData.scores.length) * 100) / 100
    })

    // Backlog statistics
    const backlogStats = {
      totalBacklogs: student.backlogs.length,
      clearedBacklogs: student.backlogs.filter(b => b.cleared).length,
      pendingBacklogs: student.backlogs.filter(b => !b.cleared).length,
      courseWiseBacklogs: student.backlogs.reduce((acc, backlog) => {
        const courseKey = backlog.courseId
        if (!acc[courseKey]) {
          acc[courseKey] = {
            course: backlog.courseSubject,
            total: 0,
            cleared: 0,
            pending: 0,
            attempts: []
          }
        }
        acc[courseKey].total++
        if (backlog.cleared) {
          acc[courseKey].cleared++
        } else {
          acc[courseKey].pending++
        }
        acc[courseKey].attempts.push(backlog.attempts)
        return acc
      }, {} as any)
    }

    // Fee payment statistics
    const feeStats = {
      totalPayments: student.feePayments.length,
      paidPayments: student.feePayments.filter(f => f.status === 'paid').length,
      pendingPayments: student.feePayments.filter(f => f.status === 'pending').length,
      overduePayments: student.feePayments.filter(f => f.status === 'overdue').length,
      totalDueMonths: student.feePayments.reduce((sum, fee) => sum + fee.dueMonths, 0)
    }

    // Risk analysis
    const riskAnalysis = {
      currentRiskLevel: student.riskFlags.length > 0 ? student.riskFlags[0].riskLevel : 'Low',
      totalFlags: student.riskFlags.length,
      recentFlags: student.riskFlags.slice(0, 5),
      riskFactors: {
        lowAttendance: attendanceStats.averageAttendance < 75,
        poorPerformance: testScoreStats.averageScore < 60,
        pendingBacklogs: backlogStats.pendingBacklogs > 0,
        feeIssues: feeStats.pendingPayments > 0 || feeStats.overduePayments > 0
      }
    }

    // Research and projects summary
    const researchSummary = {
      activeProjects: student.projects.filter(p => p.status === 'Active').length,
      completedProjects: student.projects.filter(p => p.status === 'Completed').length,
      phdStatus: student.phdSupervision.length > 0 ? student.phdSupervision[0].status : null,
      fellowshipStatus: student.fellowships.length > 0 ? student.fellowships[0].status : null,
      totalFellowshipAmount: student.fellowships.reduce((sum, f) => sum + f.amount, 0)
    }

    return c.json({
      student: {
        ...student,
        // Remove sensitive data
        attendance: undefined,
        testScores: undefined,
        backlogs: undefined,
        feePayments: undefined,
        riskFlags: undefined,
        notifications: undefined,
        projects: undefined,
        phdSupervision: undefined,
        fellowships: undefined
      },
      statistics: {
        attendance: attendanceStats,
        testScores: testScoreStats,
        backlogs: backlogStats,
        fees: feeStats,
        risk: riskAnalysis,
        research: researchSummary
      },
      recentActivity: {
        attendance: student.attendance.slice(0, 5),
        testScores: student.testScores.slice(0, 5),
        notifications: student.notifications.slice(0, 5)
      },
      academicRecords: {
        projects: student.projects,
        phdSupervision: student.phdSupervision,
        fellowships: student.fellowships
      }
    })

  } catch (error: any) {
    console.error('Error fetching student details:', error)
    return c.json({ error: 'Failed to fetch student details: ' + error.message }, 500)
  }
})

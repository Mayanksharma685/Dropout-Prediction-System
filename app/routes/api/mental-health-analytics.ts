import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  try {
    // Get teacher ID from cookies
    const cookies = c.req.raw.headers.get('Cookie') || ''
    const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
    const teacherId = uidRaw ? decodeURIComponent(uidRaw) : undefined
    
    if (!teacherId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
    
    // Get query parameters
    const url = new URL(c.req.url)
    const studentId = url.searchParams.get('studentId')
    
    // Get students that belong to this teacher first
    const teacherStudents = await prisma.student.findMany({
      where: { teacherId },
      select: { studentId: true }
    })
    
    const studentIds = teacherStudents.map(s => s.studentId)
    
    console.log(`Mental Health Analytics Debug:`)
    console.log(`  Teacher ID: ${teacherId}`)
    console.log(`  Students found: ${studentIds.length}`)
    console.log(`  Student IDs: ${studentIds.slice(0, 5).join(', ')}...`)
    
    if (studentIds.length === 0) {
      // No students for this teacher, return empty data
      return c.json({
        summary: {
          totalStudents: 0,
          studentsWithAssessments: 0,
          assessmentCoverage: 0,
          avgOverallWellness: 0,
          avgStressLevel: 0,
          avgAnxietyLevel: 0,
          avgDepressionLevel: 0,
          avgSleepQuality: 0,
          totalAppointments: 0,
          totalChallenges: 0,
          totalSupportTickets: 0
        },
        distributions: {
          riskLevels: { low: 0, medium: 0, high: 0, critical: 0 },
          challengeTypes: {},
          appointmentTypes: {},
          supportCategories: {}
        },
        trends: {
          monthly: []
        },
        recentActivities: []
      })
    }
    
    // Base filter for teacher's students
    const baseFilter = studentId 
      ? { studentId: studentId }
      : { studentId: { in: studentIds } }
    
    // Get all mental health assessments (with fallback if tables don't exist)
    let assessments = []
    try {
      assessments = await prisma.mentalHealthAssessment.findMany({
        where: baseFilter,
        include: {
          student: {
            select: {
              studentId: true,
              name: true,
              department: true,
              currentSemester: true
            }
          }
        },
        orderBy: { assessmentDate: 'desc' }
      })
      console.log(`  Mental Health Assessments found: ${assessments.length}`)
      if (assessments.length > 0) {
        console.log(`  Sample assessment:`, assessments[0])
      }
    } catch (error) {
      console.log('Mental health tables not found, returning empty data:', error.message)
      // Tables don't exist yet, return empty data structure
    }
    
    // Get counseling appointments (with fallback)
    let appointments = []
    try {
      appointments = await prisma.counselingAppointment.findMany({
        where: baseFilter,
        include: {
          student: {
            select: {
              studentId: true,
              name: true
            }
          }
        },
        orderBy: { appointmentDate: 'desc' }
      })
      console.log(`  Counseling Appointments found: ${appointments.length}`)
    } catch (error) {
      console.log('Counseling appointment table not found:', error.message)
    }
    
    // Get wellness challenges (with fallback)
    let challenges = []
    try {
      challenges = await prisma.wellnessChallenge.findMany({
        where: baseFilter,
        include: {
          student: {
            select: {
              studentId: true,
              name: true
            }
          }
        },
        orderBy: { startDate: 'desc' }
      })
    } catch (error) {
      console.log('Wellness challenge table not found:', error.message)
    }
    
    // Get support tickets (with fallback)
    let supportTickets = []
    try {
      supportTickets = await prisma.supportTicket.findMany({
        where: baseFilter,
        include: {
          student: {
            select: {
              studentId: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.log('Support ticket table not found:', error.message)
    }
    
    // Calculate summary statistics
    const totalStudents = await prisma.student.count({
      where: { teacherId }
    })
    
    const studentsWithAssessments = new Set(assessments.map(a => a.studentId)).size
    const assessmentCoverage = totalStudents > 0 ? (studentsWithAssessments / totalStudents) * 100 : 0
    
    // Calculate average wellness scores
    const avgStressLevel = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + a.stressLevel, 0) / assessments.length 
      : 0
    
    const avgOverallWellness = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + a.overallWellness, 0) / assessments.length 
      : 0
    
    // Risk level distribution
    const riskDistribution = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }
    
    assessments.forEach(assessment => {
      const avgRisk = (assessment.stressLevel + assessment.anxietyLevel + assessment.depressionLevel) / 3
      if (avgRisk <= 3) riskDistribution.low++
      else if (avgRisk <= 5) riskDistribution.medium++
      else if (avgRisk <= 7) riskDistribution.high++
      else riskDistribution.critical++
    })
    
    // Appointment status distribution
    const appointmentStats = {
      scheduled: appointments.filter(a => a.status === 'Scheduled').length,
      completed: appointments.filter(a => a.status === 'Completed').length,
      cancelled: appointments.filter(a => a.status === 'Cancelled').length,
      noShow: appointments.filter(a => a.status === 'No-Show').length
    }
    
    // Challenge progress
    const challengeStats = {
      active: challenges.filter(c => c.status === 'Active').length,
      completed: challenges.filter(c => c.status === 'Completed').length,
      abandoned: challenges.filter(c => c.status === 'Abandoned').length
    }
    
    // Support ticket priorities
    const ticketStats = {
      low: supportTickets.filter(t => t.priority === 'Low').length,
      medium: supportTickets.filter(t => t.priority === 'Medium').length,
      high: supportTickets.filter(t => t.priority === 'High').length,
      critical: supportTickets.filter(t => t.priority === 'Critical').length
    }
    
    // Monthly trends (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      
      const monthAssessments = assessments.filter(a => 
        a.assessmentDate >= monthStart && a.assessmentDate < monthEnd
      )
      
      const avgStress = monthAssessments.length > 0 
        ? monthAssessments.reduce((sum, a) => sum + a.stressLevel, 0) / monthAssessments.length 
        : 0
      
      const avgWellness = monthAssessments.length > 0 
        ? monthAssessments.reduce((sum, a) => sum + a.overallWellness, 0) / monthAssessments.length 
        : 0
      
      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        assessments: monthAssessments.length,
        avgStress: Math.round(avgStress * 10) / 10,
        avgWellness: Math.round(avgWellness * 10) / 10
      })
    }
    
    // Recent activities (last 10)
    const recentActivities = [
      ...assessments.slice(0, 5).map(a => ({
        type: 'assessment',
        studentName: a.student.name,
        studentId: a.studentId,
        date: a.assessmentDate,
        details: 'Stress: ' + a.stressLevel + '/10, Wellness: ' + a.overallWellness + '/10'
      })),
      ...appointments.slice(0, 3).map(a => ({
        type: 'appointment',
        studentName: a.student.name,
        studentId: a.studentId,
        date: a.appointmentDate,
        details: a.type + ' session with ' + a.counselorName
      })),
      ...supportTickets.slice(0, 2).map(t => ({
        type: 'support',
        studentName: t.isAnonymous ? 'Anonymous' : t.student.name,
        studentId: t.isAnonymous ? null : t.studentId,
        date: t.createdAt,
        details: t.priority + ' priority: ' + t.subject
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
    
    // Calculate additional missing fields
    const avgAnxietyLevel = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + a.anxietyLevel, 0) / assessments.length 
      : 0
    
    const avgDepressionLevel = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + a.depressionLevel, 0) / assessments.length 
      : 0
    
    const avgSleepQuality = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + a.sleepQuality, 0) / assessments.length 
      : 0

    console.log(`Final summary:`)
    console.log(`  Total students: ${totalStudents}`)
    console.log(`  Students with assessments: ${studentsWithAssessments}`)
    console.log(`  Assessment coverage: ${Math.round(assessmentCoverage)}%`)
    console.log(`  Raw assessments for response: ${assessments.slice(0, 50).length}`)

    const response = {
      summary: {
        totalStudents,
        studentsWithAssessments,
        assessmentCoverage: Math.round(assessmentCoverage),
        totalAssessments: assessments.length,
        totalAppointments: appointments.length,
        totalChallenges: challenges.length,
        totalSupportTickets: supportTickets.length,
        activeChallenges: challenges.filter(c => c.status === 'Active').length,
        openTickets: supportTickets.filter(t => t.status === 'Open').length,
        avgStressLevel: Math.round(avgStressLevel * 10) / 10,
        avgAnxietyLevel: Math.round(avgAnxietyLevel * 10) / 10,
        avgDepressionLevel: Math.round(avgDepressionLevel * 10) / 10,
        avgSleepQuality: Math.round(avgSleepQuality * 10) / 10,
        avgOverallWellness: Math.round(avgOverallWellness * 10) / 10
      },
      distributions: {
        riskLevels: riskDistribution,
        appointmentTypes: {
          individual: appointments.filter(a => a.type === 'Individual').length,
          group: appointments.filter(a => a.type === 'Group').length,
          crisis: appointments.filter(a => a.type === 'Crisis').length
        },
        challengeTypes: {
          mindfulness: challenges.filter(c => c.challengeType === 'Mindfulness').length,
          exercise: challenges.filter(c => c.challengeType === 'Exercise').length,
          sleep: challenges.filter(c => c.challengeType === 'Sleep').length,
          social: challenges.filter(c => c.challengeType === 'Social').length,
          academic: challenges.filter(c => c.challengeType === 'Academic').length
        },
        supportCategories: {
          academic: supportTickets.filter(t => t.category === 'Academic').length,
          personal: supportTickets.filter(t => t.category === 'Personal').length,
          financial: supportTickets.filter(t => t.category === 'Financial').length,
          health: supportTickets.filter(t => t.category === 'Health').length,
          other: supportTickets.filter(t => t.category === 'Other').length
        }
      },
      trends: {
        monthly: monthlyTrends
      },
      recentActivities,
      rawData: {
        assessments: assessments.slice(0, 50), // Increase limit since we have data
        appointments: appointments.slice(0, 20),
        challenges: challenges.slice(0, 20),
        supportTickets: supportTickets.slice(0, 20)
      }
    }
    
    console.log(`Returning response with ${response.rawData.assessments.length} assessments`)
    return c.json(response)
    
  } catch (error) {
    console.error('Mental health analytics error:', error)
    return c.json({ error: 'Failed to fetch mental health analytics' }, 500)
  }
})

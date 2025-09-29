import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  try {
    // Authentication - using the proven working pattern
    const cookies = c.req.raw.headers.get('Cookie') || ''
    const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
    const teacherId = uidRaw ? decodeURIComponent(uidRaw) : undefined
    
    if (!teacherId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
    
    console.log('=== MENTAL HEALTH ANALYTICS V2 ===')
    console.log('Teacher ID:', teacherId)
    
    // Step 1: Get all students for this teacher
    const students = await prisma.student.findMany({
      where: { teacherId },
      select: {
        studentId: true,
        name: true,
        department: true,
        currentSemester: true
      }
    })
    
    console.log('Students found:', students.length)
    
    if (students.length === 0) {
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
          totalAssessments: 0,
          totalAppointments: 0,
          totalChallenges: 0,
          totalSupportTickets: 0,
          activeChallenges: 0,
          openTickets: 0
        },
        distributions: {
          riskLevels: { low: 0, medium: 0, high: 0, critical: 0 },
          appointmentTypes: { individual: 0, group: 0, crisis: 0 },
          challengeTypes: { mindfulness: 0, exercise: 0, sleep: 0, social: 0, academic: 0 },
          supportCategories: { academic: 0, personal: 0, financial: 0, health: 0, other: 0 }
        },
        trends: { monthly: [] },
        recentActivities: [],
        rawData: {
          assessments: [],
          appointments: [],
          challenges: [],
          supportTickets: []
        }
      })
    }

    const studentIds = students.map(s => s.studentId)
    
    // Step 2: Get mental health assessments
    let assessments = []
    try {
      assessments = await prisma.mentalHealthAssessment.findMany({
        where: {
          studentId: { in: studentIds }
        },
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
      console.log('Mental health assessments found:', assessments.length)
    } catch (error) {
      console.log('Mental health assessment query failed:', error.message)
      assessments = []
    }

    // Step 3: Get counseling appointments
    let appointments = []
    try {
      appointments = await prisma.counselingAppointment.findMany({
        where: {
          studentId: { in: studentIds }
        },
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
      console.log('Counseling appointments found:', appointments.length)
    } catch (error) {
      console.log('Counseling appointment query failed:', error.message)
      appointments = []
    }

    // Step 4: Get wellness challenges
    let challenges = []
    try {
      challenges = await prisma.wellnessChallenge.findMany({
        where: {
          studentId: { in: studentIds }
        },
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
      console.log('Wellness challenges found:', challenges.length)
    } catch (error) {
      console.log('Wellness challenge query failed:', error.message)
      challenges = []
    }

    // Step 5: Get support tickets
    let supportTickets = []
    try {
      supportTickets = await prisma.supportTicket.findMany({
        where: {
          studentId: { in: studentIds }
        },
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
      console.log('Support tickets found:', supportTickets.length)
    } catch (error) {
      console.log('Support ticket query failed:', error.message)
      supportTickets = []
    }

    // Step 6: Calculate summary statistics
    const totalStudents = students.length
    const studentsWithAssessments = new Set(assessments.map(a => a.studentId)).size
    const assessmentCoverage = totalStudents > 0 ? (studentsWithAssessments / totalStudents) * 100 : 0

    // Calculate averages
    const avgStressLevel = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + a.stressLevel, 0) / assessments.length 
      : 0
    
    const avgAnxietyLevel = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + a.anxietyLevel, 0) / assessments.length 
      : 0
    
    const avgDepressionLevel = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + a.depressionLevel, 0) / assessments.length 
      : 0
    
    const avgSleepQuality = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + a.sleepQuality, 0) / assessments.length 
      : 0
    
    const avgOverallWellness = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + a.overallWellness, 0) / assessments.length 
      : 0

    // Step 7: Calculate risk distribution
    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 }
    
    assessments.forEach(assessment => {
      const avgRisk = (assessment.stressLevel + assessment.anxietyLevel + assessment.depressionLevel) / 3
      if (avgRisk <= 3) riskDistribution.low++
      else if (avgRisk <= 5) riskDistribution.medium++
      else if (avgRisk <= 7) riskDistribution.high++
      else riskDistribution.critical++
    })

    // Step 8: Calculate distributions
    const appointmentTypes = {
      individual: appointments.filter(a => a.type === 'Individual').length,
      group: appointments.filter(a => a.type === 'Group').length,
      crisis: appointments.filter(a => a.type === 'Crisis').length
    }

    const challengeTypes = {
      mindfulness: challenges.filter(c => c.challengeType === 'Mindfulness').length,
      exercise: challenges.filter(c => c.challengeType === 'Exercise').length,
      sleep: challenges.filter(c => c.challengeType === 'Sleep').length,
      social: challenges.filter(c => c.challengeType === 'Social').length,
      academic: challenges.filter(c => c.challengeType === 'Academic').length
    }

    const supportCategories = {
      academic: supportTickets.filter(t => t.category === 'Academic').length,
      personal: supportTickets.filter(t => t.category === 'Personal').length,
      financial: supportTickets.filter(t => t.category === 'Financial').length,
      health: supportTickets.filter(t => t.category === 'Health').length,
      other: supportTickets.filter(t => t.category === 'Other').length
    }

    // Step 9: Calculate monthly trends (last 6 months)
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      
      const monthAssessments = assessments.filter(a => 
        new Date(a.assessmentDate) >= monthStart && new Date(a.assessmentDate) < monthEnd
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

    // Step 10: Generate recent activities
    const recentActivities = []
    
    // Add recent assessments
    assessments.slice(0, 5).forEach(a => {
      recentActivities.push({
        type: 'assessment',
        studentName: a.student.name,
        studentId: a.studentId,
        date: a.assessmentDate,
        details: 'Stress: ' + a.stressLevel + '/10, Wellness: ' + a.overallWellness + '/10'
      })
    })
    
    // Add recent appointments
    appointments.slice(0, 3).forEach(a => {
      recentActivities.push({
        type: 'appointment',
        studentName: a.student.name,
        studentId: a.studentId,
        date: a.appointmentDate,
        details: a.type + ' session with ' + a.counselorName
      })
    })
    
    // Add recent support tickets
    supportTickets.slice(0, 2).forEach(t => {
      recentActivities.push({
        type: 'support',
        studentName: t.isAnonymous ? 'Anonymous' : t.student.name,
        studentId: t.isAnonymous ? null : t.studentId,
        date: t.createdAt,
        details: t.priority + ' priority: ' + t.subject
      })
    })
    
    // Sort by date (most recent first)
    recentActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Step 11: Build final response
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
        appointmentTypes,
        challengeTypes,
        supportCategories
      },
      trends: {
        monthly: monthlyTrends
      },
      recentActivities: recentActivities.slice(0, 10),
      rawData: {
        assessments: assessments.slice(0, 100), // Return more data since we have it
        appointments: appointments.slice(0, 50),
        challenges: challenges.slice(0, 50),
        supportTickets: supportTickets.slice(0, 50)
      }
    }

    console.log('Final response summary:')
    console.log('- Total students:', response.summary.totalStudents)
    console.log('- Total assessments:', response.summary.totalAssessments)
    console.log('- Assessment coverage:', response.summary.assessmentCoverage + '%')
    console.log('- Raw assessments returned:', response.rawData.assessments.length)

    return c.json(response)

  } catch (error) {
    console.error('Mental health analytics error:', error)
    return c.json({ 
      error: 'Failed to fetch mental health analytics',
      details: error.message 
    }, 500)
  }
})

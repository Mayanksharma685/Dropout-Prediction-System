import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  try {
    // Get teacher ID from cookies
    const teacherIdRaw = c.req.header('Cookie')?.match(/uid=([^;]+)/)?.[1]
    if (!teacherIdRaw) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const teacherId = decodeURIComponent(teacherIdRaw)
    const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
    
    // Get query parameters
    const url = new URL(c.req.url)
    const studentId = url.searchParams.get('studentId')
    
    // Base filter for teacher's students
    const baseFilter = studentId 
      ? { studentId, teacherId }
      : { teacherId }
    
    // Get all students with their latest data
    const students = await prisma.student.findMany({
      where: baseFilter,
      include: {
        // Academic data
        attendance: {
          orderBy: { month: 'desc' },
          take: 6 // Last 6 months
        },
        testScores: {
          orderBy: { testDate: 'desc' },
          take: 10 // Last 10 tests
        },
        backlogs: {
          where: { cleared: false }
        },
        feePayments: {
          where: { status: 'Pending' }
        },
        riskFlags: {
          orderBy: { flagDate: 'desc' },
          take: 5
        },
        
        // Mental health data
        mentalHealthAssessments: {
          orderBy: { assessmentDate: 'desc' },
          take: 5
        },
        counselingAppointments: {
          orderBy: { appointmentDate: 'desc' },
          take: 10
        },
        wellnessChallenges: {
          where: { status: 'Active' }
        },
        supportTickets: {
          where: { status: { in: ['Open', 'In Progress'] } }
        }
      }
    })
    
    // Calculate integrated risk scores for each student
    const integratedAnalysis = students.map(student => {
      // Academic risk factors
      const avgAttendance = student.attendance.length > 0 
        ? student.attendance.reduce((sum, a) => sum + a.attendancePercent, 0) / student.attendance.length 
        : 0
      
      const avgTestScore = student.testScores.length > 0 
        ? student.testScores.reduce((sum, t) => sum + t.score, 0) / student.testScores.length 
        : 0
      
      const backlogCount = student.backlogs.length
      const pendingFees = student.feePayments.length
      
      // Mental health risk factors
      const latestAssessment = student.mentalHealthAssessments[0]
      const avgStress = latestAssessment ? latestAssessment.stressLevel : 5
      const avgAnxiety = latestAssessment ? latestAssessment.anxietyLevel : 5
      const avgDepression = latestAssessment ? latestAssessment.depressionLevel : 5
      const overallWellness = latestAssessment ? latestAssessment.overallWellness : 5
      const sleepQuality = latestAssessment ? latestAssessment.sleepQuality : 5
      
      // Support system indicators
      const recentAppointments = student.counselingAppointments.filter(a => 
        new Date(a.appointmentDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length
      
      const activeChallenges = student.wellnessChallenges.length
      const openTickets = student.supportTickets.length
      
      // Calculate composite risk scores (0-10 scale)
      
      // Academic Risk Score
      let academicRisk = 0
      if (avgAttendance < 60) academicRisk += 3
      else if (avgAttendance < 75) academicRisk += 2
      else if (avgAttendance < 85) academicRisk += 1
      
      if (avgTestScore < 40) academicRisk += 3
      else if (avgTestScore < 60) academicRisk += 2
      else if (avgTestScore < 75) academicRisk += 1
      
      academicRisk += Math.min(backlogCount * 0.5, 2) // Max 2 points for backlogs
      academicRisk += Math.min(pendingFees * 0.3, 1.5) // Max 1.5 points for fees
      
      // Mental Health Risk Score
      let mentalHealthRisk = 0
      mentalHealthRisk += (avgStress / 10) * 2.5 // Max 2.5 points
      mentalHealthRisk += (avgAnxiety / 10) * 2.5 // Max 2.5 points
      mentalHealthRisk += (avgDepression / 10) * 2.5 // Max 2.5 points
      mentalHealthRisk += ((10 - overallWellness) / 10) * 1.5 // Max 1.5 points
      mentalHealthRisk += ((10 - sleepQuality) / 10) * 1 // Max 1 point
      
      // Support System Risk (lack of support increases risk)
      let supportRisk = 0
      if (recentAppointments === 0 && (avgStress > 6 || avgAnxiety > 6)) supportRisk += 2
      if (activeChallenges === 0 && overallWellness < 6) supportRisk += 1
      if (openTickets > 2) supportRisk += 1.5
      
      // Integrated Risk Score (weighted combination)
      const integratedRisk = (
        academicRisk * 0.4 + 
        mentalHealthRisk * 0.4 + 
        supportRisk * 0.2
      )
      
      // Risk level categorization
      let riskLevel = 'Low'
      let riskColor = 'green'
      let priority = 'Low'
      
      if (integratedRisk >= 7) {
        riskLevel = 'Critical'
        riskColor = 'red'
        priority = 'Critical'
      } else if (integratedRisk >= 5) {
        riskLevel = 'High'
        riskColor = 'orange'
        priority = 'High'
      } else if (integratedRisk >= 3) {
        riskLevel = 'Medium'
        riskColor = 'yellow'
        priority = 'Medium'
      }
      
      // Recommendations based on risk factors
      const recommendations = []
      
      if (avgAttendance < 75) {
        recommendations.push({
          type: 'academic',
          priority: 'high',
          message: 'Improve attendance - currently at ' + Math.round(avgAttendance) + '%'
        })
      }
      
      if (avgTestScore < 60) {
        recommendations.push({
          type: 'academic',
          priority: 'high',
          message: 'Academic support needed - average score ' + Math.round(avgTestScore) + '%'
        })
      }
      
      if (avgStress > 6 || avgAnxiety > 6) {
        recommendations.push({
          type: 'mental_health',
          priority: 'high',
          message: 'High stress/anxiety levels detected - counseling recommended'
        })
      }
      
      if (overallWellness < 5) {
        recommendations.push({
          type: 'mental_health',
          priority: 'medium',
          message: 'Low wellness score - wellness program participation suggested'
        })
      }
      
      if (recentAppointments === 0 && mentalHealthRisk > 5) {
        recommendations.push({
          type: 'support',
          priority: 'high',
          message: 'No recent counseling sessions - schedule appointment'
        })
      }
      
      if (activeChallenges === 0 && overallWellness < 6) {
        recommendations.push({
          type: 'support',
          priority: 'medium',
          message: 'No active wellness challenges - create engagement activities'
        })
      }
      
      return {
        student: {
          studentId: student.studentId,
          name: student.name,
          department: student.department,
          currentSemester: student.currentSemester,
          email: student.email
        },
        riskAnalysis: {
          integratedRisk: Math.round(integratedRisk * 10) / 10,
          riskLevel,
          riskColor,
          priority,
          academicRisk: Math.round(academicRisk * 10) / 10,
          mentalHealthRisk: Math.round(mentalHealthRisk * 10) / 10,
          supportRisk: Math.round(supportRisk * 10) / 10
        },
        metrics: {
          academic: {
            avgAttendance: Math.round(avgAttendance),
            avgTestScore: Math.round(avgTestScore),
            backlogCount,
            pendingFees
          },
          mentalHealth: {
            avgStress,
            avgAnxiety,
            avgDepression,
            overallWellness,
            sleepQuality,
            assessmentDate: latestAssessment?.assessmentDate || null
          },
          support: {
            recentAppointments,
            activeChallenges,
            openTickets,
            lastAppointment: student.counselingAppointments[0]?.appointmentDate || null
          }
        },
        recommendations,
        lastUpdated: new Date().toISOString()
      }
    })
    
    // Sort by integrated risk score (highest first)
    integratedAnalysis.sort((a, b) => b.riskAnalysis.integratedRisk - a.riskAnalysis.integratedRisk)
    
    // Summary statistics
    const summary = {
      totalStudents: integratedAnalysis.length,
      riskDistribution: {
        critical: integratedAnalysis.filter(s => s.riskAnalysis.riskLevel === 'Critical').length,
        high: integratedAnalysis.filter(s => s.riskAnalysis.riskLevel === 'High').length,
        medium: integratedAnalysis.filter(s => s.riskAnalysis.riskLevel === 'Medium').length,
        low: integratedAnalysis.filter(s => s.riskAnalysis.riskLevel === 'Low').length
      },
      averageRisks: {
        integrated: integratedAnalysis.reduce((sum, s) => sum + s.riskAnalysis.integratedRisk, 0) / integratedAnalysis.length,
        academic: integratedAnalysis.reduce((sum, s) => sum + s.riskAnalysis.academicRisk, 0) / integratedAnalysis.length,
        mentalHealth: integratedAnalysis.reduce((sum, s) => sum + s.riskAnalysis.mentalHealthRisk, 0) / integratedAnalysis.length,
        support: integratedAnalysis.reduce((sum, s) => sum + s.riskAnalysis.supportRisk, 0) / integratedAnalysis.length
      },
      studentsNeedingAttention: integratedAnalysis.filter(s => 
        s.riskAnalysis.riskLevel === 'Critical' || s.riskAnalysis.riskLevel === 'High'
      ).length
    }
    
    return c.json({
      summary,
      students: integratedAnalysis,
      generatedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Integrated risk analysis error:', error)
    return c.json({ error: 'Failed to perform integrated risk analysis' }, 500)
  }
})

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
    // Get all PhD supervisions for the teacher
    const phdSupervisions = await prisma.phdSupervision.findMany({
      where: { supervisorId: teacherId },
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

    // Calculate summary statistics
    const totalPhds = phdSupervisions.length
    const ongoingPhds = phdSupervisions.filter(phd => phd.status === 'Ongoing').length
    const completedPhds = phdSupervisions.filter(phd => phd.status === 'Completed').length
    const discontinuedPhds = phdSupervisions.filter(phd => phd.status === 'Discontinued').length

    // Status distribution
    const statusDistribution = {
      Ongoing: ongoingPhds,
      Completed: completedPhds,
      Discontinued: discontinuedPhds
    }

    // Research areas analysis
    const researchAreas: Record<string, number> = {}
    phdSupervisions.forEach(phd => {
      const area = phd.researchArea || 'Other'
      researchAreas[area] = (researchAreas[area] || 0) + 1
    })

    // Department distribution
    const departmentDistribution: Record<string, number> = {}
    phdSupervisions.forEach(phd => {
      const dept = phd.student.department || 'Unknown'
      departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1
    })

    // Timeline analysis - PhD completion trends by year
    const completionTrends: Record<string, number> = {}
    const currentYear = new Date().getFullYear()
    
    // Initialize last 5 years
    for (let i = 4; i >= 0; i--) {
      const year = (currentYear - i).toString()
      completionTrends[year] = 0
    }

    phdSupervisions.forEach(phd => {
      if (phd.status === 'Completed' && phd.expectedEnd) {
        const year = new Date(phd.expectedEnd).getFullYear().toString()
        if (completionTrends[year] !== undefined) {
          completionTrends[year]++
        }
      }
    })

    // Duration analysis for completed PhDs
    const durationAnalysis: number[] = []
    phdSupervisions.forEach(phd => {
      if (phd.status === 'Completed' && phd.startDate && phd.expectedEnd) {
        const startDate = new Date(phd.startDate)
        const endDate = new Date(phd.expectedEnd)
        const durationMonths = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
        if (durationMonths > 0) {
          durationAnalysis.push(durationMonths)
        }
      }
    })

    const averageDuration = durationAnalysis.length > 0 
      ? Math.round(durationAnalysis.reduce((a, b) => a + b, 0) / durationAnalysis.length)
      : 0

    // Recent activity (last 10 PhD supervisions)
    const recentActivity = phdSupervisions
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 10)
      .map(phd => ({
        id: phd.phdId,
        title: phd.title,
        studentName: phd.student.name,
        status: phd.status,
        startDate: phd.startDate,
        researchArea: phd.researchArea
      }))

    // Upcoming milestones (PhDs expected to complete in next 6 months)
    const sixMonthsFromNow = new Date()
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
    
    const upcomingCompletions = phdSupervisions.filter(phd => 
      phd.status === 'Ongoing' && 
      phd.expectedEnd && 
      new Date(phd.expectedEnd) <= sixMonthsFromNow
    ).map(phd => ({
      id: phd.phdId,
      title: phd.title,
      studentName: phd.student.name,
      expectedEnd: phd.expectedEnd,
      researchArea: phd.researchArea
    }))

    return c.json({
      summary: {
        totalPhds,
        ongoingPhds,
        completedPhds,
        discontinuedPhds,
        averageDuration: `${Math.floor(averageDuration / 12)} years ${averageDuration % 12} months`
      },
      charts: {
        statusDistribution,
        researchAreas,
        departmentDistribution,
        completionTrends,
        durationDistribution: {
          labels: ['< 3 years', '3-4 years', '4-5 years', '5+ years'],
          values: [
            durationAnalysis.filter(d => d < 36).length,
            durationAnalysis.filter(d => d >= 36 && d < 48).length,
            durationAnalysis.filter(d => d >= 48 && d < 60).length,
            durationAnalysis.filter(d => d >= 60).length
          ]
        }
      },
      recentActivity,
      upcomingCompletions
    })

  } catch (error) {
    console.error('Error fetching PhD analytics:', error)
    return c.json({ error: 'Failed to fetch PhD analytics' }, 500)
  }
})

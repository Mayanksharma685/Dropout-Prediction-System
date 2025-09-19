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

  // Get fellowship type filter from query params
  const url = new URL(c.req.url)
  const fellowshipType = url.searchParams.get('type') // 'Full Time', 'Part Time', or null for all

  try {
    // Build where clause
    const whereClause: any = { supervisorId: teacherId }
    if (fellowshipType) {
      whereClause.type = fellowshipType
    }

    // Get all fellowships for the teacher
    const fellowships = await prisma.fellowship.findMany({
      where: whereClause,
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
    const totalFellowships = fellowships.length
    const activeFellowships = fellowships.filter(f => f.status === 'Active').length
    const completedFellowships = fellowships.filter(f => f.status === 'Completed').length
    const terminatedFellowships = fellowships.filter(f => f.status === 'Terminated').length

    // Type distribution
    const typeDistribution = {
      'Full Time': fellowships.filter(f => f.type === 'Full Time').length,
      'Part Time': fellowships.filter(f => f.type === 'Part Time').length
    }

    // Status distribution
    const statusDistribution = {
      Active: activeFellowships,
      Completed: completedFellowships,
      Terminated: terminatedFellowships
    }

    // Financial analysis
    const totalAmount = fellowships.reduce((sum, f) => sum + (Number(f.amount) || 0), 0)
    const activeAmount = fellowships
      .filter(f => f.status === 'Active')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0)

    // Monthly disbursement calculation
    const monthlyDisbursement = fellowships
      .filter(f => f.status === 'Active')
      .reduce((sum, f) => {
        const monthlyAmount = Number(f.amount) || 0
        return sum + monthlyAmount
      }, 0)

    // Department distribution
    const departmentDistribution: Record<string, number> = {}
    fellowships.forEach(fellowship => {
      const dept = fellowship.student.department || 'Unknown'
      departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1
    })

    // Duration analysis
    const durationAnalysis: number[] = []
    fellowships.forEach(fellowship => {
      const duration = Number(fellowship.duration) || 0
      if (duration > 0) {
        durationAnalysis.push(duration)
      }
    })

    const averageDuration = durationAnalysis.length > 0 
      ? Math.round(durationAnalysis.reduce((a, b) => a + b, 0) / durationAnalysis.length)
      : 0

    // Amount distribution analysis
    const amountRanges = {
      'Below ₹25,000': fellowships.filter(f => Number(f.amount) < 25000).length,
      '₹25,000 - ₹50,000': fellowships.filter(f => Number(f.amount) >= 25000 && Number(f.amount) < 50000).length,
      '₹50,000 - ₹75,000': fellowships.filter(f => Number(f.amount) >= 50000 && Number(f.amount) < 75000).length,
      'Above ₹75,000': fellowships.filter(f => Number(f.amount) >= 75000).length
    }

    // Monthly trends (fellowships started by month in last 12 months)
    const monthlyTrends: Record<string, number> = {}
    const currentDate = new Date()
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyTrends[monthKey] = 0
    }

    fellowships.forEach(fellowship => {
      if (fellowship.startDate) {
        const startDate = new Date(fellowship.startDate)
        const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`
        if (monthlyTrends[monthKey] !== undefined) {
          monthlyTrends[monthKey]++
        }
      }
    })

    // Recent activity (last 10 fellowships)
    const recentActivity = fellowships
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 10)
      .map(fellowship => ({
        id: fellowship.fellowshipId,
        studentName: fellowship.student.name,
        type: fellowship.type,
        amount: fellowship.amount,
        status: fellowship.status,
        startDate: fellowship.startDate,
        duration: fellowship.duration
      }))

    // Upcoming expirations (fellowships ending in next 3 months)
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
    
    const upcomingExpirations = fellowships.filter(fellowship => 
      fellowship.status === 'Active' && 
      fellowship.endDate && 
      new Date(fellowship.endDate) <= threeMonthsFromNow
    ).map(fellowship => ({
      id: fellowship.fellowshipId,
      studentName: fellowship.student.name,
      type: fellowship.type,
      amount: fellowship.amount,
      endDate: fellowship.endDate,
      duration: fellowship.duration
    }))

    // Performance metrics
    const completionRate = totalFellowships > 0 
      ? Math.round((completedFellowships / totalFellowships) * 100)
      : 0

    const terminationRate = totalFellowships > 0 
      ? Math.round((terminatedFellowships / totalFellowships) * 100)
      : 0

    return c.json({
      summary: {
        totalFellowships,
        activeFellowships,
        completedFellowships,
        terminatedFellowships,
        totalAmount: totalAmount.toLocaleString('en-IN'),
        activeAmount: activeAmount.toLocaleString('en-IN'),
        monthlyDisbursement: monthlyDisbursement.toLocaleString('en-IN'),
        averageDuration: `${averageDuration} months`,
        completionRate: `${completionRate}%`,
        terminationRate: `${terminationRate}%`
      },
      charts: {
        typeDistribution,
        statusDistribution,
        departmentDistribution,
        amountRanges,
        monthlyTrends,
        durationDistribution: {
          labels: ['< 6 months', '6-12 months', '12-24 months', '24+ months'],
          values: [
            durationAnalysis.filter(d => d < 6).length,
            durationAnalysis.filter(d => d >= 6 && d < 12).length,
            durationAnalysis.filter(d => d >= 12 && d < 24).length,
            durationAnalysis.filter(d => d >= 24).length
          ]
        }
      },
      recentActivity,
      upcomingExpirations,
      fellowshipType: fellowshipType || 'All Types'
    })

  } catch (error) {
    console.error('Error fetching fellowship analytics:', error)
    return c.json({ error: 'Failed to fetch fellowship analytics' }, 500)
  }
})

import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  // Get authenticated teacher ID from cookies
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  
  if (!uid) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  try {
    // Get all projects for the authenticated teacher
    const projects = await prisma.project.findMany({
      where: {
        supervisorId: uid
      },
      include: {
        student: {
          select: {
            studentId: true,
            name: true,
            email: true,
            department: true,
            currentSemester: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    // Calculate summary statistics
    const totalProjects = projects.length
    const activeProjects = projects.filter(p => p.status === 'Active').length
    const completedProjects = projects.filter(p => p.status === 'Completed').length
    const suspendedProjects = projects.filter(p => p.status === 'Suspended').length

    // Calculate average project duration for completed projects
    const completedWithDuration = projects.filter(p => p.status === 'Completed' && p.endDate)
    const avgDuration = completedWithDuration.length > 0 
      ? Math.round(completedWithDuration.reduce((sum, p) => {
          const start = new Date(p.startDate)
          const end = new Date(p.endDate!)
          const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) // days
          return sum + duration
        }, 0) / completedWithDuration.length)
      : 0

    // Status distribution
    const statusDistribution = {
      Active: activeProjects,
      Completed: completedProjects,
      Suspended: suspendedProjects
    }

    // Department distribution
    const departmentDistribution: Record<string, number> = {}
    projects.forEach(project => {
      const dept = project.student.department || 'Unknown'
      departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1
    })

    // Monthly project trends (last 12 months)
    const monthlyTrends: Array<{month: string, started: number, completed: number}> = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = date.toISOString().slice(0, 7) // YYYY-MM format
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      const started = projects.filter(p => {
        const startMonth = new Date(p.startDate).toISOString().slice(0, 7)
        return startMonth === monthStr
      }).length
      
      const completed = projects.filter(p => {
        if (!p.endDate) return false
        const endMonth = new Date(p.endDate).toISOString().slice(0, 7)
        return endMonth === monthStr
      }).length
      
      monthlyTrends.push({
        month: monthName,
        started,
        completed
      })
    }

    // Duration analysis for completed projects
    const durationAnalysis = {
      'Under 3 months': completedWithDuration.filter(p => {
        const duration = (new Date(p.endDate!).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24)
        return duration < 90
      }).length,
      '3-6 months': completedWithDuration.filter(p => {
        const duration = (new Date(p.endDate!).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24)
        return duration >= 90 && duration < 180
      }).length,
      '6-12 months': completedWithDuration.filter(p => {
        const duration = (new Date(p.endDate!).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24)
        return duration >= 180 && duration < 365
      }).length,
      'Over 1 year': completedWithDuration.filter(p => {
        const duration = (new Date(p.endDate!).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24)
        return duration >= 365
      }).length
    }

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentActivity = projects
      .filter(p => new Date(p.startDate) >= thirtyDaysAgo || (p.endDate && new Date(p.endDate) >= thirtyDaysAgo))
      .map(p => ({
        projectId: p.projectId,
        title: p.title,
        studentName: p.student.name,
        action: new Date(p.startDate) >= thirtyDaysAgo ? 'Started' : 'Completed',
        date: new Date(p.startDate) >= thirtyDaysAgo ? p.startDate : p.endDate,
        status: p.status
      }))
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
      .slice(0, 10)

    // Upcoming project deadlines (projects with end dates in next 30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const upcomingDeadlines = projects
      .filter(p => p.endDate && p.status === 'Active')
      .filter(p => {
        const endDate = new Date(p.endDate!)
        return endDate >= now && endDate <= thirtyDaysFromNow
      })
      .map(p => ({
        projectId: p.projectId,
        title: p.title,
        studentName: p.student.name,
        endDate: p.endDate,
        daysRemaining: Math.ceil((new Date(p.endDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining)

    // Performance metrics
    const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0
    const suspensionRate = totalProjects > 0 ? Math.round((suspendedProjects / totalProjects) * 100) : 0

    return c.json({
      summary: {
        totalProjects,
        activeProjects,
        completedProjects,
        suspendedProjects,
        avgDuration,
        completionRate,
        suspensionRate
      },
      distributions: {
        status: statusDistribution,
        departments: departmentDistribution,
        duration: durationAnalysis
      },
      trends: {
        monthly: monthlyTrends
      },
      activity: {
        recent: recentActivity,
        upcomingDeadlines
      }
    })
  } catch (error) {
    console.error('Error fetching project analytics:', error)
    return c.json({ error: 'Failed to fetch project analytics' }, 500)
  }
})

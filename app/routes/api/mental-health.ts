import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  try {
    const cookies = c.req.raw.headers.get('Cookie') || ''
    const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
    const teacherId = uidRaw ? decodeURIComponent(uidRaw) : undefined
    
    if (!teacherId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
    
    const url = new URL(c.req.url)
    const type = url.searchParams.get('type') // assessment, appointment, challenge, ticket
    const studentId = url.searchParams.get('studentId')
    
    // Get students that belong to this teacher first
    const teacherStudents = await prisma.student.findMany({
      where: { teacherId },
      select: { studentId: true }
    })
    
    const studentIds = teacherStudents.map(s => s.studentId)
    
    if (studentIds.length === 0) {
      return c.json([]) // No students for this teacher
    }
    
    const baseFilter = studentId 
      ? { studentId: studentId }
      : { studentId: { in: studentIds } }
    
    switch (type) {
      case 'assessment':
        const assessments = await prisma.mentalHealthAssessment.findMany({
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
        return c.json(assessments)
        
      case 'appointment':
        const appointments = await prisma.counselingAppointment.findMany({
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
        return c.json(appointments)
        
      case 'challenge':
        const challenges = await prisma.wellnessChallenge.findMany({
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
        return c.json(challenges)
        
      case 'ticket':
        const tickets = await prisma.supportTicket.findMany({
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
        return c.json(tickets)
        
      default:
        return c.json({ error: 'Invalid type parameter' }, 400)
    }
    
  } catch (error) {
    console.error('Mental health GET error:', error)
    return c.json({ error: 'Failed to fetch mental health data' }, 500)
  }
})

export const POST = createRoute(async (c) => {
  try {
    const teacherIdRaw = c.req.header('Cookie')?.match(/uid=([^;]+)/)?.[1]
    if (!teacherIdRaw) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const teacherId = decodeURIComponent(teacherIdRaw)
    const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
    
    const body = await c.req.json()
    const { type, ...data } = body
    
    // Verify student belongs to teacher
    const student = await prisma.student.findFirst({
      where: { studentId: data.studentId, teacherId }
    })
    
    if (!student) {
      return c.json({ error: 'Student not found or unauthorized' }, 404)
    }
    
    switch (type) {
      case 'assessment':
        const assessment = await prisma.mentalHealthAssessment.create({
          data: {
            studentId: data.studentId,
            stressLevel: data.stressLevel,
            anxietyLevel: data.anxietyLevel,
            depressionLevel: data.depressionLevel,
            sleepQuality: data.sleepQuality,
            academicPressure: data.academicPressure,
            socialSupport: data.socialSupport,
            overallWellness: data.overallWellness,
            notes: data.notes,
            riskScore: (data.stressLevel + data.anxietyLevel + data.depressionLevel) / 3
          },
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
        return c.json(assessment)
        
      case 'appointment':
        const appointment = await prisma.counselingAppointment.create({
          data: {
            studentId: data.studentId,
            counselorName: data.counselorName,
            appointmentDate: new Date(data.appointmentDate),
            duration: data.duration,
            type: data.type,
            status: data.status || 'Scheduled',
            notes: data.notes,
            followUpNeeded: data.followUpNeeded || false
          },
          include: {
            student: {
              select: {
                studentId: true,
                name: true
              }
            }
          }
        })
        return c.json(appointment)
        
      case 'challenge':
        const challenge = await prisma.wellnessChallenge.create({
          data: {
            studentId: data.studentId,
            challengeType: data.challengeType,
            title: data.title,
            description: data.description,
            targetValue: data.targetValue,
            currentProgress: data.currentProgress || 0,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            status: data.status || 'Active',
            points: data.points || 0
          },
          include: {
            student: {
              select: {
                studentId: true,
                name: true
              }
            }
          }
        })
        return c.json(challenge)
        
      case 'ticket':
        const ticket = await prisma.supportTicket.create({
          data: {
            studentId: data.studentId,
            category: data.category,
            priority: data.priority || 'Medium',
            subject: data.subject,
            description: data.description,
            status: data.status || 'Open',
            isAnonymous: data.isAnonymous || false,
            assignedTo: data.assignedTo
          },
          include: {
            student: {
              select: {
                studentId: true,
                name: true
              }
            }
          }
        })
        return c.json(ticket)
        
      default:
        return c.json({ error: 'Invalid type parameter' }, 400)
    }
    
  } catch (error) {
    console.error('Mental health POST error:', error)
    return c.json({ error: 'Failed to create mental health record' }, 500)
  }
})

export const PUT = createRoute(async (c) => {
  try {
    const teacherIdRaw = c.req.header('Cookie')?.match(/uid=([^;]+)/)?.[1]
    if (!teacherIdRaw) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const teacherId = decodeURIComponent(teacherIdRaw)
    const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
    
    const body = await c.req.json()
    const { type, id, ...data } = body
    
    switch (type) {
      case 'assessment':
        const assessment = await prisma.mentalHealthAssessment.updateMany({
          where: { 
            assessmentId: id,
            student: { teacherId }
          },
          data: {
            stressLevel: data.stressLevel,
            anxietyLevel: data.anxietyLevel,
            depressionLevel: data.depressionLevel,
            sleepQuality: data.sleepQuality,
            academicPressure: data.academicPressure,
            socialSupport: data.socialSupport,
            overallWellness: data.overallWellness,
            notes: data.notes,
            riskScore: (data.stressLevel + data.anxietyLevel + data.depressionLevel) / 3
          }
        })
        return c.json({ success: assessment.count > 0 })
        
      case 'appointment':
        const appointment = await prisma.counselingAppointment.updateMany({
          where: { 
            appointmentId: id,
            student: { teacherId }
          },
          data: {
            counselorName: data.counselorName,
            appointmentDate: new Date(data.appointmentDate),
            duration: data.duration,
            type: data.type,
            status: data.status,
            notes: data.notes,
            followUpNeeded: data.followUpNeeded
          }
        })
        return c.json({ success: appointment.count > 0 })
        
      case 'challenge':
        const challenge = await prisma.wellnessChallenge.updateMany({
          where: { 
            challengeId: id,
            student: { teacherId }
          },
          data: {
            challengeType: data.challengeType,
            title: data.title,
            description: data.description,
            targetValue: data.targetValue,
            currentProgress: data.currentProgress,
            endDate: new Date(data.endDate),
            status: data.status,
            points: data.points
          }
        })
        return c.json({ success: challenge.count > 0 })
        
      case 'ticket':
        const ticket = await prisma.supportTicket.updateMany({
          where: { 
            ticketId: id,
            student: { teacherId }
          },
          data: {
            category: data.category,
            priority: data.priority,
            subject: data.subject,
            description: data.description,
            status: data.status,
            assignedTo: data.assignedTo,
            response: data.response,
            resolvedAt: data.status === 'Resolved' ? new Date() : null
          }
        })
        return c.json({ success: ticket.count > 0 })
        
      default:
        return c.json({ error: 'Invalid type parameter' }, 400)
    }
    
  } catch (error) {
    console.error('Mental health PUT error:', error)
    return c.json({ error: 'Failed to update mental health record' }, 500)
  }
})

export const DELETE = createRoute(async (c) => {
  try {
    const teacherIdRaw = c.req.header('Cookie')?.match(/uid=([^;]+)/)?.[1]
    if (!teacherIdRaw) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const teacherId = decodeURIComponent(teacherIdRaw)
    const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
    
    const url = new URL(c.req.url)
    const type = url.searchParams.get('type')
    const id = parseInt(url.searchParams.get('id') || '0')
    
    switch (type) {
      case 'assessment':
        const assessment = await prisma.mentalHealthAssessment.deleteMany({
          where: { 
            assessmentId: id,
            student: { teacherId }
          }
        })
        return c.json({ success: assessment.count > 0 })
        
      case 'appointment':
        const appointment = await prisma.counselingAppointment.deleteMany({
          where: { 
            appointmentId: id,
            student: { teacherId }
          }
        })
        return c.json({ success: appointment.count > 0 })
        
      case 'challenge':
        const challenge = await prisma.wellnessChallenge.deleteMany({
          where: { 
            challengeId: id,
            student: { teacherId }
          }
        })
        return c.json({ success: challenge.count > 0 })
        
      case 'ticket':
        const ticket = await prisma.supportTicket.deleteMany({
          where: { 
            ticketId: id,
            student: { teacherId }
          }
        })
        return c.json({ success: ticket.count > 0 })
        
      default:
        return c.json({ error: 'Invalid type parameter' }, 400)
    }
    
  } catch (error) {
    console.error('Mental health DELETE error:', error)
    return c.json({ error: 'Failed to delete mental health record' }, 500)
  }
})

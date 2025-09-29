import { createRoute } from 'honox/factory'

export const POST = createRoute(async (c) => {
  try {
    // Get teacher ID from cookies
    const teacherIdRaw = c.req.header('Cookie')?.match(/uid=([^;]+)/)?.[1]
    if (!teacherIdRaw) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const teacherId = decodeURIComponent(teacherIdRaw)
    const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
    
    console.log('=== CREATING TEST MENTAL HEALTH DATA ===')
    console.log('Teacher ID:', teacherId)
    
    // Get students for this teacher
    const students = await prisma.student.findMany({
      where: { teacherId },
      select: { studentId: true, name: true }
    })
    
    console.log('Students found:', students.length)
    
    if (students.length === 0) {
      return c.json({ error: 'No students found for this teacher' }, 400)
    }
    
    // Create sample mental health assessments
    const assessments = []
    const currentDate = new Date()
    
    for (let i = 0; i < Math.min(students.length, 10); i++) {
      const student = students[i]
      
      // Create 2-3 assessments per student over the last few months
      for (let j = 0; j < 3; j++) {
        const assessmentDate = new Date(currentDate)
        assessmentDate.setMonth(assessmentDate.getMonth() - j)
        
        const assessment = {
          studentId: student.studentId,
          assessmentDate: assessmentDate,
          stressLevel: Math.floor(Math.random() * 10) + 1,
          anxietyLevel: Math.floor(Math.random() * 10) + 1,
          depressionLevel: Math.floor(Math.random() * 8) + 1,
          sleepQuality: Math.floor(Math.random() * 10) + 1,
          academicPressure: Math.floor(Math.random() * 10) + 1,
          socialSupport: Math.floor(Math.random() * 10) + 1,
          overallWellness: Math.floor(Math.random() * 10) + 1,
          notes: `Sample assessment ${j + 1} for ${student.name}`
        }
        
        try {
          const created = await prisma.mentalHealthAssessment.create({
            data: assessment
          })
          assessments.push(created)
          console.log(`Created assessment for ${student.name}:`, created.id)
        } catch (error) {
          console.log(`Failed to create assessment for ${student.name}:`, error.message)
        }
      }
    }
    
    // Create some counseling appointments
    const appointments = []
    for (let i = 0; i < Math.min(students.length, 5); i++) {
      const student = students[i]
      const appointmentDate = new Date(currentDate)
      appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 30))
      
      const appointment = {
        studentId: student.studentId,
        appointmentDate: appointmentDate,
        counselorName: 'Dr. Smith',
        type: ['Individual', 'Group', 'Crisis'][Math.floor(Math.random() * 3)],
        status: ['Scheduled', 'Completed', 'Cancelled'][Math.floor(Math.random() * 3)],
        notes: `Counseling session for ${student.name}`
      }
      
      try {
        const created = await prisma.counselingAppointment.create({
          data: appointment
        })
        appointments.push(created)
        console.log(`Created appointment for ${student.name}:`, created.id)
      } catch (error) {
        console.log(`Failed to create appointment for ${student.name}:`, error.message)
      }
    }
    
    // Create some wellness challenges
    const challenges = []
    for (let i = 0; i < Math.min(students.length, 8); i++) {
      const student = students[i]
      const startDate = new Date(currentDate)
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60))
      
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 30)
      
      const challenge = {
        studentId: student.studentId,
        challengeType: ['Mindfulness', 'Exercise', 'Sleep', 'Social', 'Academic'][Math.floor(Math.random() * 5)],
        title: `Wellness Challenge for ${student.name}`,
        description: 'Sample wellness challenge description',
        startDate: startDate,
        endDate: endDate,
        targetValue: Math.floor(Math.random() * 100) + 1,
        currentProgress: Math.floor(Math.random() * 80),
        status: ['Active', 'Completed', 'Abandoned'][Math.floor(Math.random() * 3)],
        pointsEarned: Math.floor(Math.random() * 50)
      }
      
      try {
        const created = await prisma.wellnessChallenge.create({
          data: challenge
        })
        challenges.push(created)
        console.log(`Created challenge for ${student.name}:`, created.id)
      } catch (error) {
        console.log(`Failed to create challenge for ${student.name}:`, error.message)
      }
    }
    
    // Create some support tickets
    const tickets = []
    for (let i = 0; i < Math.min(students.length, 6); i++) {
      const student = students[i]
      const createdAt = new Date(currentDate)
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30))
      
      const ticket = {
        studentId: student.studentId,
        subject: `Support request from ${student.name}`,
        description: 'Sample support ticket description',
        category: ['Academic', 'Personal', 'Financial', 'Health', 'Other'][Math.floor(Math.random() * 5)],
        priority: ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)],
        status: ['Open', 'In Progress', 'Resolved', 'Closed'][Math.floor(Math.random() * 4)],
        isAnonymous: Math.random() > 0.7,
        createdAt: createdAt,
        updatedAt: createdAt
      }
      
      try {
        const created = await prisma.supportTicket.create({
          data: ticket
        })
        tickets.push(created)
        console.log(`Created support ticket for ${student.name}:`, created.id)
      } catch (error) {
        console.log(`Failed to create support ticket for ${student.name}:`, error.message)
      }
    }
    
    return c.json({
      success: true,
      message: 'Test mental health data created successfully',
      data: {
        assessments: assessments.length,
        appointments: appointments.length,
        challenges: challenges.length,
        tickets: tickets.length
      }
    })
    
  } catch (error) {
    console.error('Error creating test data:', error)
    return c.json({ 
      error: 'Failed to create test mental health data',
      details: error.message 
    }, 500)
  }
})

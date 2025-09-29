// Sample Mental Health Data Creator
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createSampleMentalHealthData() {
  try {
    console.log('Creating sample mental health data...')
    
    // Get existing students
    const students = await prisma.student.findMany({
      take: 10,
      select: { studentId: true, name: true }
    })
    
    if (students.length === 0) {
      console.log('No students found. Please add students first.')
      return
    }
    
    console.log(`Found ${students.length} students`)
    
    // Create sample mental health assessments
    const assessments = []
    for (const student of students) {
      // Create 2-3 assessments per student over the last 3 months
      for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
        const daysAgo = Math.floor(Math.random() * 90) // Last 90 days
        const assessmentDate = new Date()
        assessmentDate.setDate(assessmentDate.getDate() - daysAgo)
        
        const stressLevel = Math.floor(Math.random() * 10) + 1
        const anxietyLevel = Math.floor(Math.random() * 10) + 1
        const depressionLevel = Math.floor(Math.random() * 8) + 1 // Generally lower
        const sleepQuality = Math.floor(Math.random() * 10) + 1
        const academicPressure = Math.floor(Math.random() * 10) + 1
        const socialSupport = Math.floor(Math.random() * 10) + 1
        const overallWellness = Math.floor(Math.random() * 10) + 1
        
        assessments.push({
          studentId: student.studentId,
          assessmentDate,
          stressLevel,
          anxietyLevel,
          depressionLevel,
          sleepQuality,
          academicPressure,
          socialSupport,
          overallWellness,
          riskScore: (stressLevel + anxietyLevel + depressionLevel) / 3,
          notes: `Assessment for ${student.name} - ${i + 1}`
        })
      }
    }
    
    // Insert assessments
    console.log(`Creating ${assessments.length} mental health assessments...`)
    await prisma.mentalHealthAssessment.createMany({
      data: assessments,
      skipDuplicates: true
    })
    
    // Create sample counseling appointments
    const appointments = []
    const counselors = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown']
    const appointmentTypes = ['Individual', 'Group', 'Crisis']
    const statuses = ['Scheduled', 'Completed', 'Cancelled']
    
    for (let i = 0; i < 15; i++) {
      const student = students[Math.floor(Math.random() * students.length)]
      const daysFromNow = Math.floor(Math.random() * 60) - 30 // -30 to +30 days
      const appointmentDate = new Date()
      appointmentDate.setDate(appointmentDate.getDate() + daysFromNow)
      
      appointments.push({
        studentId: student.studentId,
        counselorName: counselors[Math.floor(Math.random() * counselors.length)],
        appointmentDate,
        duration: [30, 45, 60][Math.floor(Math.random() * 3)],
        type: appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        notes: `Counseling session for ${student.name}`,
        followUpNeeded: Math.random() > 0.7
      })
    }
    
    console.log(`Creating ${appointments.length} counseling appointments...`)
    await prisma.counselingAppointment.createMany({
      data: appointments,
      skipDuplicates: true
    })
    
    // Create sample wellness challenges
    const challenges = []
    const challengeTypes = ['Mindfulness', 'Exercise', 'Sleep', 'Social', 'Academic']
    const challengeTitles = {
      'Mindfulness': ['Daily Meditation', '10-Minute Breathing', 'Mindful Walking'],
      'Exercise': ['Daily Steps', 'Gym Sessions', 'Yoga Practice'],
      'Sleep': ['Sleep Schedule', 'Screen Time Limit', 'Bedtime Routine'],
      'Social': ['Social Connections', 'Group Activities', 'Friend Meetups'],
      'Academic': ['Study Schedule', 'Assignment Planning', 'Time Management']
    }
    
    for (let i = 0; i < 20; i++) {
      const student = students[Math.floor(Math.random() * students.length)]
      const challengeType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)]
      const title = challengeTitles[challengeType][Math.floor(Math.random() * challengeTitles[challengeType].length)]
      
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30))
      
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 30)
      
      const targetValue = Math.floor(Math.random() * 30) + 1
      const currentProgress = Math.floor(Math.random() * targetValue)
      
      challenges.push({
        studentId: student.studentId,
        challengeType,
        title,
        description: `${title} challenge for improved wellbeing`,
        targetValue,
        currentProgress,
        startDate,
        endDate,
        status: currentProgress >= targetValue ? 'Completed' : 'Active',
        points: Math.floor(currentProgress / targetValue * 100)
      })
    }
    
    console.log(`Creating ${challenges.length} wellness challenges...`)
    await prisma.wellnessChallenge.createMany({
      data: challenges,
      skipDuplicates: true
    })
    
    // Create sample support tickets
    const tickets = []
    const categories = ['Academic', 'Personal', 'Financial', 'Health', 'Other']
    const priorities = ['Low', 'Medium', 'High', 'Critical']
    const subjects = [
      'Need help with course selection',
      'Financial aid assistance',
      'Personal counseling request',
      'Health insurance questions',
      'Academic stress management',
      'Career guidance needed',
      'Mental health support'
    ]
    
    for (let i = 0; i < 12; i++) {
      const student = students[Math.floor(Math.random() * students.length)]
      const subject = subjects[Math.floor(Math.random() * subjects.length)]
      const category = categories[Math.floor(Math.random() * categories.length)]
      const priority = priorities[Math.floor(Math.random() * priorities.length)]
      
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 14))
      
      tickets.push({
        studentId: student.studentId,
        category,
        priority,
        subject,
        description: `Support request: ${subject}`,
        status: Math.random() > 0.3 ? 'Open' : 'Resolved',
        isAnonymous: Math.random() > 0.8,
        createdAt,
        assignedTo: Math.random() > 0.5 ? 'Support Team' : null
      })
    }
    
    console.log(`Creating ${tickets.length} support tickets...`)
    await prisma.supportTicket.createMany({
      data: tickets,
      skipDuplicates: true
    })
    
    console.log('✅ Sample mental health data created successfully!')
    console.log(`Created:
    - ${assessments.length} mental health assessments
    - ${appointments.length} counseling appointments  
    - ${challenges.length} wellness challenges
    - ${tickets.length} support tickets`)
    
  } catch (error) {
    console.error('Error creating sample data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleMentalHealthData()

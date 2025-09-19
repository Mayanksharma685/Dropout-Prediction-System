import { createRoute } from 'honox/factory'

export const POST = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  try {
    // Check authentication
    const teacherIdRaw = c.req.header('Cookie')?.match(/uid=([^;]+)/)?.[1]
    
    if (!teacherIdRaw) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    const teacherId = decodeURIComponent(teacherIdRaw)

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({ where: { teacherId } })
    if (!teacher) {
      return c.json({ error: 'Teacher not found' }, 404)
    }

    // Check if students already exist for this teacher
    const existingStudents = await prisma.student.count({ where: { teacherId } })
    if (existingStudents > 0) {
      return c.json({ 
        message: 'Sample data already exists',
        existingStudents 
      })
    }

    // Create sample course subjects
    const sampleCourses = [
      { courseId: 'CS101', name: 'Computer Science Fundamentals', code: 'CS101', semester: 1, department: 'Computer Science' },
      { courseId: 'MATH101', name: 'Mathematics I', code: 'MATH101', semester: 1, department: 'Mathematics' },
      { courseId: 'ENG101', name: 'English Communication', code: 'ENG101', semester: 1, department: 'English' }
    ]

    for (const course of sampleCourses) {
      await prisma.courseSubject.upsert({
        where: { courseId: course.courseId },
        update: {},
        create: course
      })
    }

    // Create sample students
    const sampleStudents = [
      {
        studentId: 'STU001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        dob: new Date('2000-01-15'),
        department: 'Computer Science',
        currentSemester: 3,
        teacherId: teacherId,
        parentName: 'Robert Doe',
        parentEmail: 'robert.doe@example.com',
        parentPhone: '+1234567890'
      },
      {
        studentId: 'STU002', 
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        dob: new Date('2000-03-22'),
        department: 'Computer Science',
        currentSemester: 3,
        teacherId: teacherId,
        parentName: 'Mary Smith',
        parentEmail: 'mary.smith@example.com',
        parentPhone: '+1234567891'
      },
      {
        studentId: 'STU003',
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com', 
        dob: new Date('1999-12-10'),
        department: 'Computer Science',
        currentSemester: 3,
        teacherId: teacherId,
        parentName: 'David Johnson',
        parentEmail: 'david.johnson@example.com',
        parentPhone: '+1234567892'
      }
    ]

    const createdStudents = []
    for (const student of sampleStudents) {
      const created = await prisma.student.create({ data: student })
      createdStudents.push(created)
    }

    // Create sample attendance data
    const attendanceData = []
    for (const student of createdStudents) {
      for (const course of sampleCourses) {
        // Create 3 months of attendance data
        for (let i = 0; i < 3; i++) {
          const month = new Date()
          month.setMonth(month.getMonth() - i)
          month.setDate(1) // First day of month
          
          attendanceData.push({
            studentId: student.studentId,
            courseId: course.courseId,
            month: month,
            attendancePercent: Math.floor(Math.random() * 40) + 60 // 60-100%
          })
        }
      }
    }

    await prisma.attendance.createMany({ data: attendanceData })

    // Create sample test scores
    const testScoreData = []
    for (const student of createdStudents) {
      for (const course of sampleCourses) {
        // Create 5 test scores per course
        for (let i = 0; i < 5; i++) {
          const testDate = new Date()
          testDate.setDate(testDate.getDate() - (i * 15)) // Every 15 days
          
          testScoreData.push({
            studentId: student.studentId,
            courseId: course.courseId,
            testDate: testDate,
            score: Math.floor(Math.random() * 40) + 60 // 60-100
          })
        }
      }
    }

    await prisma.testScore.createMany({ data: testScoreData })

    return c.json({
      message: 'Sample data created successfully',
      created: {
        courses: sampleCourses.length,
        students: createdStudents.length,
        attendanceRecords: attendanceData.length,
        testScores: testScoreData.length
      },
      students: createdStudents.map(s => ({
        studentId: s.studentId,
        name: s.name,
        email: s.email
      }))
    })

  } catch (error: any) {
    console.error('Error creating sample data:', error)
    return c.json({ 
      error: 'Failed to create sample data: ' + error.message,
      stack: error.stack 
    }, 500)
  }
})

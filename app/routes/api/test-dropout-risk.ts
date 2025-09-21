import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  try {
    // Authentication check - using the same method as other pages
    const teacherIdRaw = c.req.header('Cookie')?.match(/uid=([^;]+)/)?.[1]
    if (!teacherIdRaw) {
      return c.json({ error: 'Unauthorized - No teacher ID found' }, 401)
    }
    const uid = decodeURIComponent(teacherIdRaw)

    const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
    
    // Verify teacher exists
    const teacher = await prisma.teacher.findUnique({ where: { teacherId: uid } })
    if (!teacher) {
      return c.json({ error: 'Teacher not found' }, 401)
    }

    // Get student count
    const studentCount = await prisma.student.count({
      where: { teacherId: uid }
    })

    // Test Python backend connection
    const testData = {
      studentID: "TEST001",
      persona: "Good", // Using valid persona from ['Average', 'Fast learners', 'Good', 'Slow learners']
      Current_CGPA: 7.5,
      Total_Backlogs: 2,
      Semester_Score: 75.0,
      Previous_CGPA: 7.2,
      Previous_Backlogs: 1,
      Previous_Score: 72.0
    }

    console.log('Testing Python backend with data:', testData)

    const response = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      return c.json({
        error: 'Python backend connection failed',
        status: response.status,
        details: errorText,
        teacherId: uid,
        teacherName: teacher.name,
        studentCount: studentCount
      }, 500)
    }

    const result = await response.json()
    console.log('Python backend response:', result)

    return c.json({
      success: true,
      message: 'Test successful',
      teacherId: uid,
      teacherName: teacher.name,
      studentCount: studentCount,
      pythonBackendResponse: result,
      testData: testData
    })

  } catch (error) {
    console.error('Test error:', error)
    return c.json({
      error: 'Test failed',
      details: error.message || 'Unknown error'
    }, 500)
  }
})

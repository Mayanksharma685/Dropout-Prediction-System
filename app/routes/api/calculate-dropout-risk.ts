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

    // Get all students for this teacher
    const students = await prisma.student.findMany({
      where: { teacherId: uid },
      include: {
        testScores: {
          orderBy: { testDate: 'desc' },
          take: 2 // Get latest 2 test scores for current and previous
        },
        backlogs: true,
        attendance: {
          orderBy: { month: 'desc' },
          take: 2 // Get latest 2 attendance records
        }
      }
    })

    console.log(`Found ${students.length} students for teacher ${uid}`)

    const results = []
    let processed = 0
    let errors = 0

    for (const student of students) {
      try {
        // Calculate persona based on available data
        let persona = "Average" // Default persona
        
        // Calculate current CGPA from test scores
        const currentCGPA = student.testScores.length > 0 
          ? student.testScores.reduce((sum, score) => sum + score.score, 0) / student.testScores.length / 10
          : 7.0

        // Get current semester score
        const currentSemesterScore = student.testScores.length > 0 
          ? student.testScores[0].score 
          : 75.0

        // Calculate previous CGPA and score
        const previousCGPA = student.testScores.length > 1 
          ? student.testScores.slice(1).reduce((sum, score) => sum + score.score, 0) / (student.testScores.length - 1) / 10
          : currentCGPA - 0.3

        const previousScore = student.testScores.length > 1 
          ? student.testScores[1].score 
          : currentSemesterScore - 3.0

        // Count backlogs
        const totalBacklogs = student.backlogs.length
        const previousBacklogs = Math.max(0, totalBacklogs - 1)

        // Determine persona based on performance (using Python backend accepted values)
        // Python backend accepts: ['Average', 'Fast learners', 'Good', 'Slow learners']
        if (currentCGPA >= 8.5 && currentSemesterScore >= 85) {
          persona = "Fast learners"
        } else if (currentCGPA >= 7.5 && currentSemesterScore >= 75) {
          persona = "Good"
        } else if (currentCGPA >= 6.5 && currentSemesterScore >= 65) {
          persona = "Average"
        } else {
          persona = "Slow learners"
        }

        // Validate persona before sending to Python API
        const validPersonas = ['Average', 'Fast learners', 'Good', 'Slow learners']
        if (!validPersonas.includes(persona)) {
          throw new Error(`Invalid persona '${persona}'. Must be one of: ${validPersonas.join(', ')}`)
        }

        // Prepare data for Python API
        const requestData = {
          studentID: student.studentId,
          persona: persona,
          Current_CGPA: Math.round(currentCGPA * 100) / 100,
          Total_Backlogs: totalBacklogs,
          Semester_Score: Math.round(currentSemesterScore * 100) / 100,
          Previous_CGPA: Math.round(previousCGPA * 100) / 100,
          Previous_Backlogs: previousBacklogs,
          Previous_Score: Math.round(previousScore * 100) / 100
        }

        // Call Python backend API
        console.log(`Calling Python API for student ${student.studentId} with data:`, requestData)
        
        const response = await fetch('http://localhost:8000/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Python API error: ${response.status} - ${errorText}`)
        }

        const responseText = await response.text()
        console.log(`Raw Python API response for ${student.studentId}:`, responseText)
        
        let predictionResult
        try {
          predictionResult = JSON.parse(responseText)
        } catch (parseError) {
          throw new Error(`Failed to parse Python API response: ${responseText}`)
        }
        
        console.log(`Parsed Python API response for ${student.studentId}:`, predictionResult)

        // Create or update risk flag in database
        const riskLevel = predictionResult.risk_flag || 'Unknown'
        const probability = parseFloat(predictionResult.dropout_risk_probability || '0')

        console.log(`Processing risk for ${student.studentId}: riskLevel=${riskLevel}, probability=${probability}`)

        // Validate that we have the required data
        if (!riskLevel || riskLevel === 'Unknown' || riskLevel === null || riskLevel === undefined) {
          throw new Error(`Invalid risk level received from Python API. Expected 'risk_flag' field. Received: ${JSON.stringify(predictionResult)}`)
        }

        // Ensure riskLevel is a valid string
        const validRiskLevels = ['Red', 'Yellow', 'Green', 'red', 'yellow', 'green']
        if (!validRiskLevels.includes(riskLevel)) {
          throw new Error(`Invalid risk level value: '${riskLevel}'. Expected one of: ${validRiskLevels.join(', ')}. Full response: ${JSON.stringify(predictionResult)}`)
        }

        // Delete existing risk flags for this student (using reason field to identify dropout risk flags)
        await prisma.riskFlag.deleteMany({
          where: { 
            studentId: student.studentId,
            reason: 'Dropout Risk'
          }
        })

        // Normalize risk level to proper case
        const normalizedRiskLevel = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).toLowerCase()

        // Create new risk flag (using the correct schema fields)
        // Temporarily store probability in reason field until Prisma client is regenerated
        await prisma.riskFlag.create({
          data: {
            studentId: student.studentId,
            riskLevel: normalizedRiskLevel,
            reason: `Dropout Risk (${(probability * 100).toFixed(1)}%)`,
            flagDate: new Date()
          }
        })

        results.push({
          studentId: student.studentId,
          name: student.name,
          riskLevel: riskLevel,
          probability: probability,
          persona: persona,
          calculatedData: requestData
        })

        processed++

      } catch (error) {
        console.error(`Error processing student ${student.studentId}:`, error)
        errors++
        results.push({
          studentId: student.studentId,
          name: student.name,
          error: error.message || 'Unknown error'
        })
      }
    }

    return c.json({
      success: true,
      message: `Processed ${processed} students successfully, ${errors} errors`,
      totalStudents: students.length,
      processed: processed,
      errors: errors,
      results: results
    })

  } catch (error) {
    console.error('Error in dropout risk calculation:', error)
    return c.json({
      error: 'Failed to calculate dropout risk',
      details: error.message || 'Unknown error'
    }, 500)
  }
})

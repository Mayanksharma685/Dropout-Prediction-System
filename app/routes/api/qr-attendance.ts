import { createRoute } from 'honox/factory'

interface QRGenerateResponse {
  sessionId: string
  qrImage: string
  createdAt: number
  shuffleIndex: number
  baseSessionId: string
}

interface QRVerifyResponse {
  success: boolean
  error?: string
  message?: string
  sessionId?: string
  eventId?: string
}

interface QRVerifyRequest {
  sessionId: string
  studentId: string
  courseId: string
}

// QR Backend URL - adjust this based on your QR backend deployment
const QR_BACKEND_URL = process.env.QR_BACKEND_URL || 'http://localhost:3000'

export const GET = createRoute(async (c) => {
  try {
    const action = c.req.query('action')
    
    if (action === 'current') {
      // Get current shuffled QR code
      const response = await fetch(`${QR_BACKEND_URL}/api/qr/current-qr`)
      if (!response.ok) {
        return c.json({ error: 'No active QR session' }, 404)
      }
      const data = await response.json()
      return c.json(data)
    } else {
      // Generate new QR session
      const response = await fetch(`${QR_BACKEND_URL}/api/qr/generate-qr`)
      const data = await response.json()
      console.log('QR Backend Response:', data) // Debug log
      return c.json(data)
    }
  } catch (error) {
    console.error('Error connecting to QR backend:', error)
    return c.json({ error: 'Cannot connect to QR backend at ' + QR_BACKEND_URL }, 500)
  }
})

export const POST = createRoute(async (c) => {
  try {
      // Verify QR Code and mark attendance
      const body: QRVerifyRequest = await c.req.json()
      const { sessionId, studentId, courseId } = body

      if (!sessionId || !studentId || !courseId) {
        return c.json({ error: 'Missing required fields: sessionId, studentId, courseId' }, 400)
      }

      // Handle shuffled session IDs (extract base session ID if needed)
      let verifySessionId = sessionId;
      if (sessionId.includes('_shuffle_')) {
        // Extract base session ID from shuffled format
        const parts = sessionId.split('_shuffle_');
        verifySessionId = parts[0];
        console.log(`Shuffled session detected: ${sessionId} -> base: ${verifySessionId}`);
      }

      // First verify QR code with backend
      try {
        const qrResponse = await fetch(`${QR_BACKEND_URL}/api/qr/verify-qr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId: verifySessionId })
        })

        if (!qrResponse.ok) {
          const errorText = await qrResponse.text()
          console.error('QR Verify Error:', errorText)
          return c.json({ error: 'Failed to verify QR code', details: errorText }, 500)
        }

        const contentType = qrResponse.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await qrResponse.text()
          console.error('Non-JSON verify response:', responseText)
          return c.json({ error: 'QR backend returned non-JSON response', details: responseText }, 500)
        }

        const qrResult: QRVerifyResponse = await qrResponse.json()

      if (!qrResult.success) {
        return c.json(qrResult, 400)
      }

      // If QR is valid, mark attendance in database
      const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
      
      // Check if student exists
      const student = await prisma.student.findUnique({
        where: { studentId }
      })

      if (!student) {
        return c.json({ error: 'Student not found' }, 404)
      }

      // Check if course exists
      const course = await prisma.courseSubject.findUnique({
        where: { courseId }
      })

      if (!course) {
        return c.json({ error: 'Course not found' }, 404)
      }

      // Get current date for attendance
      const today = new Date()
      const month = today.getMonth() + 1
      const year = today.getFullYear()

      // Check if attendance already exists for today
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          studentId,
          courseId,
          month,
          year,
          // Check if attendance for today already exists
        }
      })

      let attendanceRecord

      if (existingAttendance) {
        // Update existing attendance record
        const currentDaysPresent = existingAttendance.daysPresent || 0
        attendanceRecord = await prisma.attendance.update({
          where: { id: existingAttendance.id },
          data: {
            daysPresent: currentDaysPresent + 1,
            lastUpdated: today
          }
        })
      } else {
        // Create new attendance record
        attendanceRecord = await prisma.attendance.create({
          data: {
            studentId,
            courseId,
            month,
            year,
            daysPresent: 1,
            totalDays: 1, // This should be updated based on actual class schedule
            percentage: 100, // Will be recalculated
            lastUpdated: today
          }
        })
      }

      // Recalculate attendance percentage
      const totalClassesThisMonth = await prisma.attendance.count({
        where: {
          courseId,
          month,
          year
        }
      })

      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendanceRecord.id },
        data: {
          totalDays: Math.max(totalClassesThisMonth, attendanceRecord.daysPresent),
          percentage: Math.round((attendanceRecord.daysPresent / Math.max(totalClassesThisMonth, attendanceRecord.daysPresent)) * 100)
        }
      })

      return c.json({
        success: true,
        message: 'Attendance marked successfully',
        sessionId: qrResult.sessionId,
        student: {
          studentId: student.studentId,
          name: student.name,
          rollNumber: student.rollNumber
        },
        course: {
          courseId: course.courseId,
          name: course.name,
          code: course.code
        },
        attendance: {
          daysPresent: updatedAttendance.daysPresent,
          totalDays: updatedAttendance.totalDays,
          percentage: updatedAttendance.percentage,
          month,
          year
        }
      })
      } catch (fetchError) {
        console.error('Error connecting to QR backend for verification:', fetchError)
        return c.json({ error: 'Cannot connect to QR backend for verification. Make sure it is running on ' + QR_BACKEND_URL }, 500)
      }

  } catch (error) {
    console.error('QR Attendance POST API Error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

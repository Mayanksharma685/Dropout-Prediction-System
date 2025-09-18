import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'

export default createRoute(async (c) => {
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const studentId = c.req.param('studentId')

  if (!studentId) {
    return c.redirect('/dashboard/attendance')
  }

  const teacher = await prisma.teacher.findUnique({ where: { teacherId: uid } })

  // Get student details
  const student = await prisma.student.findFirst({
    where: { 
      studentId: studentId,
      teacherId: uid // Ensure teacher can only view their students
    }
  })

  if (!student) {
    return c.redirect('/dashboard/attendance?error=Student not found')
  }

  // Get all attendance records for this student
  const attendanceRecords = await prisma.attendance.findMany({
    where: { 
      studentId: studentId,
      student: { teacherId: uid }
    },
    include: { 
      courseSubject: true 
    },
    orderBy: { month: 'desc' }
  })

  // Calculate statistics
  const totalRecords = attendanceRecords.length
  const averageAttendance = totalRecords > 0 
    ? attendanceRecords.reduce((sum, record) => sum + record.attendancePercent, 0) / totalRecords 
    : 0

  // Group by course for better visualization
  const attendanceByCourse = attendanceRecords.reduce((acc, record) => {
    const courseKey = record.courseSubject.courseId
    if (!acc[courseKey]) {
      acc[courseKey] = {
        course: record.courseSubject,
        records: [],
        average: 0
      }
    }
    acc[courseKey].records.push(record)
    return acc
  }, {} as Record<string, { course: any, records: any[], average: number }>)

  // Calculate average for each course
  Object.keys(attendanceByCourse).forEach(courseKey => {
    const courseData = attendanceByCourse[courseKey]
    courseData.average = courseData.records.reduce((sum, record) => sum + record.attendancePercent, 0) / courseData.records.length
  })

  // Get attendance distribution
  const excellentCount = attendanceRecords.filter(r => r.attendancePercent >= 90).length
  const goodCount = attendanceRecords.filter(r => r.attendancePercent >= 75 && r.attendancePercent < 90).length
  const averageCount = attendanceRecords.filter(r => r.attendancePercent >= 60 && r.attendancePercent < 75).length
  const poorCount = attendanceRecords.filter(r => r.attendancePercent < 60).length

  return c.render(
    <div class="min-h-screen bg-slate-50">
      
      <div>
        <div class="grid grid-cols-1 md:grid-cols-[16rem_1fr]">
          <Sidebar currentPath={new URL(c.req.url).pathname} />
          <div>
          <Header uid={uid} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
          
          <main class="space-y-8 p-4">
            {/* Back Button */}
            <div class="flex items-center gap-2">
              <button 
                onclick="window.history.back()" 
                class="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Attendance
              </button>
            </div>

            {/* Student Header */}
            <section class="space-y-3">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 class="text-2xl font-semibold text-slate-800">{student.name}</h2>
                  <p class="text-sm text-gray-600">Student ID: {student.studentId}</p>
                </div>
              </div>
            </section>

            {/* Statistics Cards */}
            <section class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="bg-white rounded-xl border shadow-sm p-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Total Records</p>
                    <p class="text-xl font-semibold text-slate-800">{totalRecords}</p>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-xl border shadow-sm p-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Average Attendance</p>
                    <p class="text-xl font-semibold text-slate-800">{averageAttendance.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-xl border shadow-sm p-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Courses Enrolled</p>
                    <p class="text-xl font-semibold text-slate-800">{Object.keys(attendanceByCourse).length}</p>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-xl border shadow-sm p-4">
                <div class="flex items-center gap-3">
                  <div class={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    averageAttendance >= 90 ? 'bg-green-100' : 
                    averageAttendance >= 75 ? 'bg-yellow-100' : 
                    averageAttendance >= 60 ? 'bg-orange-100' : 'bg-red-100'
                  }`}>
                    <svg class={`w-5 h-5 ${
                      averageAttendance >= 90 ? 'text-green-600' : 
                      averageAttendance >= 75 ? 'text-yellow-600' : 
                      averageAttendance >= 60 ? 'text-orange-600' : 'text-red-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Performance</p>
                    <p class={`text-xl font-semibold ${
                      averageAttendance >= 90 ? 'text-green-600' : 
                      averageAttendance >= 75 ? 'text-yellow-600' : 
                      averageAttendance >= 60 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {averageAttendance >= 90 ? 'Excellent' : 
                       averageAttendance >= 75 ? 'Good' : 
                       averageAttendance >= 60 ? 'Average' : 'Poor'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Attendance Distribution */}
            {totalRecords > 0 && (
              <section class="bg-white rounded-xl border shadow-sm p-6">
                <h3 class="text-lg font-semibold text-slate-800 mb-4">Attendance Distribution</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">{excellentCount}</div>
                    <div class="text-sm text-gray-600">Excellent (90%+)</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">{goodCount}</div>
                    <div class="text-sm text-gray-600">Good (75-89%)</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-yellow-600">{averageCount}</div>
                    <div class="text-sm text-gray-600">Average (60-74%)</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-red-600">{poorCount}</div>
                    <div class="text-sm text-gray-600">Poor (&lt;60%)</div>
                  </div>
                </div>
              </section>
            )}

            {/* Course-wise Attendance */}
            {Object.keys(attendanceByCourse).length > 0 && (
              <section class="bg-white rounded-xl border shadow-sm p-6">
                <h3 class="text-lg font-semibold text-slate-800 mb-4">Course-wise Attendance</h3>
                <div class="space-y-4">
                  {Object.values(attendanceByCourse).map((courseData) => (
                    <div class="border rounded-lg p-4">
                      <div class="flex justify-between items-center mb-3">
                        <div>
                          <h4 class="font-medium text-slate-800">{courseData.course.name}</h4>
                          <p class="text-sm text-gray-600">{courseData.course.code} • Semester {courseData.course.semester}</p>
                        </div>
                        <div class="text-right">
                          <div class="text-lg font-semibold text-slate-800">{courseData.average.toFixed(1)}%</div>
                          <div class="text-sm text-gray-600">{courseData.records.length} records</div>
                        </div>
                      </div>
                      
                      {/* Monthly Records */}
                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {courseData.records.map((record) => (
                          <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span class="text-sm text-gray-600">
                              {new Date(record.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                            </span>
                            <span class={`text-sm font-medium ${
                              record.attendancePercent >= 90 ? 'text-green-600' : 
                              record.attendancePercent >= 75 ? 'text-blue-600' : 
                              record.attendancePercent >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {record.attendancePercent}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Attendance Records */}
            <section class="bg-white rounded-xl border shadow-sm p-6">
              <h3 class="text-lg font-semibold text-slate-800 mb-4">All Attendance Records</h3>
              {attendanceRecords.length === 0 ? (
                <p class="text-sm text-gray-600">No attendance records found for this student.</p>
              ) : (
                <div class="overflow-x-auto">
                  <table class="min-w-full text-left text-sm">
                    <thead class="bg-gray-50 text-gray-600">
                      <tr>
                        <th class="px-4 py-3">Course</th>
                        <th class="px-4 py-3">Month</th>
                        <th class="px-4 py-3">Attendance %</th>
                        <th class="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record) => (
                        <tr class="border-t hover:bg-gray-50/60">
                          <td class="px-4 py-3">
                            <div class="font-medium">{record.courseSubject.name}</div>
                            <div class="text-xs text-gray-500">{record.courseSubject.code}</div>
                          </td>
                          <td class="px-4 py-3">{new Date(record.month).toLocaleDateString()}</td>
                          <td class="px-4 py-3">
                            <span class={`font-medium ${
                              record.attendancePercent >= 90 ? 'text-green-600' : 
                              record.attendancePercent >= 75 ? 'text-blue-600' : 
                              record.attendancePercent >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {record.attendancePercent}%
                            </span>
                          </td>
                          <td class="px-4 py-3">
                            <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              record.attendancePercent >= 90 ? 'bg-green-100 text-green-800' : 
                              record.attendancePercent >= 75 ? 'bg-blue-100 text-blue-800' : 
                              record.attendancePercent >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {record.attendancePercent >= 90 ? 'Excellent' : 
                               record.attendancePercent >= 75 ? 'Good' : 
                               record.attendancePercent >= 60 ? 'Average' : 'Poor'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </main>
          </div>
        </div>
      </div>
    </div>
  )
})

import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'

export default createRoute(async (c) => {
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const teacher = await prisma.teacher.findUnique({ where: { teacherId: uid } })

  return c.render(
    <div class="min-h-screen bg-slate-50">
      <div class="grid grid-cols-1 md:grid-cols-[16rem_1fr]">
        <Sidebar currentPath={new URL(c.req.url).pathname} />
        <div>
          <Header uid={uid} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
          
          <main class="space-y-8 p-4">
            <section class="space-y-3">
              <h2 class="text-xl font-semibold text-slate-800">CSV Data Upload</h2>
              <p class="text-sm text-gray-600">Upload comprehensive student data using CSV files. Each file will be processed and inserted into the database automatically.</p>
            </section>

            {/* Upload Progress Section */}
            <section id="upload-progress" class="bg-white rounded-xl border shadow-sm p-4 space-y-3 hidden">
              <h3 class="text-sm font-semibold text-slate-700">Upload Progress</h3>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span id="progress-text">Processing files...</span>
                  <span id="progress-percentage">0%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div id="progress-bar" class="bg-[#E8734A] h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
              </div>
              <div id="upload-log" class="mt-2 text-xs space-y-1 max-h-48 overflow-auto bg-gray-50 rounded p-2 border"></div>
            </section>

            {/* CSV Upload Cards */}
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Students CSV */}
              <div class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-700">Students</h3>
                    <p class="text-xs text-gray-500">Basic student information</p>
                  </div>
                </div>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer" 
                     onclick="document.getElementById('students-file').click()">
                  <input type="file" id="students-file" accept=".csv" class="hidden" data-type="students" />
                  <div class="text-gray-500 text-sm">
                    <div class="mb-2">📄</div>
                    <div>Click to upload students_comprehensive.csv</div>
                  </div>
                </div>
                <div class="text-xs text-gray-600">
                  <strong>Required fields:</strong> studentId, name, email, dob, currentSemester<br/>
                  <strong>Optional:</strong> phone, department, batchId, parentName, parentEmail, parentPhone, address
                </div>
              </div>

              {/* Attendance CSV */}
              <div class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-700">Attendance</h3>
                    <p class="text-xs text-gray-500">Student attendance records</p>
                  </div>
                </div>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors cursor-pointer" 
                     onclick="document.getElementById('attendance-file').click()">
                  <input type="file" id="attendance-file" accept=".csv" class="hidden" data-type="attendance" />
                  <div class="text-gray-500 text-sm">
                    <div class="mb-2">📊</div>
                    <div>Click to upload attendance_comprehensive.csv</div>
                  </div>
                </div>
                <div class="text-xs text-gray-600">
                  <strong>Required fields:</strong> studentId, courseId, month, attendancePercent
                </div>
              </div>

              {/* Test Scores CSV */}
              <div class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-700">Test Scores</h3>
                    <p class="text-xs text-gray-500">Student test and exam scores</p>
                  </div>
                </div>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors cursor-pointer" 
                     onclick="document.getElementById('testscores-file').click()">
                  <input type="file" id="testscores-file" accept=".csv" class="hidden" data-type="testscores" />
                  <div class="text-gray-500 text-sm">
                    <div class="mb-2">📝</div>
                    <div>Click to upload test_scores_comprehensive.csv</div>
                  </div>
                </div>
                <div class="text-xs text-gray-600">
                  <strong>Required fields:</strong> studentId, courseId, testDate, score
                </div>
              </div>

              {/* Backlogs CSV */}
              <div class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-700">Backlogs</h3>
                    <p class="text-xs text-gray-500">Student backlog records</p>
                  </div>
                </div>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors cursor-pointer" 
                     onclick="document.getElementById('backlogs-file').click()">
                  <input type="file" id="backlogs-file" accept=".csv" class="hidden" data-type="backlogs" />
                  <div class="text-gray-500 text-sm">
                    <div class="mb-2">⚠️</div>
                    <div>Click to upload backlogs_comprehensive.csv</div>
                  </div>
                </div>
                <div class="text-xs text-gray-600">
                  <strong>Required fields:</strong> studentId, courseId, attempts, cleared
                </div>
              </div>

              {/* Fee Payments CSV */}
              <div class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-700">Fee Payments</h3>
                    <p class="text-xs text-gray-500">Student fee payment records</p>
                  </div>
                </div>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-yellow-400 transition-colors cursor-pointer" 
                     onclick="document.getElementById('fees-file').click()">
                  <input type="file" id="fees-file" accept=".csv" class="hidden" data-type="fees" />
                  <div class="text-gray-500 text-sm">
                    <div class="mb-2">💰</div>
                    <div>Click to upload fee_payments_comprehensive.csv</div>
                  </div>
                </div>
                <div class="text-xs text-gray-600">
                  <strong>Required fields:</strong> studentId, dueDate, status, dueMonths<br/>
                  <strong>Optional:</strong> paidDate
                </div>
              </div>

              {/* Projects CSV */}
              <div class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-700">Projects</h3>
                    <p class="text-xs text-gray-500">Student project supervision</p>
                  </div>
                </div>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors cursor-pointer" 
                     onclick="document.getElementById('projects-file').click()">
                  <input type="file" id="projects-file" accept=".csv" class="hidden" data-type="projects" />
                  <div class="text-gray-500 text-sm">
                    <div class="mb-2">🚀</div>
                    <div>Click to upload projects_comprehensive.csv</div>
                  </div>
                </div>
                <div class="text-xs text-gray-600">
                  <strong>Required fields:</strong> studentId, title, startDate<br/>
                  <strong>Optional:</strong> description, endDate, status
                </div>
              </div>

              {/* PhD Supervision CSV */}
              <div class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-700">PhD Supervision</h3>
                    <p class="text-xs text-gray-500">PhD student supervision records</p>
                  </div>
                </div>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-teal-400 transition-colors cursor-pointer" 
                     onclick="document.getElementById('phd-file').click()">
                  <input type="file" id="phd-file" accept=".csv" class="hidden" data-type="phd" />
                  <div class="text-gray-500 text-sm">
                    <div class="mb-2">🎓</div>
                    <div>Click to upload phd_supervision_comprehensive.csv</div>
                  </div>
                </div>
                <div class="text-xs text-gray-600">
                  <strong>Required fields:</strong> studentId, title, researchArea, startDate<br/>
                  <strong>Optional:</strong> expectedEnd, status
                </div>
              </div>

              {/* Fellowships CSV */}
              <div class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-700">Fellowships</h3>
                    <p class="text-xs text-gray-500">Student fellowship records</p>
                  </div>
                </div>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors cursor-pointer" 
                     onclick="document.getElementById('fellowships-file').click()">
                  <input type="file" id="fellowships-file" accept=".csv" class="hidden" data-type="fellowships" />
                  <div class="text-gray-500 text-sm">
                    <div class="mb-2">🏆</div>
                    <div>Click to upload fellowships_comprehensive.csv</div>
                  </div>
                </div>
                <div class="text-xs text-gray-600">
                  <strong>Required fields:</strong> studentId, type, amount, duration, startDate<br/>
                  <strong>Optional:</strong> endDate, status
                </div>
              </div>

              {/* Mental Health Assessments CSV */}
              <div class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-700">Mental Health Assessments</h3>
                    <p class="text-xs text-gray-500">Student wellness evaluations</p>
                  </div>
                </div>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-pink-400 transition-colors cursor-pointer" 
                     onclick="document.getElementById('mental-assessments-file').click()">
                  <input type="file" id="mental-assessments-file" accept=".csv" class="hidden" data-type="mental-assessments" />
                  <div class="text-gray-500 text-sm">
                    <div class="mb-2">🧠</div>
                    <div>Click to upload mental_health_assessments.csv</div>
                  </div>
                </div>
                <div class="text-xs text-gray-600">
                  <strong>Required fields:</strong> studentId, assessmentDate, stressLevel, anxietyLevel, depressionLevel, sleepQuality, academicPressure, socialSupport, overallWellness<br/>
                  <strong>Optional:</strong> notes, riskScore
                </div>
              </div>

              {/* Counseling Appointments CSV */}
              <div class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-700">Counseling Appointments</h3>
                    <p class="text-xs text-gray-500">Student counseling sessions</p>
                  </div>
                </div>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-cyan-400 transition-colors cursor-pointer" 
                     onclick="document.getElementById('counseling-file').click()">
                  <input type="file" id="counseling-file" accept=".csv" class="hidden" data-type="counseling" />
                  <div class="text-gray-500 text-sm">
                    <div class="mb-2">🗓️</div>
                    <div>Click to upload counseling_appointments.csv</div>
                  </div>
                </div>
                <div class="text-xs text-gray-600">
                  <strong>Required fields:</strong> studentId, counselorName, appointmentDate, duration, type, status<br/>
                  <strong>Optional:</strong> notes, followUpNeeded
                </div>
              </div>

              {/* Wellness Challenges CSV */}
              <div class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-700">Wellness Challenges</h3>
                    <p class="text-xs text-gray-500">Student wellness activities</p>
                  </div>
                </div>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-400 transition-colors cursor-pointer" 
                     onclick="document.getElementById('wellness-file').click()">
                  <input type="file" id="wellness-file" accept=".csv" class="hidden" data-type="wellness" />
                  <div class="text-gray-500 text-sm">
                    <div class="mb-2">🏃</div>
                    <div>Click to upload wellness_challenges.csv</div>
                  </div>
                </div>
                <div class="text-xs text-gray-600">
                  <strong>Required fields:</strong> studentId, challengeType, title, description, targetValue, currentProgress, startDate, endDate, status<br/>
                  <strong>Optional:</strong> points
                </div>
              </div>

              {/* Support Tickets CSV */}
              <div class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-700">Support Tickets</h3>
                    <p class="text-xs text-gray-500">Student support requests</p>
                  </div>
                </div>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-rose-400 transition-colors cursor-pointer" 
                     onclick="document.getElementById('support-file').click()">
                  <input type="file" id="support-file" accept=".csv" class="hidden" data-type="support" />
                  <div class="text-gray-500 text-sm">
                    <div class="mb-2">🎫</div>
                    <div>Click to upload support_tickets.csv</div>
                  </div>
                </div>
                <div class="text-xs text-gray-600">
                  <strong>Required fields:</strong> studentId, category, priority, subject, description, status, isAnonymous, createdAt<br/>
                  <strong>Optional:</strong> resolvedAt, assignedTo, response
                </div>
              </div>

            </div>

            {/* Upload Controls */}
            <section class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
              <h3 class="text-sm font-semibold text-slate-700">Upload Controls</h3>
              <div class="flex items-center gap-4">
                <button id="upload-all" class="text-white px-6 py-2 rounded-lg font-medium" 
                        style="background-color: #E8734A" 
                        onmouseover="this.style.backgroundColor='#3399FF'" 
                        onmouseout="this.style.backgroundColor='#E8734A'"
                        disabled>
                  Upload All Files
                </button>
                <button id="clear-all" class="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium">
                  Clear All
                </button>
                <div class="text-sm text-gray-600">
                  <span id="files-selected">0 files selected</span>
                </div>
              </div>
              <div class="text-xs text-gray-500">
                <p><strong>Note:</strong> Files will be processed in order: Students → Attendance → Test Scores → Backlogs → Fee Payments → Projects → PhD Supervision → Fellowships → Mental Health Assessments → Counseling Appointments → Wellness Challenges → Support Tickets</p>
                <p>Make sure students exist before uploading related data (attendance, test scores, etc.)</p>
              </div>
            </section>

          </main>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
(function(){
  var TEACHER_ID = '${uid}';
  var selectedFiles = {};
  var uploadOrder = ['students', 'attendance', 'testscores', 'backlogs', 'fees', 'projects', 'phd', 'fellowships', 'mental-assessments', 'counseling', 'wellness', 'support'];
  
  // File input handlers
  var fileInputs = document.querySelectorAll('input[type="file"]');
  var uploadAllBtn = document.getElementById('upload-all');
  var clearAllBtn = document.getElementById('clear-all');
  var filesSelectedSpan = document.getElementById('files-selected');
  var progressSection = document.getElementById('upload-progress');
  var progressBar = document.getElementById('progress-bar');
  var progressText = document.getElementById('progress-text');
  var progressPercentage = document.getElementById('progress-percentage');
  var uploadLog = document.getElementById('upload-log');

  function log(message, className = '') {
    var div = document.createElement('div');
    div.textContent = new Date().toLocaleTimeString() + ': ' + message;
    if (className) div.className = className;
    uploadLog.appendChild(div);
    uploadLog.scrollTop = uploadLog.scrollHeight;
  }

  function updateFileCount() {
    var count = Object.keys(selectedFiles).length;
    filesSelectedSpan.textContent = count + ' files selected';
    uploadAllBtn.disabled = count === 0;
    
    if (count === 0) {
      uploadAllBtn.style.opacity = '0.5';
      uploadAllBtn.style.cursor = 'not-allowed';
    } else {
      uploadAllBtn.style.opacity = '1';
      uploadAllBtn.style.cursor = 'pointer';
    }
  }

  function updateProgress(current, total, message) {
    var percentage = Math.round((current / total) * 100);
    progressBar.style.width = percentage + '%';
    progressPercentage.textContent = percentage + '%';
    progressText.textContent = message;
  }

  // Handle file selection
  fileInputs.forEach(function(input) {
    input.addEventListener('change', function(e) {
      var file = e.target.files[0];
      var type = e.target.getAttribute('data-type');
      
      if (file) {
        selectedFiles[type] = file;
        // Update UI to show file selected
        var card = e.target.closest('.bg-white');
        var dropZone = card.querySelector('.border-dashed');
        dropZone.innerHTML = '<div class="text-green-600 text-sm"><div class="mb-2">✅</div><div>' + file.name + '</div><div class="text-xs text-gray-500 mt-1">' + (file.size / 1024).toFixed(1) + ' KB</div></div>';
        dropZone.classList.remove('border-gray-300');
        dropZone.classList.add('border-green-400', 'bg-green-50');
      } else {
        delete selectedFiles[type];
        // Reset UI
        var card = e.target.closest('.bg-white');
        var dropZone = card.querySelector('.border-dashed');
        var originalText = {
          'students': 'Click to upload students_comprehensive.csv',
          'attendance': 'Click to upload attendance_comprehensive.csv',
          'testscores': 'Click to upload test_scores_comprehensive.csv',
          'backlogs': 'Click to upload backlogs_comprehensive.csv',
          'fees': 'Click to upload fee_payments_comprehensive.csv',
          'projects': 'Click to upload projects_comprehensive.csv',
          'phd': 'Click to upload phd_supervision_comprehensive.csv',
          'fellowships': 'Click to upload fellowships_comprehensive.csv',
          'mental-assessments': 'Click to upload mental_health_assessments.csv',
          'counseling': 'Click to upload counseling_appointments.csv',
          'wellness': 'Click to upload wellness_challenges.csv',
          'support': 'Click to upload support_tickets.csv'
        };
        var icons = {
          'students': '📄',
          'attendance': '📊',
          'testscores': '📝',
          'backlogs': '⚠️',
          'fees': '💰',
          'projects': '🚀',
          'phd': '🎓',
          'fellowships': '🏆',
          'mental-assessments': '🧠',
          'counseling': '🗓️',
          'wellness': '🏃',
          'support': '🎫'
        };
        dropZone.innerHTML = '<div class="text-gray-500 text-sm"><div class="mb-2">' + icons[type] + '</div><div>' + originalText[type] + '</div></div>';
        dropZone.classList.remove('border-green-400', 'bg-green-50');
        dropZone.classList.add('border-gray-300');
      }
      
      updateFileCount();
    });
  });

  // Clear all files
  clearAllBtn.addEventListener('click', function() {
    selectedFiles = {};
    fileInputs.forEach(function(input) {
      input.value = '';
      input.dispatchEvent(new Event('change'));
    });
    updateFileCount();
  });

  // Upload all files
  uploadAllBtn.addEventListener('click', async function() {
    if (Object.keys(selectedFiles).length === 0) return;
    
    progressSection.classList.remove('hidden');
    uploadLog.innerHTML = '';
    uploadAllBtn.disabled = true;
    clearAllBtn.disabled = true;
    
    log('Starting CSV upload process...', 'text-blue-600 font-semibold');
    
    var totalFiles = uploadOrder.filter(type => selectedFiles[type]).length;
    var currentFile = 0;
    
    for (var i = 0; i < uploadOrder.length; i++) {
      var type = uploadOrder[i];
      if (!selectedFiles[type]) continue;
      
      currentFile++;
      var file = selectedFiles[type];
      
      updateProgress(currentFile - 0.5, totalFiles, 'Processing ' + type + ' (' + file.name + ')...');
      log('Processing ' + type + ' file: ' + file.name, 'text-blue-600');
      
      try {
        var formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        var response = await fetch('/api/csv-upload', {
          method: 'POST',
          body: formData
        });
        
        var result = await response.json();
        
        if (response.ok) {
          log('✅ ' + type + ' uploaded successfully: ' + result.processed + ' records processed', 'text-green-600');
          if (result.errors && result.errors.length > 0) {
            result.errors.forEach(function(error) {
              log('⚠️ ' + error, 'text-yellow-600');
            });
          }
        } else {
          log('❌ ' + type + ' upload failed: ' + (result.error || 'Unknown error'), 'text-red-600');
        }
      } catch (error) {
        log('❌ ' + type + ' upload error: ' + error.message, 'text-red-600');
      }
      
      updateProgress(currentFile, totalFiles, 'Completed ' + type);
    }
    
    log('Upload process completed!', 'text-blue-600 font-semibold');
    uploadAllBtn.disabled = false;
    clearAllBtn.disabled = false;
  });

  updateFileCount();
})();
`
      }} />
    </div>
  )
})

import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'

const CourseFormSchema = z.object({
  courseId: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(1),
  semester: z.coerce.number().int().min(1).max(8),
  department: z.string().min(1),
})

export default createRoute(async (c) => {
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  const teacher = await prisma.teacher.findUnique({ where: { teacherId: uid } })

  const url = new URL(c.req.url)
  const success = url.searchParams.get('success')
  const error = url.searchParams.get('error')

  const courses = await prisma.courseSubject.findMany({
    where: teacher?.department ? { department: teacher.department } : {},
    orderBy: [{ semester: 'asc' }, { name: 'asc' }],
    take: 500,
  })

  return c.render(
    <div class="min-h-screen bg-slate-50">
      
      <div>
        <div class="grid grid-cols-1 md:grid-cols-[16rem_1fr]">
          <Sidebar currentPath={new URL(c.req.url).pathname} />
          <div>
          <Header uid={uid} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
          <main class="space-y-8 p-4">
            {(success || error) && (
              <div id="toast" class={`fixed right-4 top-4 z-50 rounded-md border px-4 py-3 shadow-sm ${
                success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div class="text-sm font-medium">
                  {success ? 'Course added successfully' : error || 'Failed to add course'}
                </div>
              </div>
            )}

            {(success || error) && (
              <script dangerouslySetInnerHTML={{
                __html: `
setTimeout(() => {
  const el = document.getElementById('toast');
  if (el) el.style.display = 'none';
  const url = new URL(window.location.href);
  url.searchParams.delete('success');
  url.searchParams.delete('error');
  window.history.replaceState({}, document.title, url.toString());
}, 2500);
`
              }} />
            )}

            <section class="space-y-3">
              <h2 class="text-xl font-semibold text-slate-800">Course Management</h2>
              <p class="text-sm text-gray-600">Add and manage course subjects for your department.</p>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <h3 class="text-sm font-semibold text-slate-700 mb-3">Add New Course</h3>
              <form method="post" class="grid md:grid-cols-5 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Course ID</label>
                  <input class="mt-1 w-full border rounded p-2" type="text" name="courseId" placeholder="CS101" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Course Name</label>
                  <input class="mt-1 w-full border rounded p-2" type="text" name="name" placeholder="Computer Science Fundamentals" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Course Code</label>
                  <input class="mt-1 w-full border rounded p-2" type="text" name="code" placeholder="CS-101" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Semester</label>
                  <select name="semester" class="mt-1 w-full border rounded p-2" required>
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <option value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Department</label>
                  <input class="mt-1 w-full border rounded p-2" type="text" name="department" value={teacher?.department || ''} required />
                </div>
                <div class="md:col-span-5">
                  <button class="text-white px-4 py-2 rounded" style="background-color: #E8734A" onmouseover="this.style.backgroundColor='#FC816B'" onmouseout="this.style.backgroundColor='#E8734A'" type="submit">Add Course</button>
                </div>
              </form>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <h3 class="text-sm font-semibold text-slate-700 mb-3">Existing Courses</h3>
              <p class="text-xs text-gray-600 mb-4">Click on any course to view detailed summary including attendance, test scores, and backlog information.</p>
              {courses.length === 0 ? (
                <p class="text-sm text-gray-600">No courses found for your department.</p>
              ) : (
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <div 
                      class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-orange-300"
                      onclick={`showCourseSummary('${course.courseId}')`}
                    >
                      <div class="flex justify-between items-start mb-2">
                        <h4 class="font-semibold text-slate-800">{course.name}</h4>
                        <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Sem {course.semester}</span>
                      </div>
                      <p class="text-sm text-gray-600 mb-1">Course ID: <span class="font-medium">{course.courseId}</span></p>
                      <p class="text-sm text-gray-600 mb-2">Code: <span class="font-medium">{course.code}</span></p>
                      <p class="text-xs text-gray-500">{course.department}</p>
                      <div class="mt-3 text-right">
                        <span class="text-xs text-orange-600 font-medium">View Summary →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Course Summary Modal */}
            <div id="course-summary-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
              <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                  <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                      <h2 id="modal-course-title" class="text-xl font-semibold text-slate-800">Course Summary</h2>
                      <button onclick="hideCourseSummary()" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                    
                    <div id="course-summary-content" class="space-y-6">
                      <div class="text-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                        <p class="text-sm text-gray-600 mt-2">Loading course summary...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
          </div>
        </div>
      </div>
      
      <script dangerouslySetInnerHTML={{
        __html: `
function showCourseSummary(courseId) {
  const modal = document.getElementById('course-summary-modal');
  const content = document.getElementById('course-summary-content');
  const title = document.getElementById('modal-course-title');
  
  modal.classList.remove('hidden');
  title.textContent = 'Loading...';
  
  // Reset content to loading state
  content.innerHTML = \`
    <div class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
      <p class="text-sm text-gray-600 mt-2">Loading course summary...</p>
    </div>
  \`;
  
  // Fetch course summary
  fetch('/api/course-summary?courseId=' + encodeURIComponent(courseId))
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error);
      }
      renderCourseSummary(data);
    })
    .catch(error => {
      content.innerHTML = \`
        <div class="text-center py-8">
          <div class="text-red-500 mb-2">
            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <p class="text-sm text-gray-600">Failed to load course summary</p>
          <p class="text-xs text-red-500 mt-1">\${error.message}</p>
        </div>
      \`;
    });
}

function hideCourseSummary() {
  const modal = document.getElementById('course-summary-modal');
  modal.classList.add('hidden');
}

function renderCourseSummary(data) {
  const content = document.getElementById('course-summary-content');
  const title = document.getElementById('modal-course-title');
  
  title.textContent = data.course.name + ' - Summary';
  
  content.innerHTML = \`
    <!-- Course Info Header -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border">
      <div class="grid md:grid-cols-4 gap-4">
        <div>
          <p class="text-xs text-gray-600">Course ID</p>
          <p class="font-semibold">\${data.course.courseId}</p>
        </div>
        <div>
          <p class="text-xs text-gray-600">Course Code</p>
          <p class="font-semibold">\${data.course.code}</p>
        </div>
        <div>
          <p class="text-xs text-gray-600">Semester</p>
          <p class="font-semibold">Semester \${data.course.semester}</p>
        </div>
        <div>
          <p class="text-xs text-gray-600">Department</p>
          <p class="font-semibold">\${data.course.department}</p>
        </div>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="grid md:grid-cols-4 gap-4">
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-center">
          <div class="bg-green-100 rounded-full p-2 mr-3">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-green-700">\${data.enrollment.totalStudents}</p>
            <p class="text-xs text-green-600">Total Students</p>
          </div>
        </div>
      </div>
      
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center">
          <div class="bg-blue-100 rounded-full p-2 mr-3">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-blue-700">\${Math.round(data.attendance.average)}%</p>
            <p class="text-xs text-blue-600">Avg Attendance</p>
          </div>
        </div>
      </div>
      
      <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div class="flex items-center">
          <div class="bg-purple-100 rounded-full p-2 mr-3">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-purple-700">\${Math.round(data.testScores.average)}</p>
            <p class="text-xs text-purple-600">Avg Test Score</p>
          </div>
        </div>
      </div>
      
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center">
          <div class="bg-red-100 rounded-full p-2 mr-3">
            <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-red-700">\${data.backlogs.pending}</p>
            <p class="text-xs text-red-600">Pending Backlogs</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Statistics -->
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Attendance Distribution -->
      <div class="bg-white border rounded-lg p-4">
        <h4 class="font-semibold text-slate-800 mb-3">Attendance Distribution</h4>
        \${data.attendance.distribution.length > 0 ? 
          data.attendance.distribution.map(item => \`
            <div class="flex justify-between items-center py-2 border-b last:border-b-0">
              <span class="text-sm">\${item.range}</span>
              <span class="font-medium">\${item.count} students</span>
            </div>
          \`).join('') : 
          '<p class="text-sm text-gray-500">No attendance data available</p>'
        }
      </div>

      <!-- Test Score Distribution -->
      <div class="bg-white border rounded-lg p-4">
        <h4 class="font-semibold text-slate-800 mb-3">Test Score Distribution</h4>
        \${data.testScores.distribution.length > 0 ? 
          data.testScores.distribution.map(item => \`
            <div class="flex justify-between items-center py-2 border-b last:border-b-0">
              <span class="text-sm">\${item.grade}</span>
              <span class="font-medium">\${item.count} students</span>
            </div>
          \`).join('') : 
          '<p class="text-sm text-gray-500">No test score data available</p>'
        }
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white border rounded-lg p-4">
      <h4 class="font-semibold text-slate-800 mb-3">Recent Activity</h4>
      <div class="grid md:grid-cols-3 gap-4">
        <div>
          <h5 class="text-sm font-medium text-gray-700 mb-2">Recent Attendance</h5>
          \${data.recentActivity.attendance.length > 0 ? 
            data.recentActivity.attendance.map(item => \`
              <div class="text-xs py-1">
                <span class="font-medium">\${item.student.name}</span>: \${item.attendancePercent}%
                <span class="text-gray-500">(\${new Date(item.month).toLocaleDateString()})</span>
              </div>
            \`).join('') : 
            '<p class="text-xs text-gray-500">No recent attendance</p>'
          }
        </div>
        
        <div>
          <h5 class="text-sm font-medium text-gray-700 mb-2">Recent Test Scores</h5>
          \${data.recentActivity.testScores.length > 0 ? 
            data.recentActivity.testScores.map(item => \`
              <div class="text-xs py-1">
                <span class="font-medium">\${item.student.name}</span>: \${item.score}
                <span class="text-gray-500">(\${new Date(item.testDate).toLocaleDateString()})</span>
              </div>
            \`).join('') : 
            '<p class="text-xs text-gray-500">No recent test scores</p>'
          }
        </div>
        
        <div>
          <h5 class="text-sm font-medium text-gray-700 mb-2">Recent Backlogs</h5>
          \${data.recentActivity.backlogs.length > 0 ? 
            data.recentActivity.backlogs.map(item => \`
              <div class="text-xs py-1">
                <span class="font-medium">\${item.student.name}</span>: \${item.attempts} attempts
                <span class="\${item.cleared ? 'text-green-600' : 'text-red-600'}">\${item.cleared ? '(Cleared)' : '(Pending)'}</span>
              </div>
            \`).join('') : 
            '<p class="text-xs text-gray-500">No recent backlogs</p>'
          }
        </div>
      </div>
    </div>
  \`;
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
  const modal = document.getElementById('course-summary-modal');
  if (event.target === modal) {
    hideCourseSummary();
  }
});
`
      }} />
    </div>
  )
})

export const POST = createRoute(zValidator('form', CourseFormSchema), async (c) => {
  const data = c.req.valid('form')
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  try {
    await prisma.courseSubject.create({
      data: {
        courseId: data.courseId,
        name: data.name,
        code: data.code,
        semester: Number(data.semester),
        department: data.department,
      },
    })
    return c.redirect('/dashboard/courses?success=1')
  } catch (e: any) {
    const errorMsg = e.code === 'P2002' ? 'Course ID already exists' : 'Failed to add course'
    return c.redirect(`/dashboard/courses?error=${encodeURIComponent(errorMsg)}`)
  }
})

import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'

export default createRoute(async (c) => {
  // Get teacher ID from cookies for authentication
  const teacherIdRaw = c.req.header('Cookie')?.match(/uid=([^;]+)/)?.[1]
  
  if (!teacherIdRaw) {
    return c.redirect('/login')
  }

  const teacherId = decodeURIComponent(teacherIdRaw)

  // Fetch teacher info for header
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const teacher = await prisma.teacher.findUnique({ where: { teacherId } })

  return c.render(
    <html>
      <head>
        <title>Students Courses - EduPulse</title>
      </head>
      <body>
        <div class="flex h-screen bg-gray-100">
          <Sidebar currentPath="/dashboard/students/courses" />
          <div class="flex-1 flex flex-col overflow-hidden">
            <Header uid={teacherId} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
            <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                  <div>
                    <h1 class="text-2xl font-bold text-gray-900">Students by Courses</h1>
                    <p class="text-gray-600 mt-1">Navigate through courses and batches to view student lists</p>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <div class="text-center">
                    <div class="text-gray-400 text-4xl mb-4">📚</div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Course Hierarchy Navigation</h3>
                    <p class="text-gray-600 mb-4">
                      This page will implement the requested hierarchical structure:
                    </p>
                    <div class="text-left max-w-lg mx-auto space-y-2">
                      <div class="flex items-center gap-2">
                        <span class="text-blue-500">📚</span>
                        <span class="text-sm text-gray-600"><strong>Courses</strong> → Browse all available courses</span>
                      </div>
                      <div class="flex items-center gap-2 ml-4">
                        <span class="text-green-500">📖</span>
                        <span class="text-sm text-gray-600"><strong>Course-Code/Name</strong> → Individual course details</span>
                      </div>
                      <div class="flex items-center gap-2 ml-8">
                        <span class="text-purple-500">👥</span>
                        <span class="text-sm text-gray-600"><strong>Batch</strong> → Course batches by year</span>
                      </div>
                      <div class="flex items-center gap-2 ml-12">
                        <span class="text-orange-500">📋</span>
                        <span class="text-sm text-gray-600"><strong>Student List</strong> → Students in each batch</span>
                      </div>
                    </div>
                    <div class="mt-6 space-y-3">
                      <p class="text-sm text-gray-500">
                        The hierarchy will show: <strong>Students → Courses → Course-Code/Name → Batch → Student List</strong>
                      </p>
                      <a 
                        href="/dashboard/courses" 
                        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Current Courses System →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
})

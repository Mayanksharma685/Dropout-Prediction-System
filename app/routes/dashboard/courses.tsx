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
      <Header uid={uid} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
      <div>
        <div class="grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-6">
          <Sidebar currentPath={new URL(c.req.url).pathname} />
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
              {courses.length === 0 ? (
                <p class="text-sm text-gray-600">No courses found for your department.</p>
              ) : (
                <div class="overflow-x-auto">
                  <table class="min-w-full text-left text-sm">
                    <thead class="bg-gray-50 text-gray-600">
                      <tr>
                        <th class="px-4 py-3">Course ID</th>
                        <th class="px-4 py-3">Name</th>
                        <th class="px-4 py-3">Code</th>
                        <th class="px-4 py-3">Semester</th>
                        <th class="px-4 py-3">Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr class="border-t hover:bg-gray-50/60">
                          <td class="px-4 py-3 font-medium">{course.courseId}</td>
                          <td class="px-4 py-3">{course.name}</td>
                          <td class="px-4 py-3">{course.code}</td>
                          <td class="px-4 py-3">Semester {course.semester}</td>
                          <td class="px-4 py-3">{course.department}</td>
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

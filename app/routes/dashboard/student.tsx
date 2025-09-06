import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'

const StudentSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  dob: z.string().min(1),
  department: z.string().optional(),
  currentSemester: z.coerce.number().int().min(1),
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

  const students = await prisma.student.findMany({
    where: { teacherId: uid },
    include: {
      attendance: true,
      testScores: true,
      backlogs: true,
      feePayments: true,
      riskFlags: true,
    },
    orderBy: { name: 'asc' },
    take: 200,
  })

  

  return c.render(
    <div class="min-h-screen bg-slate-50">
      <Header uid={uid} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
      <div>
        <div class="grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-6">
          <Sidebar />
          <main class="space-y-8 p-4">
            {(success || error) && (
              <div id="toast" class={`fixed right-4 top-4 z-50 rounded-md border px-4 py-3 shadow-sm ${
                success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div class="text-sm font-medium">
                  {success ? 'Student added successfully' : error || 'Failed to add student'}
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
              <h2 class="text-xl font-semibold text-slate-800">Students</h2>
              <p class="text-sm text-gray-600">Add new students and view their analysis.</p>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <h3 class="text-sm font-semibold text-slate-700 mb-3">Add Student</h3>
              <form method="post" class="grid md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Student ID</label>
                  <input class="mt-1 w-full border rounded p-2" type="text" name="studentId" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Name</label>
                  <input class="mt-1 w-full border rounded p-2" type="text" name="name" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Email</label>
                  <input class="mt-1 w-full border rounded p-2" type="email" name="email" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Phone</label>
                  <input class="mt-1 w-full border rounded p-2" type="text" name="phone" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">DOB</label>
                  <input class="mt-1 w-full border rounded p-2" type="date" name="dob" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Department</label>
                  <input class="mt-1 w-full border rounded p-2" type="text" name="department" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Current Semester</label>
                  <input class="mt-1 w-full border rounded p-2" type="number" name="currentSemester" min="1" required />
                </div>
                <div class="md:col-span-3">
                  <button class="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900" type="submit">Add Student</button>
                </div>
              </form>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <h3 class="text-sm font-semibold text-slate-700 mb-3">All Students</h3>
              {students.length === 0 ? (
                <p class="text-sm text-gray-600">No students yet. Add your first student above.</p>
              ) : (
                <div class="overflow-x-auto">
                  <table class="min-w-full text-left text-sm">
                    <thead class="bg-gray-50 text-gray-600">
                      <tr>
                        <th class="px-4 py-3">Student</th>
                        <th class="px-4 py-3">Email</th>
                        <th class="px-4 py-3">Department</th>
                        <th class="px-4 py-3">Semester</th>
                        <th class="px-4 py-3">Risk Flags</th>
                        <th class="px-4 py-3">Backlogs</th>
                        <th class="px-4 py-3">Unpaid Fees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr class="border-t hover:bg-gray-50/60" key={s.studentId}>
                          <td class="px-4 py-3">
                            <div class="font-medium">{s.name}</div>
                            <div class="text-xs text-gray-500">{s.studentId}</div>
                          </td>
                          <td class="px-4 py-3">{s.email}</td>
                          <td class="px-4 py-3">{s.department ?? '-'}</td>
                          <td class="px-4 py-3">{s.currentSemester}</td>
                          <td class="px-4 py-3">{s.riskFlags?.length ?? 0}</td>
                          <td class="px-4 py-3">{s.backlogs?.length ?? 0}</td>
                          <td class="px-4 py-3">{s.feePayments?.filter((f) => f.status === 'Unpaid').length ?? 0}</td>
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
    </div>,
  )
})

export const POST = createRoute(zValidator('form', StudentSchema), async (c) => {
  const data = c.req.valid('form')
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  try {
    // Ensure the referenced teacher exists to avoid orphan students
    const teacher = await prisma.teacher.findUnique({ where: { teacherId: uid } })
    if (!teacher) {
      return c.redirect(`/dashboard/student?error=${encodeURIComponent('No teacher account found. Please re-login and try again.')}`)
    }
    await prisma.student.create({
      data: {
        studentId: data.studentId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        dob: new Date(data.dob),
        department: data.department,
        currentSemester: Number(data.currentSemester),
        teacherId: uid,
      },
    })
    return c.redirect('/dashboard/student?success=1')
  } catch (e: any) {
    const message = e?.code === 'P2002' ? 'Student ID or email already exists' : 'Failed to create student'
    return c.redirect(`/dashboard/student?error=${encodeURIComponent(message)}`)
  }
  
})



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
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      
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
              <h2 class="text-xl font-semibold text-slate-900">Students</h2>
              <p class="text-sm text-slate-600">Add new students and view their analysis.</p>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <h3 class="text-sm font-semibold text-slate-700 mb-3">Add Student</h3>
              <form method="post" class="grid md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700">Student ID</label>
                  <input class="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-slate-400" type="text" name="studentId" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700">Name</label>
                  <input class="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-slate-400" type="text" name="name" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700">Email</label>
                  <input class="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-slate-400" type="email" name="email" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700">Phone</label>
                  <input class="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-slate-400" type="text" name="phone" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700">DOB</label>
                  <input class="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-slate-400" type="date" name="dob" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700">Department</label>
                  <input class="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-slate-400" type="text" name="department" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700">Current Semester</label>
                  <input class="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-slate-400" type="number" name="currentSemester" min="1" required />
                </div>
                <div class="md:col-span-3">
                  <button class="text-white px-4 py-2 rounded" style="background-color: #E8734A" onmouseover="this.style.backgroundColor='#FC816B'" onmouseout="this.style.backgroundColor='#E8734A'" type="submit">Add Student</button>
                </div>
              </form>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 class="text-sm font-semibold text-slate-700">All Students</h3>
                <div class="relative">
                  <input 
                    type="text" 
                    id="studentSearch" 
                    placeholder="Search by Student ID or Name (e.g., STU011)" 
                    class="pl-8 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-72"
                    oninput="filterStudentsBySearch(this.value)"
                  />
                  <svg class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {students.length === 0 ? (
                <p class="text-sm text-slate-600">No students yet. Add your first student above.</p>
              ) : (
                <div class="overflow-x-auto">
                  <table class="min-w-full text-left text-sm">
                    <thead class="bg-slate-50 text-slate-600">
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
                        <tr class="border-t hover:bg-slate-50/60" key={s.studentId}>
                          <td class="px-4 py-3">
                            <a class="font-medium text-slate-800 hover:underline" href={`/dashboard/student/${encodeURIComponent(s.studentId)}`}>{s.name}</a>
                            <div class="text-xs text-slate-500">
                              <a class="hover:underline" href={`/dashboard/student/${encodeURIComponent(s.studentId)}`}>{s.studentId}</a>
                            </div>
                          </td>
                          <td class="px-4 py-3">{s.email}</td>
                          <td class="px-4 py-3">{s.department??'-'}</td>
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

            {/* Search Filter Script */}
            <script dangerouslySetInnerHTML={{
              __html: `
function filterStudentsBySearch(searchValue) {
  const rows = document.querySelectorAll('tbody tr');
  const searchTerm = searchValue.toLowerCase().trim();
  
  rows.forEach(row => {
    const studentNameCell = row.querySelector('td:first-child a.font-medium');
    const studentIdCell = row.querySelector('td:first-child .text-xs a');
    const emailCell = row.querySelector('td:nth-child(2)');
    const departmentCell = row.querySelector('td:nth-child(3)');
    
    if (studentNameCell && studentIdCell && emailCell) {
      const studentName = studentNameCell.textContent.toLowerCase();
      const studentId = studentIdCell.textContent.toLowerCase();
      const email = emailCell.textContent.toLowerCase();
      const department = departmentCell ? departmentCell.textContent.toLowerCase() : '';
      
      if (studentName.includes(searchTerm) || 
          studentId.includes(searchTerm) || 
          email.includes(searchTerm) || 
          department.includes(searchTerm)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    }
  });
  
  // Show "No results" message if no rows are visible
  const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');
  const table = document.querySelector('table');
  let noResultsMsg = document.getElementById('no-results-msg');
  
  if (visibleRows.length === 0 && searchTerm !== '') {
    if (!noResultsMsg) {
      noResultsMsg = document.createElement('div');
      noResultsMsg.id = 'no-results-msg';
      noResultsMsg.className = 'text-center py-8 text-gray-500';
      noResultsMsg.innerHTML = 'No students found matching your search.';
      table.parentNode.appendChild(noResultsMsg);
    }
    noResultsMsg.style.display = 'block';
  } else {
    if (noResultsMsg) {
      noResultsMsg.style.display = 'none';
    }
  }
}
              `
            }} />
          </main>
          </div>
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



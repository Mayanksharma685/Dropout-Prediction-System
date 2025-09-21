import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'

const BacklogFormSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  attempts: z.coerce.number().int().min(0),
  cleared: z.string().optional(),
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
    orderBy: { name: 'asc' },
    take: 500,
  })

  const courses = await prisma.courseSubject.findMany({
    where: teacher?.department ? { department: teacher.department } : {},
    orderBy: [{ semester: 'asc' }, { name: 'asc' }],
    take: 500,
  })

  const backlogs = await prisma.backlog.findMany({
    where: { student: { teacherId: uid } },
    include: { student: true, courseSubject: true },
    orderBy: { backlogId: 'desc' },
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
                  {success ? 'Backlog entry added' : error || 'Failed to add backlog'}
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
              <h2 class="text-xl font-semibold text-slate-800">Backlogs</h2>
              <p class="text-sm text-gray-600">Add backlog attempts and track clearance status.</p>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <h3 class="text-sm font-semibold text-slate-700 mb-3">Add Backlog</h3>
              <form method="post" class="grid md:grid-cols-4 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700">Student</label>
                  <select name="studentId" class="mt-1 w-full border rounded p-2" required>
                    <option value="">Select student</option>
                    {students.map((s) => (
                      <option value={s.studentId}>{s.name} ({s.studentId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Course</label>
                  <select name="courseId" class="mt-1 w-full border rounded p-2" required>
                    <option value="">Select course</option>
                    {courses.map((c) => (
                      <option value={c.courseId}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Attempts</label>
                  <input class="mt-1 w-full border rounded p-2" type="number" name="attempts" min="0" required />
                </div>
                <div class="md:col-span-4 flex items-center gap-2">
                  <input id="cleared" class="border rounded" type="checkbox" name="cleared" value="on" />
                  <label for="cleared" class="text-sm text-gray-700">Cleared</label>
                </div>
                <div class="md:col-span-4">
                  <button class="text-white px-4 py-2 rounded" style="background-color: #E8734A" onmouseover="this.style.backgroundColor='#3399FF'" onmouseout="this.style.backgroundColor='#E8734A'" type="submit">Add</button>
                </div>
              </form>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 class="text-sm font-semibold text-slate-700">All Backlogs</h3>
                <div class="relative">
                  <input 
                    type="text" 
                    id="studentSearch" 
                    placeholder="Search by Student ID or Name (e.g., STU011)" 
                    class="pl-8 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-72"
                    oninput="filterBacklogsBySearch(this.value)"
                  />
                  <svg class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {backlogs.length === 0 ? (
                <p class="text-sm text-gray-600">No entries yet.</p>
              ) : (
                <div class="overflow-x-auto">
                  <table class="min-w-full text-left text-sm">
                    <thead class="bg-gray-50 text-gray-600">
                      <tr>
                        <th class="px-4 py-3">Student</th>
                        <th class="px-4 py-3">Course</th>
                        <th class="px-4 py-3">Attempts</th>
                        <th class="px-4 py-3">Cleared</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backlogs.map((b) => (
                        <tr class="border-t hover:bg-gray-50/60">
                          <td class="px-4 py-3">
                            <div class="font-medium">{b.student.name}</div>
                            <div class="text-xs text-gray-500">{b.studentId}</div>
                          </td>
                          <td class="px-4 py-3">
                            <div class="font-medium">{b.courseSubject.name}</div>
                            <div class="text-xs text-gray-500">{b.courseSubject.code}</div>
                          </td>
                          <td class="px-4 py-3">{b.attempts}</td>
                          <td class="px-4 py-3">{b.cleared ? 'Yes' : 'No'}</td>
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
function filterBacklogsBySearch(searchValue) {
  const rows = document.querySelectorAll('tbody tr');
  const searchTerm = searchValue.toLowerCase().trim();
  
  rows.forEach(row => {
    const studentNameCell = row.querySelector('td:first-child .font-medium');
    const studentIdCell = row.querySelector('td:first-child .text-xs');
    const courseNameCell = row.querySelector('td:nth-child(2) .font-medium');
    const courseCodeCell = row.querySelector('td:nth-child(2) .text-xs');
    
    if (studentNameCell && studentIdCell) {
      const studentName = studentNameCell.textContent.toLowerCase();
      const studentId = studentIdCell.textContent.toLowerCase();
      const courseName = courseNameCell ? courseNameCell.textContent.toLowerCase() : '';
      const courseCode = courseCodeCell ? courseCodeCell.textContent.toLowerCase() : '';
      
      if (studentName.includes(searchTerm) || 
          studentId.includes(searchTerm) || 
          courseName.includes(searchTerm) || 
          courseCode.includes(searchTerm)) {
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
      noResultsMsg.innerHTML = 'No backlogs found matching your search.';
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
    </div>
  )
})

export const POST = createRoute(zValidator('form', BacklogFormSchema), async (c) => {
  const data = c.req.valid('form')
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  try {
    await prisma.backlog.create({
      data: {
        studentId: data.studentId,
        courseId: data.courseId,
        attempts: Number(data.attempts),
        cleared: data.cleared === 'on',
      },
    })
    return c.redirect('/dashboard/backlogs?success=1')
  } catch (e: any) {
    return c.redirect(`/dashboard/backlogs?error=${encodeURIComponent('Failed to add backlog')}`)
  }
})



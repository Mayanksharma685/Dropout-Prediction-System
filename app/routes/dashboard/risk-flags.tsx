import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'

const RiskFlagFormSchema = z.object({
  studentId: z.string().min(1),
  riskLevel: z.enum(['Low', 'Medium', 'High']),
  reason: z.string().min(1),
  flagDate: z.string().min(1),
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

  const flags = await prisma.riskFlag.findMany({
    where: { student: { teacherId: uid } },
    include: { student: true },
    orderBy: { flagDate: 'desc' },
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
                  {success ? 'Risk flag added' : error || 'Failed to add risk flag'}
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
              <h2 class="text-xl font-semibold text-slate-800">Risk Flags</h2>
              <p class="text-sm text-gray-600">Log and review student risk flags.</p>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <h3 class="text-sm font-semibold text-slate-700 mb-3">Add Risk Flag</h3>
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
                  <label class="block text-sm font-medium text-gray-700">Risk Level</label>
                  <select name="riskLevel" class="mt-1 w-full border rounded p-2" required>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Date</label>
                  <input class="mt-1 w-full border rounded p-2" type="date" name="flagDate" required />
                </div>
                <div class="md:col-span-4">
                  <label class="block text-sm font-medium text-gray-700">Reason</label>
                  <input class="mt-1 w-full border rounded p-2" type="text" name="reason" required />
                </div>
                <div class="md:col-span-4">
                  <button class="text-white px-4 py-2 rounded" style="background-color: #E8734A" onmouseover="this.style.backgroundColor='#FC816B'" onmouseout="this.style.backgroundColor='#E8734A'" type="submit">Add</button>
                </div>
              </form>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <h3 class="text-sm font-semibold text-slate-700 mb-3">Recent Flags</h3>
              {flags.length === 0 ? (
                <p class="text-sm text-gray-600">No entries yet.</p>
              ) : (
                <div class="overflow-x-auto">
                  <table class="min-w-full text-left text-sm">
                    <thead class="bg-gray-50 text-gray-600">
                      <tr>
                        <th class="px-4 py-3">Student</th>
                        <th class="px-4 py-3">Level</th>
                        <th class="px-4 py-3">Date</th>
                        <th class="px-4 py-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flags.map((f) => (
                        <tr class="border-t hover:bg-gray-50/60">
                          <td class="px-4 py-3">
                            <div class="font-medium">{f.student.name}</div>
                            <div class="text-xs text-gray-500">{f.studentId}</div>
                          </td>
                          <td class="px-4 py-3">{f.riskLevel}</td>
                          <td class="px-4 py-3">{new Date(f.flagDate).toLocaleDateString()}</td>
                          <td class="px-4 py-3">{f.reason}</td>
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

export const POST = createRoute(zValidator('form', RiskFlagFormSchema), async (c) => {
  const data = c.req.valid('form')
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  try {
    await prisma.riskFlag.create({
      data: {
        studentId: data.studentId,
        riskLevel: data.riskLevel,
        reason: data.reason,
        flagDate: new Date(data.flagDate),
      },
    })
    return c.redirect('/dashboard/risk-flags?success=1')
  } catch (e: any) {
    return c.redirect(`/dashboard/risk-flags?error=${encodeURIComponent('Failed to add risk flag')}`)
  }
})



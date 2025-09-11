import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'

const FeeFormSchema = z.object({
  studentId: z.string().min(1),
  dueDate: z.string().min(1),
  paidDate: z.string().optional(),
  status: z.enum(['Paid', 'Unpaid']),
  dueMonths: z.coerce.number().int().min(0),
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

  const fees = await prisma.feePayment.findMany({
    where: { student: { teacherId: uid } },
    include: { student: true },
    orderBy: { dueDate: 'desc' },
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
                  {success ? 'Fee payment added' : error || 'Failed to add fee entry'}
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
              <h2 class="text-xl font-semibold text-slate-800">Fees</h2>
              <p class="text-sm text-gray-600">Record fee dues and payments.</p>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <h3 class="text-sm font-semibold text-slate-700 mb-3">Add Fee Entry</h3>
              <form method="post" class="grid md:grid-cols-5 gap-4">
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
                  <label class="block text-sm font-medium text-gray-700">Due Date</label>
                  <input class="mt-1 w-full border rounded p-2" type="date" name="dueDate" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Paid Date</label>
                  <input class="mt-1 w-full border rounded p-2" type="date" name="paidDate" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Status</label>
                  <select name="status" class="mt-1 w-full border rounded p-2" required>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Due Months</label>
                  <input class="mt-1 w-full border rounded p-2" type="number" name="dueMonths" min="0" required />
                </div>
                <div class="md:col-span-5">
                  <button class="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900" type="submit">Add</button>
                </div>
              </form>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <h3 class="text-sm font-semibold text-slate-700 mb-3">Recent Fee Entries</h3>
              {fees.length === 0 ? (
                <p class="text-sm text-gray-600">No entries yet.</p>
              ) : (
                <div class="overflow-x-auto">
                  <table class="min-w-full text-left text-sm">
                    <thead class="bg-gray-50 text-gray-600">
                      <tr>
                        <th class="px-4 py-3">Student</th>
                        <th class="px-4 py-3">Due Date</th>
                        <th class="px-4 py-3">Paid Date</th>
                        <th class="px-4 py-3">Status</th>
                        <th class="px-4 py-3">Due Months</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.map((f) => (
                        <tr class="border-t hover:bg-gray-50/60">
                          <td class="px-4 py-3">
                            <div class="font-medium">{f.student.name}</div>
                            <div class="text-xs text-gray-500">{f.studentId}</div>
                          </td>
                          <td class="px-4 py-3">{new Date(f.dueDate).toLocaleDateString()}</td>
                          <td class="px-4 py-3">{f.paidDate ? new Date(f.paidDate).toLocaleDateString() : '-'}</td>
                          <td class="px-4 py-3">{f.status}</td>
                          <td class="px-4 py-3">{f.dueMonths}</td>
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

export const POST = createRoute(zValidator('form', FeeFormSchema), async (c) => {
  const data = c.req.valid('form')
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  try {
    await prisma.feePayment.create({
      data: {
        studentId: data.studentId,
        dueDate: new Date(data.dueDate),
        paidDate: data.paidDate ? new Date(data.paidDate) : undefined,
        status: data.status,
        dueMonths: Number(data.dueMonths),
      },
    })
    return c.redirect('/dashboard/fees?success=1')
  } catch (e: any) {
    return c.redirect(`/dashboard/fees?error=${encodeURIComponent('Failed to add fee entry')}`)
  }
})



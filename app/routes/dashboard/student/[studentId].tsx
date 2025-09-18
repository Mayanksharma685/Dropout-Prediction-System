import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'

type TimelineItem = {
  date: Date
  type: string
  title: string
  description?: string
}

function formatDate(d: Date) {
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

function formatMonthYear(d: Date) {
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
    })
  } catch {
    return ''
  }
}

export default createRoute(async (c) => {
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  const teacher = await prisma.teacher.findUnique({ where: { teacherId: uid } })

  // read param from the route
  let studentId: string | undefined
  try {
    // Hono API
    // @ts-ignore - types may vary in honox
    studentId = c.req.param('studentId')
  } catch {
    // fallback
    // @ts-ignore - types may vary in honox
    studentId = c.req.param?.('studentId') ?? (c as any).req?.param?.('studentId')
  }

  if (!studentId || typeof studentId !== 'string') {
    return c.redirect('/dashboard/student?error=' + encodeURIComponent('Invalid student id'))
  }

  const student = await prisma.student.findFirst({
    where: { studentId, teacherId: uid },
    include: {
      attendance: true,
      testScores: true,
      backlogs: true,
      feePayments: true,
      notifications: true,
      riskFlags: true,
    },
  })

  if (!student) {
    return c.redirect('/dashboard/student?error=' + encodeURIComponent('Student not found'))
  }

  const timeline: TimelineItem[] = []

  for (const a of student.attendance) {
    timeline.push({
      date: a.month,
      type: 'Attendance',
      title: `Attendance ${formatMonthYear(a.month)}: ${a.attendancePercent}%`,
    })
  }

  for (const t of student.testScores) {
    timeline.push({
      date: t.testDate,
      type: 'TestScore',
      title: `${t.subject} test score: ${t.score}`,
    })
  }

  for (const f of student.feePayments) {
    timeline.push({
      date: f.dueDate,
      type: 'FeePayment',
      title: `Fee due (${formatMonthYear(f.dueDate)}) - ${f.status}`,
      description: f.paidDate ? `Paid on ${formatDate(f.paidDate)}` : 'Not paid',
    })
    if (f.paidDate) {
      timeline.push({
        date: f.paidDate,
        type: 'FeePayment',
        title: `Fee paid (${formatMonthYear(f.dueDate)})`,
      })
    }
  }

  for (const r of student.riskFlags) {
    timeline.push({
      date: r.flagDate,
      type: 'RiskFlag',
      title: `Risk ${r.riskLevel}`,
      description: r.reason,
    })
  }

  for (const n of student.notifications) {
    timeline.push({
      date: n.sentDate,
      type: 'Notification',
      title: `Notification via ${n.channel}`,
      description: n.message,
    })
  }

  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const unpaidFees = student.feePayments.filter((f) => f.status === 'Unpaid').length
  const pendingBacklogs = student.backlogs.filter((b) => !b.cleared).length
  const avgAttendance = student.attendance.length
    ? Math.round((student.attendance.reduce((acc, a) => acc + a.attendancePercent, 0) / student.attendance.length) * 10) / 10
    : 0

  return c.render(
    <div class="min-h-screen bg-slate-50">
      
      <div>
        <div class="grid grid-cols-1 md:grid-cols-[16rem_1fr]">
          <Sidebar currentPath={new URL(c.req.url).pathname} />
          <div>
          <Header uid={uid} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
          <main class="space-y-8 p-4">
            <section class="bg-white rounded-xl border shadow-sm p-4">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="text-lg font-semibold text-slate-800">{student.name}</div>
                  <div class="text-xs text-gray-500">{student.studentId}</div>
                </div>
                <div class="grid grid-cols-3 gap-4 text-center">
                  <div class="px-3 py-2 rounded-md bg-gray-50">
                    <div class="text-xs text-gray-500">Avg Attendance</div>
                    <div class="text-sm font-semibold">{avgAttendance}%</div>
                  </div>
                  <div class="px-3 py-2 rounded-md bg-gray-50">
                    <div class="text-xs text-gray-500">Pending Backlogs</div>
                    <div class="text-sm font-semibold">{pendingBacklogs}</div>
                  </div>
                  <div class="px-3 py-2 rounded-md bg-gray-50">
                    <div class="text-xs text-gray-500">Unpaid Fees</div>
                    <div class="text-sm font-semibold">{unpaidFees}</div>
                  </div>
                </div>
              </div>
              <div class="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                <div class="p-3 rounded border bg-gray-50">
                  <div class="text-gray-500">Email</div>
                  <div class="font-medium">{student.email}</div>
                </div>
                <div class="p-3 rounded border bg-gray-50">
                  <div class="text-gray-500">Phone</div>
                  <div class="font-medium">{student.phone ?? '-'}</div>
                </div>
                <div class="p-3 rounded border bg-gray-50">
                  <div class="text-gray-500">Department</div>
                  <div class="font-medium">{student.department ?? '-'}</div>
                </div>
                <div class="p-3 rounded border bg-gray-50">
                  <div class="text-gray-500">Semester</div>
                  <div class="font-medium">{student.currentSemester}</div>
                </div>
              </div>
              <div class="mt-4 flex items-center justify-end">
                <form method="post" onsubmit="return confirm('Delete this student and related records?')">
                  <input type="hidden" name="intent" value="delete" />
                  <button type="submit" class="px-3 py-2 text-sm rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-100">Delete Student</button>
                </form>
              </div>
              <div class="mt-6 border-t pt-4">
                <h3 class="text-sm font-semibold text-slate-700 mb-3">Edit Student</h3>
                <form method="post" class="grid md:grid-cols-3 gap-4">
                  <input type="hidden" name="intent" value="update" />
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Student ID</label>
                    <input class="mt-1 w-full border rounded p-2 bg-gray-100 text-gray-600" type="text" name="studentId" value={student.studentId} readonly />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Name</label>
                    <input class="mt-1 w-full border rounded p-2" type="text" name="name" value={student.name} required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Email</label>
                    <input class="mt-1 w-full border rounded p-2" type="email" name="email" value={student.email} required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Phone</label>
                    <input class="mt-1 w-full border rounded p-2" type="text" name="phone" value={student.phone ?? ''} />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">DOB</label>
                    <input class="mt-1 w-full border rounded p-2" type="date" name="dob" value={new Date(student.dob).toISOString().slice(0,10)} required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Department</label>
                    <input class="mt-1 w-full border rounded p-2" type="text" name="department" value={student.department ?? ''} />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Current Semester</label>
                    <input class="mt-1 w-full border rounded p-2" type="number" name="currentSemester" min="1" value={String(student.currentSemester)} required />
                  </div>
                  <div class="md:col-span-3">
                    <button type="submit" class="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700">Save Changes</button>
                  </div>
                </form>
              </div>
            </section>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section class="bg-white rounded-xl border shadow-sm p-4 lg:col-span-2">
                <h3 class="text-sm font-semibold text-slate-700 mb-3">Timeline</h3>
                {timeline.length === 0 ? (
                  <p class="text-sm text-gray-600">No events yet.</p>
                ) : (
                  <ol class="relative border-s border-gray-200 ml-3">
                    {timeline.map((item, idx) => (
                      <li class="ms-4 mb-6" key={idx}>
                        <div class="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full bg-slate-400"></div>
                        <div class="flex items-center gap-2">
                          <span class="text-xs px-2 py-0.5 rounded bg-gray-100 border text-gray-700">{item.type}</span>
                          <span class="text-xs text-gray-500">{formatDate(item.date)}</span>
                        </div>
                        <div class="mt-1 text-sm font-medium text-slate-800">{item.title}</div>
                        {item.description && <div class="text-sm text-gray-600">{item.description}</div>}
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section class="bg-white rounded-xl border shadow-sm p-4">
                <h3 class="text-sm font-semibold text-slate-700 mb-3">Backlogs</h3>
                {student.backlogs.length === 0 ? (
                  <p class="text-sm text-gray-600">No backlogs.</p>
                ) : (
                  <ul class="space-y-2">
                    {student.backlogs.map((b) => (
                      <li class="flex items-center justify-between rounded border p-2" key={b.backlogId}>
                        <div>
                          <div class="text-sm font-medium text-slate-800">{b.subject}</div>
                          <div class="text-xs text-gray-500">Attempts: {b.attempts}</div>
                        </div>
                        <span class={`text-xs px-2 py-0.5 rounded border ${b.cleared ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {b.cleared ? 'Cleared' : 'Pending'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <h3 class="text-sm font-semibold text-slate-700 mb-3">Fee Payments</h3>
              {student.feePayments.length === 0 ? (
                <p class="text-sm text-gray-600">No fee records.</p>
              ) : (
                <div class="overflow-x-auto">
                  <table class="min-w-full text-left text-sm">
                    <thead class="bg-gray-50 text-gray-600">
                      <tr>
                        <th class="px-4 py-3">Due Month</th>
                        <th class="px-4 py-3">Months Due</th>
                        <th class="px-4 py-3">Status</th>
                        <th class="px-4 py-3">Paid Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.feePayments
                        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                        .map((f) => (
                          <tr class="border-t" key={f.paymentId}>
                            <td class="px-4 py-3">{formatMonthYear(f.dueDate)}</td>
                            <td class="px-4 py-3">{f.dueMonths}</td>
                            <td class="px-4 py-3">{f.status}</td>
                            <td class="px-4 py-3">{f.paidDate ? formatDate(f.paidDate) : '-'}</td>
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
    </div>,
  )
})



export const POST = createRoute(async (c) => {
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  // read param from the route
  let studentId: string | undefined
  try {
    // @ts-ignore - types may vary in honox
    studentId = c.req.param('studentId')
  } catch {
    // @ts-ignore - types may vary in honox
    studentId = c.req.param?.('studentId') ?? (c as any).req?.param?.('studentId')
  }

  if (!studentId || typeof studentId !== 'string') {
    return c.redirect('/dashboard/student?error=' + encodeURIComponent('Invalid student id'))
  }

  const form = await c.req.formData()
  const intent = (form.get('intent') || '').toString()

  try {
    // Ensure ownership
    const existing = await prisma.student.findFirst({ where: { studentId, teacherId: uid } })
    if (!existing) {
      return c.redirect('/dashboard/student?error=' + encodeURIComponent('Student not found'))
    }

    if (intent === 'delete') {
      await prisma.student.delete({ where: { studentId } })
      return c.redirect('/dashboard/student?success=' + encodeURIComponent('Deleted'))
    }

    if (intent === 'update') {
      const name = (form.get('name') || '').toString().trim()
      const email = (form.get('email') || '').toString().trim()
      const phoneRaw = (form.get('phone') || '').toString().trim()
      const dobRaw = (form.get('dob') || '').toString()
      const departmentRaw = (form.get('department') || '').toString().trim()
      const currentSemesterRaw = (form.get('currentSemester') || '').toString()

      if (!name || !email || !dobRaw || !currentSemesterRaw) {
        return c.redirect(`/dashboard/student/${encodeURIComponent(studentId)}?error=${encodeURIComponent('Please fill all required fields')}`)
      }

      const dob = new Date(dobRaw)
      const currentSemester = Number(currentSemesterRaw)
      if (!Number.isInteger(currentSemester) || currentSemester < 1) {
        return c.redirect(`/dashboard/student/${encodeURIComponent(studentId)}?error=${encodeURIComponent('Invalid semester')}`)
      }

      const phone = phoneRaw || undefined
      const department = departmentRaw || undefined

      await prisma.student.update({
        where: { studentId },
        data: {
          name,
          email,
          phone,
          dob,
          department,
          currentSemester,
        },
      })
      return c.redirect(`/dashboard/student/${encodeURIComponent(studentId)}?success=1`)
    }

    return c.redirect(`/dashboard/student/${encodeURIComponent(studentId)}?error=${encodeURIComponent('Invalid action')}`)
  } catch (e: any) {
    const message = e?.code === 'P2002' ? 'Email already exists' : 'Operation failed'
    return c.redirect(`/dashboard/student/${encodeURIComponent(studentId)}?error=${encodeURIComponent(message)}`)
  }
})


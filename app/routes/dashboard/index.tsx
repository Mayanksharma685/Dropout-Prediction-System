import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'
import KPIs from '@/components/dashboard/KPIs'
import RiskTable from '@/components/dashboard/RiskTable'
import RecentActivity from '@/components/dashboard/RecentActivity'

export default createRoute(async (c) => {
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uid = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  // Aggregate minimal data for the dashboard
  const [studentCount, riskCount, backlogCount, unpaidCount] = await Promise.all([
    prisma.student.count(),
    prisma.riskFlag.count(),
    prisma.backlog.count({ where: { cleared: false } }),
    prisma.feePayment.count({ where: { status: 'Unpaid' } }),
  ])

  const recentRisk = await prisma.riskFlag.findMany({
    orderBy: { flagDate: 'desc' },
    take: 10,
    include: { student: true },
  })

  const rows = recentRisk.map((r) => ({
    studentId: r.studentId,
    name: r.student.name,
    riskLevel: r.riskLevel === 'high' || r.riskLevel === 'High' ? 'High' : r.riskLevel === 'medium' || r.riskLevel === 'Medium' ? 'Medium' : 'Low',
  }))

  const activities = recentRisk.map((r) => ({
    date: new Date(r.flagDate).toLocaleDateString(),
    message: `${r.student.name} flagged: ${r.riskLevel} — ${r.reason}`,
  }))

  // Fetch teacher info for header avatar/profile
  const teacher = await prisma.teacher.findUnique({ where: { teacherId: uid } })

  return c.render(
    <div class="min-h-screen bg-slate-50">
      <Header uid={uid} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
      <div class="">
        <div class="grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-6">
          <Sidebar />
          <main class="space-y-8 p-4">
            <section class="space-y-3">
              <h2 class="text-xl font-semibold text-slate-800">Overview</h2>
              <KPIs
                items={[
                  { label: 'Students', value: studentCount },
                  { label: 'Active Risk Flags', value: riskCount },
                  { label: 'Open Backlogs', value: backlogCount },
                  { label: 'Unpaid Fees', value: unpaidCount },
                ]}
              />
            </section>
            <section class="grid md:grid-cols-3 gap-6 items-start">
              <div class="md:col-span-2 space-y-3">
                <h3 class="text-sm font-semibold text-slate-700">Recent Risk Flags</h3>
                <RiskTable rows={rows} />
              </div>
              <div class="space-y-3">
                <h3 class="text-sm font-semibold text-slate-700">Latest Updates</h3>
                <RecentActivity items={activities} />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>,
  )
})



import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'
import KPIs from '@/components/dashboard/KPIs'
import RiskTable from '@/components/dashboard/RiskTable'
import RecentActivity from '@/components/dashboard/RecentActivity'

export default createRoute(async (c) => {
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  // Aggregate minimal data for the dashboard
  const [studentCount, riskCount, backlogCount, unpaidCount] = await Promise.all([
    prisma.student.count({ where: { teacherId: uid } }),
    prisma.riskFlag.count({ where: { student: { teacherId: uid } } }),
    prisma.backlog.count({ where: { cleared: false, student: { teacherId: uid } } }),
    prisma.feePayment.count({ where: { status: 'Unpaid', student: { teacherId: uid } } }),
  ])

  const recentRisk = await prisma.riskFlag.findMany({
    where: { student: { teacherId: uid } },
    orderBy: { flagDate: 'desc' },
    take: 10,
    include: { student: true },
  })

  // Stats for charts
  const [attendanceRows, testRows, feeRows, riskRows] = await Promise.all([
    prisma.attendance.findMany({
      where: { student: { teacherId: uid } },
      orderBy: { month: 'desc' },
      take: 500,
      select: { attendancePercent: true },
    }),
    prisma.testScore.findMany({
      where: { student: { teacherId: uid } },
      orderBy: { testDate: 'desc' },
      take: 500,
      select: { testDate: true, score: true },
    }),
    prisma.feePayment.findMany({
      where: { student: { teacherId: uid } },
      orderBy: { dueDate: 'desc' },
      take: 500,
      select: { status: true },
    }),
    prisma.riskFlag.findMany({
      where: { student: { teacherId: uid } },
      orderBy: { flagDate: 'desc' },
      take: 500,
      select: { riskLevel: true },
    }),
  ])

  const riskCounts = { High: 0, Medium: 0, Low: 0 }
  for (const r of riskRows) {
    const lvl = (r.riskLevel as string)?.toLowerCase()
    if (lvl === 'high') riskCounts.High++
    else if (lvl === 'medium') riskCounts.Medium++
    else riskCounts.Low++
  }

  const attBuckets = { '0-40': 0, '40-60': 0, '60-80': 0, '80-100': 0 }
  for (const a of attendanceRows) {
    const p = Number(a.attendancePercent || 0)
    if (p < 40) attBuckets['0-40']++
    else if (p < 60) attBuckets['40-60']++
    else if (p < 80) attBuckets['60-80']++
    else attBuckets['80-100']++
  }

  const monthKey = (d: Date) => `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}`
  const marksByMonth: Record<string, { sum: number; count: number }> = {}
  for (const t of testRows) {
    const k = monthKey(new Date(t.testDate as any))
    if (!marksByMonth[k]) marksByMonth[k] = { sum: 0, count: 0 }
    marksByMonth[k].sum += Number(t.score || 0)
    marksByMonth[k].count += 1
  }
  const sortedMonths = Object.keys(marksByMonth).sort()
  const lastMonths = sortedMonths.slice(-6)
  const marksLabels = lastMonths
  const marksValues = lastMonths.map((m) => {
    const v = marksByMonth[m]
    return v.count ? Number((v.sum / v.count).toFixed(1)) : 0
  })

  const feesCounts = { Paid: 0, Unpaid: 0 }
  for (const f of feeRows) {
    if ((f.status as any) === 'Paid') feesCounts.Paid++
    else feesCounts.Unpaid++
  }

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
                <h3 class="text-sm font-semibold text-slate-700">Students with Active Risk Flags</h3>
                <RiskTable rows={rows} />
              </div>
              <div class="space-y-3">
                <h3 class="text-sm font-semibold text-slate-700">Latest Updates</h3>
                <RecentActivity items={activities} />
              </div>
            </section>
            <section class="bg-white rounded-xl border shadow-sm p-4">
              <h3 class="text-sm font-semibold text-slate-700 mb-3">Statistics</h3>
              <div class="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 class="text-xs text-gray-600 mb-2">Risk Distribution</h4>
                  <div class="h-56"><canvas id="riskChart" class="w-full h-full"></canvas></div>
                </div>
                <div>
                  <h4 class="text-xs text-gray-600 mb-2">Attendance Buckets (%)</h4>
                  <div class="h-56"><canvas id="attendanceChart" class="w-full h-full"></canvas></div>
                </div>
                <div>
                  <h4 class="text-xs text-gray-600 mb-2">Average Marks by Month</h4>
                  <div class="h-56"><canvas id="marksChart" class="w-full h-full"></canvas></div>
                </div>
                <div>
                  <h4 class="text-xs text-gray-600 mb-2">Fees Status</h4>
                  <div class="h-56"><canvas id="feesChart" class="w-full h-full"></canvas></div>
                </div>
              </div>
            </section>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script dangerouslySetInnerHTML={{
              __html: `
const riskData = { labels: ['High','Medium','Low'], values: [${riskCounts.High}, ${riskCounts.Medium}, ${riskCounts.Low}] };
const attData = { labels: ['0-40','40-60','60-80','80-100'], values: [${attBuckets['0-40']}, ${attBuckets['40-60']}, ${attBuckets['60-80']}, ${attBuckets['80-100']}] };
const marksData = { labels: ${JSON.stringify(marksLabels)}, values: ${JSON.stringify(marksValues)} };
const feesData = { labels: ['Paid','Unpaid'], values: [${feesCounts.Paid}, ${feesCounts.Unpaid}] };

function makeBarChart(id, labels, data, color){
  const el = document.getElementById(id);
  if (!el) return;
  const ctx = el.getContext ? el.getContext('2d') : el;
  // @ts-ignore
  new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ data, backgroundColor: color }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision:0 } } } } });
}
function makePieChart(id, labels, data, colors){
  const el = document.getElementById(id);
  if (!el) return;
  const ctx = el.getContext ? el.getContext('2d') : el;
  // @ts-ignore
  new Chart(ctx, { type: 'doughnut', data: { labels, datasets: [{ data, backgroundColor: colors }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } });
}

function initCharts(){
  try {
    // @ts-ignore
    if (typeof Chart === 'undefined') { setTimeout(initCharts, 50); return; }
    makePieChart('riskChart', riskData.labels, riskData.values, ['#ef4444','#f59e0b','#10b981']);
    makeBarChart('attendanceChart', attData.labels, attData.values, '#6366f1');
    makeBarChart('marksChart', marksData.labels, marksData.values, '#22c55e');
    makePieChart('feesChart', feesData.labels, feesData.values, ['#10b981','#ef4444']);
  } catch (e) { console.error(e); }
}

if (document.readyState === 'complete') initCharts();
else window.addEventListener('load', initCharts);
`
            }} />
          </main>
        </div>
      </div>
    </div>,
  )
})



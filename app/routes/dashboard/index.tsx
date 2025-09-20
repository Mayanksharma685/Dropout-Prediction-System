import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'
import AIAssistant from '@/components/dashboard/AIAssistant'
import KPIs from '@/components/dashboard/KPIs'
import RecentStudentActivity from '@/components/dashboard/RecentStudentActivity'
import CalendarMonths from '@/components/dashboard/CalendarMonths'

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

  // Generate recent student activities from various data sources
  const recentActivities = []
  
  // Add recent test scores as achievements
  const recentTests = await prisma.testScore.findMany({
    where: { student: { teacherId: uid } },
    orderBy: { testDate: 'desc' },
    take: 5,
    include: { student: true }
  })
  
  for (const test of recentTests) {
    const score = Number(test.score || 0)
    recentActivities.push({
      id: `test-${test.testId}`,
      studentName: test.student.name,
      activity: `Scored ${score}% in test`,
      type: score >= 85 ? 'achievement' : 'test',
      value: `${score}%`,
      timestamp: new Date(test.testDate).toLocaleDateString(),
      priority: score >= 85 ? 'low' : score >= 60 ? 'medium' : 'high'
    })
  }
  
  // Add recent attendance updates
  const recentAttendance = await prisma.attendance.findMany({
    where: { student: { teacherId: uid } },
    orderBy: { month: 'desc' },
    take: 5,
    include: { student: true }
  })
  
  for (const att of recentAttendance) {
    const percentage = Number(att.attendancePercent || 0)
    recentActivities.push({
      id: `att-${att.attendanceId}`,
      studentName: att.student.name,
      activity: `Attendance updated for ${att.month}`,
      type: 'attendance',
      value: `${percentage}%`,
      timestamp: new Date().toLocaleDateString(),
      priority: percentage >= 75 ? 'low' : percentage >= 60 ? 'medium' : 'high'
    })
  }
  
  // Add recent fee payments
  const recentFees = await prisma.feePayment.findMany({
    where: { student: { teacherId: uid }, status: 'Paid' },
    orderBy: { dueDate: 'desc' },
    take: 3,
    include: { student: true }
  })
  
  for (const fee of recentFees) {
    recentActivities.push({
      id: `fee-${fee.feeId}`,
      studentName: fee.student.name,
      activity: `Fee payment completed`,
      type: 'achievement',
      value: `₹${fee.amount}`,
      timestamp: new Date(fee.dueDate).toLocaleDateString(),
      priority: 'low'
    })
  }
  
  // Add risk flags as high priority items
  for (const risk of recentRisk.slice(0, 3)) {
    recentActivities.push({
      id: `risk-${risk.flagId}`,
      studentName: risk.student.name,
      activity: `Risk flag: ${risk.reason}`,
      type: 'risk',
      value: risk.riskLevel,
      timestamp: new Date(risk.flagDate).toLocaleDateString(),
      priority: 'high'
    })
  }
  
  // Sort by priority and date, take top 10
  const sortedActivities = recentActivities
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder]
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder]
      if (aPriority !== bPriority) return bPriority - aPriority
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
    .slice(0, 10)

  // Fetch teacher info for header avatar/profile
  const teacher = await prisma.teacher.findUnique({ where: { teacherId: uid } })

  return c.render(
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Subtle background pattern */}
      <div class="absolute inset-0 opacity-[0.02]">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0); background-size: 20px 20px;"></div>
      </div>

      <div class="relative">
        <div class="grid grid-cols-1 md:grid-cols-[16rem_1fr]">
          <Sidebar currentPath={new URL(c.req.url).pathname} />
          <div>
            <Header uid={uid} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
            <main class="space-y-8 p-4">

              <section class="space-y-6">

                {/* Enhanced KPI Cards */}
                <KPIs
                  items={[
                    { 
                      label: 'Total Students', 
                      value: studentCount,
                      icon: 'students',
                      color: 'blue',
                      trend: 'stable',
                      trendValue: 'This semester'
                    },
                    { 
                      label: 'Active Risk Flags', 
                      value: riskCount,
                      icon: 'risk',
                      color: riskCount > 0 ? 'red' : 'green',
                      trend: riskCount > 5 ? 'up' : riskCount > 0 ? 'stable' : 'down',
                      trendValue: riskCount > 5 ? 'High attention needed' : riskCount > 0 ? 'Monitor closely' : 'All clear'
                    },
                    { 
                      label: 'Open Backlogs', 
                      value: backlogCount,
                      icon: 'backlog',
                      color: backlogCount > 10 ? 'red' : backlogCount > 5 ? 'yellow' : 'green',
                      trend: backlogCount > 10 ? 'up' : 'stable',
                      trendValue: backlogCount > 10 ? 'Needs attention' : 'Under control'
                    },
                    { 
                      label: 'Unpaid Fees', 
                      value: unpaidCount,
                      icon: 'fees',
                      color: unpaidCount > 5 ? 'red' : unpaidCount > 0 ? 'yellow' : 'green',
                      trend: unpaidCount > 5 ? 'up' : 'stable',
                      trendValue: unpaidCount > 5 ? 'Follow up required' : 'On track'
                    },
                  ]}
                />

                {/* Quick Stats Section */}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm text-gray-600">Average Attendance</p>
                        <p class="text-2xl font-bold text-green-600">
                          {attendanceRows.length > 0 ? 
                            Math.round(attendanceRows.reduce((sum, a) => sum + Number(a.attendancePercent || 0), 0) / attendanceRows.length) 
                            : 0}%
                        </p>
                      </div>
                      <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div class="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm text-gray-600">Average Test Score</p>
                        <p class="text-2xl font-bold text-blue-600">
                          {testRows.length > 0 ? 
                            Math.round(testRows.reduce((sum, t) => sum + Number(t.score || 0), 0) / testRows.length) 
                            : 0}/100
                        </p>
                      </div>
                      <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div class="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm text-gray-600">Fee Collection Rate</p>
                        <p class="text-2xl font-bold text-purple-600">
                          {feeRows.length > 0 ? 
                            Math.round((feesCounts.Paid / (feesCounts.Paid + feesCounts.Unpaid)) * 100) 
                            : 0}%
                        </p>
                      </div>
                      <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <section class="grid md:grid-cols-3 gap-6 items-start">
                <div class="md:col-span-2">
                  <RecentStudentActivity activities={sortedActivities} />
                </div>
                <div class="space-y-3">
                  <h3 class="text-sm font-semibold text-slate-700">Calendar</h3>
                  <CalendarMonths />
                </div>
              </section>
              <section class="bg-white rounded-xl border shadow-sm p-4">
                <h3 class="text-sm font-semibold text-slate-700 mb-3">Statistics</h3>
                <div class="grid md:grid-cols-2 gap-6">
                  {/* Attendance first */}
                  <div>
                    <h4 class="text-xs text-gray-600 mb-2">Attendance Buckets (%)</h4>
                    <div class="h-56"><canvas id="attendanceChart" class="w-full h-full"></canvas></div>
                  </div>
                  {/* Risk second */}
                  <div>
                    <h4 class="text-xs text-gray-600 mb-2">Risk Distribution</h4>
                    <div class="h-56"><canvas id="riskChart" class="w-full h-full"></canvas></div>
                  </div>
                  {/* Other charts remain same */}
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


              <AIAssistant />
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
              {/* AI Assistant behavior is encapsulated inside the component */}
            </main>
          </div>
        </div>
      </div>
    </div>,
  )
})



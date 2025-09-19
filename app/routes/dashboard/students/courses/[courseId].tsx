import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'

export default createRoute(async (c) => {
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const teacher = await prisma.teacher.findUnique({ where: { teacherId: uid } })

  // Get courseId from URL params
  const courseId = c.req.param('courseId')
  if (!courseId) {
    return c.redirect('/dashboard/students/courses')
  }

  // Fetch course details
  const course = await prisma.courseSubject.findUnique({
    where: { courseId: decodeURIComponent(courseId) }
  })

  if (!course) {
    return c.redirect('/dashboard/students/courses?error=Course not found')
  }

  return c.render(
    <div class="min-h-screen bg-slate-50">
      <div class="grid grid-cols-1 md:grid-cols-[16rem_1fr]">
        <Sidebar currentPath={new URL(c.req.url).pathname} />
        <div>
          <Header uid={uid} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
          <main class="space-y-8 p-4">
            {/* Breadcrumb Navigation */}
            <nav class="flex items-center space-x-2 text-sm text-gray-600">
              <a href="/dashboard/students/courses" class="hover:text-orange-600 transition-colors">Courses</a>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
              <span class="text-slate-800 font-medium">{course.name}</span>
            </nav>

            {/* Course Header */}
            <section class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border p-6">
              <div class="flex justify-between items-start">
                <div>
                  <h1 class="text-2xl font-bold text-slate-800 mb-2">{course.name}</h1>
                  <div class="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p class="text-gray-600">Course ID</p>
                      <p class="font-semibold text-slate-800">{course.courseId}</p>
                    </div>
                    <div>
                      <p class="text-gray-600">Course Code</p>
                      <p class="font-semibold text-slate-800">{course.code}</p>
                    </div>
                    <div>
                      <p class="text-gray-600">Semester</p>
                      <p class="font-semibold text-slate-800">Semester {course.semester}</p>
                    </div>
                    <div>
                      <p class="text-gray-600">Department</p>
                      <p class="font-semibold text-slate-800">{course.department}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onclick="refreshData()" 
                  class="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>
            </section>

            {/* Loading State */}
            <div id="loading-state" class="text-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p class="text-gray-600 mt-4">Loading detailed course analytics...</p>
            </div>

            {/* Error State */}
            <div id="error-state" class="hidden bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <div class="text-red-500 mb-4">
                <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-red-800 mb-2">Failed to Load Data</h3>
              <p class="text-red-600 mb-4" id="error-message">Unable to fetch course details</p>
              <button onclick="refreshData()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
                Try Again
              </button>
            </div>

            {/* Main Content */}
            <div id="main-content" class="hidden space-y-8">
              {/* Summary Cards */}
              <div id="summary-cards" class="grid md:grid-cols-4 gap-6">
                {/* Cards will be populated by JavaScript */}
              </div>

              {/* Charts Section */}
              <div class="grid md:grid-cols-2 gap-6">
                <div class="bg-white rounded-xl border shadow-sm p-6">
                  <h3 class="text-lg font-semibold text-slate-800 mb-4">Attendance Distribution</h3>
                  <div class="relative h-64">
                    <canvas id="attendanceChart"></canvas>
                  </div>
                </div>
                <div class="bg-white rounded-xl border shadow-sm p-6">
                  <h3 class="text-lg font-semibold text-slate-800 mb-4">Test Score Distribution</h3>
                  <div class="relative h-64">
                    <canvas id="testScoreChart"></canvas>
                  </div>
                </div>
              </div>

              {/* Trends Section */}
              <div class="bg-white rounded-xl border shadow-sm p-6">
                <h3 class="text-lg font-semibold text-slate-800 mb-4">Monthly Trends</h3>
                <div class="relative h-80">
                  <canvas id="trendsChart"></canvas>
                </div>
              </div>

              {/* Students Table */}
              <div class="bg-white rounded-xl border shadow-sm p-6">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-lg font-semibold text-slate-800">Students Enrolled</h3>
                  <div class="flex items-center space-x-2">
                    <input 
                      type="text" 
                      id="student-search" 
                      placeholder="Search students..." 
                      class="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      onkeyup="filterStudents()"
                    />
                    <select id="performance-filter" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" onchange="filterStudents()">
                      <option value="">All Performance</option>
                      <option value="excellent">Excellent (90%+)</option>
                      <option value="good">Good (75-89%)</option>
                      <option value="average">Average (60-74%)</option>
                      <option value="poor">Poor (&lt;60%)</option>
                    </select>
                  </div>
                </div>
                <div id="students-table" class="overflow-x-auto">
                  {/* Table will be populated by JavaScript */}
                </div>
              </div>

              {/* Recent Activity */}
              <div class="bg-white rounded-xl border shadow-sm p-6">
                <h3 class="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
                <div id="recent-activity" class="space-y-4">
                  {/* Activity will be populated by JavaScript */}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Chart.js CDN */}
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      
      <script dangerouslySetInnerHTML={{
        __html: `
const courseId = '${course.courseId}';
let courseData = null;
let attendanceChart = null;
let testScoreChart = null;
let trendsChart = null;

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
  loadCourseDetails();
});

async function loadCourseDetails() {
  try {
    showLoading();
    const response = await fetch('/api/course-details?courseId=' + encodeURIComponent(courseId));
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    courseData = data;
    renderCourseDetails(data);
    hideLoading();
  } catch (error) {
    console.error('Error loading course details:', error);
    showError(error.message);
  }
}

function showLoading() {
  document.getElementById('loading-state').classList.remove('hidden');
  document.getElementById('error-state').classList.add('hidden');
  document.getElementById('main-content').classList.add('hidden');
}

function hideLoading() {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('error-state').classList.add('hidden');
  document.getElementById('main-content').classList.remove('hidden');
}

function showError(message) {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('main-content').classList.add('hidden');
  document.getElementById('error-state').classList.remove('hidden');
  document.getElementById('error-message').textContent = message;
}

function refreshData() {
  loadCourseDetails();
}

function renderCourseDetails(data) {
  renderSummaryCards(data);
  renderCharts(data);
  renderStudentsTable(data);
  renderRecentActivity(data);
}

function renderSummaryCards(data) {
  const container = document.getElementById('summary-cards');
  container.innerHTML = \`
    <div class="bg-green-50 border border-green-200 rounded-xl p-6">
      <div class="flex items-center">
        <div class="bg-green-100 rounded-full p-3 mr-4">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
        <div>
          <p class="text-3xl font-bold text-green-700">\${data.enrollment.totalStudents}</p>
          <p class="text-sm text-green-600">Total Students</p>
        </div>
      </div>
    </div>
    
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <div class="flex items-center">
        <div class="bg-blue-100 rounded-full p-3 mr-4">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div>
          <p class="text-3xl font-bold text-blue-700">\${Math.round(data.attendance.average)}%</p>
          <p class="text-sm text-blue-600">Average Attendance</p>
        </div>
      </div>
    </div>
    
    <div class="bg-purple-50 border border-purple-200 rounded-xl p-6">
      <div class="flex items-center">
        <div class="bg-purple-100 rounded-full p-3 mr-4">
          <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
        <div>
          <p class="text-3xl font-bold text-purple-700">\${Math.round(data.testScores.average)}</p>
          <p class="text-sm text-purple-600">Average Test Score</p>
        </div>
      </div>
    </div>
    
    <div class="bg-red-50 border border-red-200 rounded-xl p-6">
      <div class="flex items-center">
        <div class="bg-red-100 rounded-full p-3 mr-4">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div>
          <p class="text-3xl font-bold text-red-700">\${data.backlogs.pending}</p>
          <p class="text-sm text-red-600">Pending Backlogs</p>
        </div>
      </div>
    </div>
  \`;
}

function renderCharts(data) {
  // Attendance Distribution Chart
  const attendanceCtx = document.getElementById('attendanceChart').getContext('2d');
  if (attendanceChart) attendanceChart.destroy();
  
  attendanceChart = new Chart(attendanceCtx, {
    type: 'doughnut',
    data: {
      labels: data.attendance.distribution.map(item => item.range),
      datasets: [{
        data: data.attendance.distribution.map(item => item.count),
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });

  // Test Score Distribution Chart
  const testScoreCtx = document.getElementById('testScoreChart').getContext('2d');
  if (testScoreChart) testScoreChart.destroy();
  
  testScoreChart = new Chart(testScoreCtx, {
    type: 'bar',
    data: {
      labels: data.testScores.distribution.map(item => item.grade),
      datasets: [{
        label: 'Number of Students',
        data: data.testScores.distribution.map(item => item.count),
        backgroundColor: '#8B5CF6',
        borderColor: '#7C3AED',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });

  // Monthly Trends Chart
  const trendsCtx = document.getElementById('trendsChart').getContext('2d');
  if (trendsChart) trendsChart.destroy();
  
  trendsChart = new Chart(trendsCtx, {
    type: 'line',
    data: {
      labels: data.monthlyTrends.map(item => new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })),
      datasets: [
        {
          label: 'Average Attendance (%)',
          data: data.monthlyTrends.map(item => item.avgAttendance),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: 'Average Test Score',
          data: data.monthlyTrends.map(item => item.avgTestScore),
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function renderStudentsTable(data) {
  const container = document.getElementById('students-table');
  
  if (!data.students || data.students.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-8">No students enrolled in this course</p>';
    return;
  }
  
  container.innerHTML = \`
    <table class="w-full">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Score</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Backlogs</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200" id="students-tbody">
        \${data.students.map(student => \`
          <tr class="student-row" data-student-name="\${student.name.toLowerCase()}" data-performance="\${getPerformanceCategory(student.attendancePercent)}">
            <td class="px-4 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span class="text-sm font-medium text-gray-700">\${student.name.charAt(0)}</span>
                  </div>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900">\${student.name}</div>
                  <div class="text-sm text-gray-500">\${student.email || 'No email'}</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">\${student.studentId}</td>
            <td class="px-4 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                  <div class="bg-\${getAttendanceColor(student.attendancePercent)} h-2 rounded-full" style="width: \${student.attendancePercent}%"></div>
                </div>
                <span class="text-sm text-gray-900">\${Math.round(student.attendancePercent)}%</span>
              </div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">\${student.avgTestScore || 'N/A'}</td>
            <td class="px-4 py-4 whitespace-nowrap">
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full \${student.backlogCount > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                \${student.backlogCount || 0} backlogs
              </span>
            </td>
            <td class="px-4 py-4 whitespace-nowrap">
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full \${getStatusColor(student.attendancePercent)}">
                \${getStatusText(student.attendancePercent)}
              </span>
            </td>
          </tr>
        \`).join('')}
      </tbody>
    </table>
  \`;
}

function renderRecentActivity(data) {
  const container = document.getElementById('recent-activity');
  
  const activities = [
    ...data.recentActivity.attendance.map(item => ({
      type: 'attendance',
      student: item.student.name,
      value: item.attendancePercent + '%',
      date: item.month,
      icon: 'check-circle'
    })),
    ...data.recentActivity.testScores.map(item => ({
      type: 'test',
      student: item.student.name,
      value: item.score,
      date: item.testDate,
      icon: 'academic-cap'
    })),
    ...data.recentActivity.backlogs.map(item => ({
      type: 'backlog',
      student: item.student.name,
      value: item.cleared ? 'Cleared' : 'Pending',
      date: new Date().toISOString(), // Use current date since backlog doesn't have createdAt
      icon: 'exclamation-triangle'
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  
  if (activities.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-4">No recent activity</p>';
    return;
  }
  
  container.innerHTML = activities.map(activity => \`
    <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <div class="flex-shrink-0">
        <div class="w-8 h-8 bg-\${getActivityColor(activity.type)} rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            \${getActivityIcon(activity.icon)}
          </svg>
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900">\${activity.student}</p>
        <p class="text-sm text-gray-500">\${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}: \${activity.value}</p>
      </div>
      <div class="flex-shrink-0 text-sm text-gray-500">
        \${new Date(activity.date).toLocaleDateString()}
      </div>
    </div>
  \`).join('');
}

function filterStudents() {
  const searchTerm = document.getElementById('student-search').value.toLowerCase();
  const performanceFilter = document.getElementById('performance-filter').value;
  const rows = document.querySelectorAll('.student-row');
  
  rows.forEach(row => {
    const studentName = row.getAttribute('data-student-name');
    const performance = row.getAttribute('data-performance');
    
    const matchesSearch = studentName.includes(searchTerm);
    const matchesPerformance = !performanceFilter || performance === performanceFilter;
    
    if (matchesSearch && matchesPerformance) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// Helper functions
function getPerformanceCategory(attendance) {
  if (attendance >= 90) return 'excellent';
  if (attendance >= 75) return 'good';
  if (attendance >= 60) return 'average';
  return 'poor';
}

function getAttendanceColor(attendance) {
  if (attendance >= 90) return 'green-500';
  if (attendance >= 75) return 'blue-500';
  if (attendance >= 60) return 'yellow-500';
  return 'red-500';
}

function getStatusColor(attendance) {
  if (attendance >= 90) return 'bg-green-100 text-green-800';
  if (attendance >= 75) return 'bg-blue-100 text-blue-800';
  if (attendance >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function getStatusText(attendance) {
  if (attendance >= 90) return 'Excellent';
  if (attendance >= 75) return 'Good';
  if (attendance >= 60) return 'Average';
  return 'Poor';
}

function getActivityColor(type) {
  switch (type) {
    case 'attendance': return 'blue-500';
    case 'test': return 'purple-500';
    case 'backlog': return 'red-500';
    default: return 'gray-500';
  }
}

function getActivityIcon(icon) {
  switch (icon) {
    case 'check-circle':
      return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
    case 'academic-cap':
      return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>';
    case 'exclamation-triangle':
      return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
    default:
      return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
  }
}
`
      }} />
    </div>
  )
})

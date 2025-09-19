import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'

export default createRoute(async (c) => {
  // Get teacher ID from cookies for authentication
  const teacherIdRaw = c.req.header('Cookie')?.match(/uid=([^;]+)/)?.[1]
  
  if (!teacherIdRaw) {
    return c.redirect('/login')
  }

  const teacherId = decodeURIComponent(teacherIdRaw)

  // Fetch teacher info for header
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const teacher = await prisma.teacher.findUnique({ where: { teacherId } })

  return c.render(
    <html>
      <head>
        <title>Mentee Attendance Analytics - EduPulse</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>{`
          .loading-spinner {
            border: 4px solid #f3f4f6;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .stat-card {
            transition: all 0.3s ease;
          }
          
          .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }
          
          .progress-bar {
            transition: width 0.8s ease-in-out;
          }
          
          .fade-in {
            animation: fadeIn 0.5s ease-in;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </head>
      <body>
        <div class="flex h-screen bg-gray-100">
          <Sidebar currentPath="/dashboard/mentees/attendance" />
          <div class="flex-1 flex flex-col overflow-hidden">
            <Header uid={teacherId} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
            <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                  <div>
                    <h1 class="text-2xl font-bold text-gray-900">Mentee Attendance Analytics</h1>
                    <p class="text-gray-600 mt-1">Comprehensive attendance tracking and analytics for your mentees</p>
                  </div>
                  <div class="flex gap-3">
                    <button 
                      id="refreshBtn"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <span>🔄</span>
                      Refresh Data
                    </button>
                    <select 
                      id="studentFilter"
                      class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Students</option>
                    </select>
                  </div>
                </div>

                {/* Loading State */}
                <div id="loadingState" class="flex justify-center items-center py-12">
                  <div class="loading-spinner"></div>
                  <span class="ml-3 text-gray-600">Loading attendance analytics...</span>
                </div>

                {/* Main Content */}
                <div id="mainContent" class="hidden">
                  {/* Summary Cards */}
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="stat-card bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Total Students</p>
                          <p id="totalStudents" class="text-2xl font-bold text-gray-900">-</p>
                        </div>
                        <div class="p-3 bg-blue-100 rounded-full">
                          <span class="text-blue-600 text-xl">👥</span>
                        </div>
                      </div>
                    </div>

                    <div class="stat-card bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Average Attendance</p>
                          <p id="averageAttendance" class="text-2xl font-bold text-gray-900">-</p>
                        </div>
                        <div class="p-3 bg-green-100 rounded-full">
                          <span class="text-green-600 text-xl">📊</span>
                        </div>
                      </div>
                    </div>

                    <div class="stat-card bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Total Records</p>
                          <p id="totalRecords" class="text-2xl font-bold text-gray-900">-</p>
                        </div>
                        <div class="p-3 bg-purple-100 rounded-full">
                          <span class="text-purple-600 text-xl">📋</span>
                        </div>
                      </div>
                    </div>

                    <div class="stat-card bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Active Courses</p>
                          <p id="totalCourses" class="text-2xl font-bold text-gray-900">-</p>
                        </div>
                        <div class="p-3 bg-orange-100 rounded-full">
                          <span class="text-orange-600 text-xl">📚</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Attendance Distribution */}
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Attendance Distribution</h3>
                      <div class="relative h-64">
                        <canvas id="attendanceDistributionChart"></canvas>
                      </div>
                    </div>

                    {/* Monthly Trends */}
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Monthly Attendance Trends</h3>
                      <div class="relative h-64">
                        <canvas id="monthlyTrendsChart"></canvas>
                      </div>
                    </div>
                  </div>

                  {/* Student Performance Table */}
                  <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                    <div class="p-6 border-b border-gray-200">
                      <h3 class="text-lg font-semibold text-gray-900">Student Performance Overview</h3>
                      <p class="text-gray-600 mt-1">Detailed attendance statistics for each student</p>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                          <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Attendance</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody id="studentTableBody" class="bg-white divide-y divide-gray-200">
                          {/* Dynamic content will be inserted here */}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Course Performance */}
                  <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                    <div class="p-6 border-b border-gray-200">
                      <h3 class="text-lg font-semibold text-gray-900">Course-wise Performance</h3>
                      <p class="text-gray-600 mt-1">Attendance statistics grouped by courses</p>
                    </div>
                    <div class="p-6">
                      <div id="courseStatsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Dynamic course cards will be inserted here */}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div class="p-6">
                      <div id="recentActivityContainer" class="space-y-4">
                        {/* Dynamic activity items will be inserted here */}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error State */}
                <div id="errorState" class="hidden bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <div class="text-red-400 text-4xl mb-4">⚠️</div>
                  <h3 class="text-lg font-medium text-red-900 mb-2">Error Loading Data</h3>
                  <p id="errorMessage" class="text-red-600 mb-4"></p>
                  <button 
                    onclick="loadAttendanceData()"
                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{__html: `
          let attendanceData = null;
          let charts = {};
          const teacherId = '${teacherId}';`}}>
        </script>
        <script dangerouslySetInnerHTML={{__html: `

          // Load attendance data
          async function loadAttendanceData(studentId = '') {
            try {
              document.getElementById('loadingState').classList.remove('hidden');
              document.getElementById('mainContent').classList.add('hidden');
              document.getElementById('errorState').classList.add('hidden');

              const params = new URLSearchParams({ teacherId });
              if (studentId) params.append('studentId', studentId);

              const response = await fetch('/api/attendance-analytics?' + params);
              if (!response.ok) throw new Error('Failed to fetch data');

              attendanceData = await response.json();
              renderDashboard();
              
              document.getElementById('loadingState').classList.add('hidden');
              document.getElementById('mainContent').classList.remove('hidden');
            } catch (error) {
              console.error('Error loading attendance data:', error);
              document.getElementById('loadingState').classList.add('hidden');
              document.getElementById('errorState').classList.remove('hidden');
              document.getElementById('errorMessage').textContent = error.message;
            }
          }

          // Render dashboard with data
          function renderDashboard() {
            if (!attendanceData) return;

            // Update summary cards
            document.getElementById('totalStudents').textContent = attendanceData.summary.totalStudents;
            document.getElementById('averageAttendance').textContent = attendanceData.summary.averageAttendance + '%';
            document.getElementById('totalRecords').textContent = attendanceData.summary.totalRecords.toLocaleString();
            document.getElementById('totalCourses').textContent = attendanceData.summary.totalCourses;

            // Populate student filter
            populateStudentFilter();

            // Render charts
            renderAttendanceDistributionChart();
            renderMonthlyTrendsChart();

            // Render tables and lists
            renderStudentTable();
            renderCourseStats();
            renderRecentActivity();
          }

          // Populate student filter dropdown
          function populateStudentFilter() {
            const select = document.getElementById('studentFilter');
            select.innerHTML = '<option value="">All Students</option>';
            
            attendanceData.studentStats.forEach(student => {
              const option = document.createElement('option');
              option.value = student.student.studentId;
              option.textContent = student.student.name + ' (' + student.student.studentId + ')';
              select.appendChild(option);
            });
          }

          // Render attendance distribution chart
          function renderAttendanceDistributionChart() {
            const ctx = document.getElementById('attendanceDistributionChart').getContext('2d');
            
            if (charts.distribution) charts.distribution.destroy();
            
            charts.distribution = new Chart(ctx, {
              type: 'doughnut',
              data: {
                labels: ['Excellent (90%+)', 'Good (75-89%)', 'Average (60-74%)', 'Poor (<60%)'],
                datasets: [{
                  data: [
                    attendanceData.attendanceDistribution.excellent,
                    attendanceData.attendanceDistribution.good,
                    attendanceData.attendanceDistribution.average,
                    attendanceData.attendanceDistribution.poor
                  ],
                  backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                  borderWidth: 2,
                  borderColor: '#ffffff'
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
          }

          // Render monthly trends chart
          function renderMonthlyTrendsChart() {
            const ctx = document.getElementById('monthlyTrendsChart').getContext('2d');
            
            if (charts.trends) charts.trends.destroy();
            
            const monthlyData = attendanceData.monthlyTrends.reverse();
            
            charts.trends = new Chart(ctx, {
              type: 'line',
              data: {
                labels: monthlyData.map(item => {
                  const date = new Date(item.month + '-01');
                  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }),
                datasets: [{
                  label: 'Average Attendance %',
                  data: monthlyData.map(item => item.averageAttendance),
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      }
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }
            });
          }

          // Render student table
          function renderStudentTable() {
            const tbody = document.getElementById('studentTableBody');
            tbody.innerHTML = '';

            attendanceData.studentStats.forEach(student => {
              const row = document.createElement('tr');
              row.className = 'hover:bg-gray-50 fade-in';
              
              const statusClass = student.averageAttendance >= 75 ? 'bg-green-100 text-green-800' :
                                student.averageAttendance >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800';
              
              const statusText = student.averageAttendance >= 75 ? 'Good' :
                               student.averageAttendance >= 60 ? 'Average' : 'Poor';

              row.innerHTML = \`
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-700">\${student.student.name.charAt(0)}</span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">\${student.student.name}</div>
                      <div class="text-sm text-gray-500">\${student.student.studentId}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${student.student.department || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div class="progress-bar bg-blue-600 h-2 rounded-full" style="width: \${student.averageAttendance}%"></div>
                    </div>
                    <span class="text-sm font-medium text-gray-900">\${student.averageAttendance}%</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${student.totalCourses}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${student.totalRecords}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${statusClass}">
                    \${statusText}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onclick="viewStudentDetails('\${student.student.studentId}')"
                    class="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    View Details
                  </button>
                </td>
              \`;
              
              tbody.appendChild(row);
            });
          }

          // Render course statistics
          function renderCourseStats() {
            const container = document.getElementById('courseStatsContainer');
            container.innerHTML = '';

            attendanceData.courseStats.forEach(course => {
              const card = document.createElement('div');
              card.className = 'bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow';
              
              const statusColor = course.averageAttendance >= 75 ? 'text-green-600' :
                                course.averageAttendance >= 60 ? 'text-yellow-600' : 'text-red-600';

              card.innerHTML = \`
                <div class="flex justify-between items-start mb-2">
                  <h4 class="font-medium text-gray-900 text-sm">\${course.course.name}</h4>
                  <span class="text-xs text-gray-500">\${course.course.code}</span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Avg Attendance:</span>
                    <span class="font-medium \${statusColor}">\${course.averageAttendance}%</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Students:</span>
                    <span class="font-medium text-gray-900">\${course.studentCount}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Records:</span>
                    <span class="font-medium text-gray-900">\${course.recordCount}</span>
                  </div>
                </div>
              \`;
              
              container.appendChild(card);
            });
          }

          // Render recent activity
          function renderRecentActivity() {
            const container = document.getElementById('recentActivityContainer');
            container.innerHTML = '';

            attendanceData.recentActivity.forEach(activity => {
              const item = document.createElement('div');
              item.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200';
              
              const statusColor = activity.status === 'good' ? 'text-green-600' :
                                activity.status === 'average' ? 'text-yellow-600' : 'text-red-600';
              
              const statusIcon = activity.status === 'good' ? '✅' :
                               activity.status === 'average' ? '⚠️' : '❌';

              item.innerHTML = \`
                <div class="flex items-center space-x-4">
                  <span class="text-lg">\${statusIcon}</span>
                  <div>
                    <div class="font-medium text-gray-900">\${activity.studentName}</div>
                    <div class="text-sm text-gray-600">\${activity.courseName} (\${activity.courseCode})</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-medium \${statusColor}">\${activity.attendance}%</div>
                  <div class="text-sm text-gray-500">\${new Date(activity.month).toLocaleDateString()}</div>
                </div>
              \`;
              
              container.appendChild(item);
            });
          }

          // View student details
          function viewStudentDetails(studentId) {
            // Redirect to student details page or show modal
            window.location.href = \`/dashboard/mentees/student-details?studentId=\${studentId}\`;
          }

          // Event listeners
          document.getElementById('refreshBtn').addEventListener('click', () => {
            loadAttendanceData(document.getElementById('studentFilter').value);
          });

          document.getElementById('studentFilter').addEventListener('change', (e) => {
            loadAttendanceData(e.target.value);
          });

          // Initial load
          document.addEventListener('DOMContentLoaded', () => {
            loadAttendanceData();
          });
        `}}>
        </script>
      </body>
    </html>
  )
})

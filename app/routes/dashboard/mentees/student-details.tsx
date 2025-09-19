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

  // Get student ID from query parameters
  const url = new URL(c.req.url)
  const studentId = url.searchParams.get('studentId')

  // Fetch teacher info for header
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const teacher = await prisma.teacher.findUnique({ where: { teacherId } })

  // Determine if this is individual student view or overview
  const isIndividualView = !!studentId
  
  return c.render(
    <html>
      <head>
        <title>{isIndividualView ? `Student ${studentId} - EduPulse` : 'Students Overview - EduPulse'}</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>{
          `.loading-spinner {
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
          .fade-in {
            animation: fadeIn 0.5s ease-in;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .tab-button {
            border-bottom: 2px solid transparent;
            color: #6b7280;
            transition: all 0.2s;
          }
          .active-tab {
            border-bottom-color: #3b82f6;
            color: #3b82f6;
          }
          .inactive-tab {
            border-bottom-color: transparent;
            color: #6b7280;
          }
          .tab-button:hover {
            color: #3b82f6;
          }`
        }</style>
      </head>
      <body>
        <div class="flex h-screen bg-gray-100">
          <Sidebar currentPath="/dashboard/mentees/student-details" />
          <div class="flex-1 flex flex-col overflow-hidden">
            <Header uid={teacherId} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
            <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                  <div>
                    <h1 class="text-2xl font-bold text-gray-900">{isIndividualView ? `Student Details - ${studentId}` : 'Students Overview'}</h1>
                    <p class="text-gray-600 mt-1">{isIndividualView ? 'Comprehensive profile and academic performance details' : 'Comprehensive analytics and performance insights for all your mentees'}</p>
                  </div>
                  <div class="flex gap-3">
                    <button 
                      onclick="history.back()"
                      class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <span>←</span>
                      Back
                    </button>
                    <button 
                      id="refreshBtn"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <span>🔄</span>
                      Refresh Data
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                <div id="loadingState" class="flex justify-center items-center py-12">
                  <div class="loading-spinner"></div>
                  <span class="ml-3 text-gray-600">Loading analytics data...</span>
                </div>

                {/* Main Content */}
                <div id="mainContent" class="hidden space-y-6">
                  {/* Summary Cards */}
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">High Risk Students</p>
                          <p id="highRiskStudents" class="text-2xl font-bold text-red-600">-</p>
                        </div>
                        <div class="p-3 bg-red-100 rounded-full">
                          <span class="text-red-600 text-xl">⚠️</span>
                        </div>
                      </div>
                    </div>

                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Active Courses</p>
                          <p id="totalCourses" class="text-2xl font-bold text-gray-900">-</p>
                        </div>
                        <div class="p-3 bg-purple-100 rounded-full">
                          <span class="text-purple-600 text-xl">📚</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                  {/* Performance Analytics */}
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Test Score Distribution */}
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Test Score Distribution</h3>
                      <div class="relative h-64">
                        <canvas id="testScoreChart"></canvas>
                      </div>
                    </div>

                    {/* Risk Level Analysis */}
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Risk Level Analysis</h3>
                      <div class="relative h-64">
                        <canvas id="riskLevelChart"></canvas>
                      </div>
                    </div>
                  </div>

                  {/* Student Performance Table */}
                  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div class="p-6 border-b border-gray-200">
                      <h3 class="text-lg font-semibold text-gray-900">Student Performance Overview</h3>
                      <p class="text-gray-600 mt-1">Detailed performance metrics for each student</p>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                          <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Attendance</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</th>
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
                  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div class="p-6 border-b border-gray-200">
                      <h3 class="text-lg font-semibold text-gray-900">Course-wise Performance</h3>
                      <p class="text-gray-600 mt-1">Performance statistics grouped by courses</p>
                    </div>
                    <div class="p-6">
                      <div id="courseStatsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Dynamic course cards will be inserted here */}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Error State */}
                <div id="errorState" class="hidden bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <div class="text-red-400 text-4xl mb-4">⚠️</div>
                  <h3 class="text-lg font-medium text-red-900 mb-2">Error Loading Student Details</h3>
                  <p id="errorMessage" class="text-red-600 mb-4"></p>
                  <button 
                    onclick="loadStudentData()"
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
          let analyticsData = null;
          let charts = {};
          const teacherId = '${teacherId}';
          const studentId = '${studentId || ''}';
          const isIndividualView = ${isIndividualView};

          // Load analytics data
          async function loadStudentData() {
            try {
              document.getElementById('loadingState').classList.remove('hidden');
              document.getElementById('mainContent').classList.add('hidden');
              document.getElementById('errorState').classList.add('hidden');

              if (isIndividualView) {
                console.log('Fetching individual student data for:', studentId);
                const response = await fetch('/api/student-details?studentId=' + studentId);
                console.log('Response status:', response.status);
                
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('API Error:', errorText);
                  throw new Error('Failed to fetch student details: ' + response.status + ' - ' + errorText);
                }

                analyticsData = await response.json();
                renderIndividualStudentView();
              } else {
                console.log('Fetching analytics data for teacher:', teacherId);
                const response = await fetch('/api/attendance-analytics?teacherId=' + teacherId);
                console.log('Response status:', response.status);
                
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('API Error:', errorText);
                  throw new Error('Failed to fetch analytics data: ' + response.status + ' - ' + errorText);
                }

                analyticsData = await response.json();
                renderAnalyticsDashboard();
              }
              
              document.getElementById('loadingState').classList.add('hidden');
              document.getElementById('mainContent').classList.remove('hidden');
            } catch (error) {
              console.error('Error loading data:', error);
              document.getElementById('loadingState').classList.add('hidden');
              document.getElementById('errorState').classList.remove('hidden');
              document.getElementById('errorMessage').textContent = error.message;
            }
          }

          // Render analytics dashboard
          function renderAnalyticsDashboard() {
            if (!analyticsData) return;

            // Update summary cards
            document.getElementById('totalStudents').textContent = analyticsData.summary.totalStudents;
            document.getElementById('averageAttendance').textContent = analyticsData.summary.averageAttendance + '%';
            document.getElementById('totalCourses').textContent = analyticsData.summary.totalCourses;
            
            // Calculate high risk students (attendance < 60%)
            const highRiskCount = analyticsData.studentStats.filter(s => s.averageAttendance < 60).length;
            document.getElementById('highRiskStudents').textContent = highRiskCount;

            // Render charts
            renderAttendanceDistributionChart();
            renderMonthlyTrendsChart();
            renderTestScoreChart();
            renderRiskLevelChart();

            // Render tables and lists
            renderStudentTable();
            renderCourseStats();
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
                    analyticsData.attendanceDistribution.excellent,
                    analyticsData.attendanceDistribution.good,
                    analyticsData.attendanceDistribution.average,
                    analyticsData.attendanceDistribution.poor
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
            
            const monthlyData = analyticsData.monthlyTrends.reverse();
            
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

          // Render test score chart
          function renderTestScoreChart() {
            const ctx = document.getElementById('testScoreChart').getContext('2d');
            
            if (charts.testScore) charts.testScore.destroy();
            
            // Create test score distribution (A, B, C, D, F)
            const scoreDistribution = {
              'A (90-100)': 0,
              'B (80-89)': 0,
              'C (70-79)': 0,
              'D (60-69)': 0,
              'F (<60)': 0
            };
            
            // This would need actual test score data - for now using sample distribution
            charts.testScore = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: Object.keys(scoreDistribution),
                datasets: [{
                  label: 'Number of Students',
                  data: [15, 25, 20, 10, 5], // Sample data
                  backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'],
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
                      precision: 0
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

          // Render risk level chart
          function renderRiskLevelChart() {
            const ctx = document.getElementById('riskLevelChart').getContext('2d');
            
            if (charts.riskLevel) charts.riskLevel.destroy();
            
            // Calculate risk levels based on attendance
            const riskLevels = {
              'Low Risk (75%+)': analyticsData.studentStats.filter(s => s.averageAttendance >= 75).length,
              'Medium Risk (60-74%)': analyticsData.studentStats.filter(s => s.averageAttendance >= 60 && s.averageAttendance < 75).length,
              'High Risk (<60%)': analyticsData.studentStats.filter(s => s.averageAttendance < 60).length
            };
            
            charts.riskLevel = new Chart(ctx, {
              type: 'pie',
              data: {
                labels: Object.keys(riskLevels),
                datasets: [{
                  data: Object.values(riskLevels),
                  backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
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

          // Render student table
          function renderStudentTable() {
            const tbody = document.getElementById('studentTableBody');
            tbody.innerHTML = '';

            analyticsData.studentStats.forEach(student => {
              const row = document.createElement('tr');
              row.className = 'hover:bg-gray-50 fade-in';
              
              const statusClass = student.averageAttendance >= 75 ? 'bg-green-100 text-green-800' :
                                student.averageAttendance >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800';
              
              const statusText = student.averageAttendance >= 75 ? 'Good' :
                               student.averageAttendance >= 60 ? 'Average' : 'At Risk';

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

            analyticsData.courseStats.forEach(course => {
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

          // Render individual student view
          function renderIndividualStudentView() {
            if (!analyticsData) return;

            const student = analyticsData.student;
            const stats = analyticsData.statistics;
            
            // Hide the overview content and show individual student content
            const mainContent = document.getElementById('mainContent');
            mainContent.innerHTML = \`
              <div class="space-y-6">
                <!-- Student Header -->
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div class="flex items-center space-x-6">
                    <div class="flex-shrink-0">
                      <div class="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-2xl font-bold text-blue-600">\${student.name.charAt(0)}</span>
                      </div>
                    </div>
                    <div class="flex-1">
                      <h2 class="text-2xl font-bold text-gray-900">\${student.name}</h2>
                      <p class="text-gray-600">Student ID: \${student.studentId}</p>
                      <div class="flex items-center space-x-4 mt-2">
                        <span class="text-sm text-gray-500">Department: \${student.department || 'N/A'}</span>
                        <span class="text-sm text-gray-500">Batch: \${student.batch?.batchNo || 'N/A'}</span>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm text-gray-500">Risk Level</div>
                      <span class="inline-flex px-3 py-1 text-sm font-medium rounded-full \${getRiskLevelClass(stats.risk.currentRiskLevel)}">
                        \${stats.risk.currentRiskLevel}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Quick Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-gray-600">Avg Attendance</p>
                        <p class="text-2xl font-bold text-gray-900">\${stats.attendance.averageAttendance}%</p>
                      </div>
                      <div class="p-3 bg-green-100 rounded-full">
                        <span class="text-green-600 text-xl">📊</span>
                      </div>
                    </div>
                  </div>

                  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-gray-600">Avg Test Score</p>
                        <p class="text-2xl font-bold text-gray-900">\${stats.testScores.averageScore}%</p>
                      </div>
                      <div class="p-3 bg-blue-100 rounded-full">
                        <span class="text-blue-600 text-xl">📝</span>
                      </div>
                    </div>
                  </div>

                  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-gray-600">Pending Backlogs</p>
                        <p class="text-2xl font-bold text-red-600">\${stats.backlogs.pendingBacklogs}</p>
                      </div>
                      <div class="p-3 bg-red-100 rounded-full">
                        <span class="text-red-600 text-xl">⚠️</span>
                      </div>
                    </div>
                  </div>

                  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-gray-600">Active Projects</p>
                        <p class="text-2xl font-bold text-gray-900">\${stats.research.activeProjects}</p>
                      </div>
                      <div class="p-3 bg-purple-100 rounded-full">
                        <span class="text-purple-600 text-xl">🔬</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Tabs -->
                <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div class="border-b border-gray-200">
                    <nav class="-mb-px flex space-x-8 px-6">
                      <button onclick="showTab('overview')" id="tab-overview" class="tab-button active-tab py-4 px-1 border-b-2 font-medium text-sm">
                        Overview
                      </button>
                      <button onclick="showTab('academic')" id="tab-academic" class="tab-button py-4 px-1 border-b-2 font-medium text-sm">
                        Academic Records
                      </button>
                      <button onclick="showTab('contact')" id="tab-contact" class="tab-button py-4 px-1 border-b-2 font-medium text-sm">
                        Contact Info
                      </button>
                      <button onclick="showTab('research')" id="tab-research" class="tab-button py-4 px-1 border-b-2 font-medium text-sm">
                        Research & Projects
                      </button>
                    </nav>
                  </div>

                  <!-- Tab Content -->
                  <div class="p-6">
                    <!-- Overview Tab -->
                    <div id="content-overview" class="tab-content">
                      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Attendance Chart -->
                        <div class="bg-gray-50 rounded-lg p-4">
                          <h4 class="font-medium text-gray-900 mb-4">Course-wise Attendance</h4>
                          <div class="space-y-3">
                            \${renderCourseWiseAttendance(stats.attendance.courseWiseAttendance)}
                          </div>
                        </div>

                        <!-- Test Scores Chart -->
                        <div class="bg-gray-50 rounded-lg p-4">
                          <h4 class="font-medium text-gray-900 mb-4">Course-wise Test Scores</h4>
                          <div class="space-y-3">
                            \${renderCourseWiseScores(stats.testScores.courseWiseScores)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Academic Records Tab -->
                    <div id="content-academic" class="tab-content hidden">
                      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Backlogs -->
                        <div class="bg-gray-50 rounded-lg p-4">
                          <h4 class="font-medium text-gray-900 mb-4">Backlogs Status</h4>
                          <div class="space-y-2">
                            <div class="flex justify-between">
                              <span class="text-gray-600">Total Backlogs:</span>
                              <span class="font-medium">\${stats.backlogs.totalBacklogs}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-gray-600">Cleared:</span>
                              <span class="font-medium text-green-600">\${stats.backlogs.clearedBacklogs}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-gray-600">Pending:</span>
                              <span class="font-medium text-red-600">\${stats.backlogs.pendingBacklogs}</span>
                            </div>
                          </div>
                        </div>

                        <!-- Fee Status -->
                        <div class="bg-gray-50 rounded-lg p-4">
                          <h4 class="font-medium text-gray-900 mb-4">Fee Status</h4>
                          <div class="space-y-2">
                            <div class="flex justify-between">
                              <span class="text-gray-600">Total Payments:</span>
                              <span class="font-medium">\${stats.fees.totalPayments}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-gray-600">Paid:</span>
                              <span class="font-medium text-green-600">\${stats.fees.paidPayments}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-gray-600">Pending:</span>
                              <span class="font-medium text-yellow-600">\${stats.fees.pendingPayments}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-gray-600">Overdue:</span>
                              <span class="font-medium text-red-600">\${stats.fees.overduePayments}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Contact Info Tab -->
                    <div id="content-contact" class="tab-content hidden">
                      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Student Contact -->
                        <div class="bg-gray-50 rounded-lg p-4">
                          <h4 class="font-medium text-gray-900 mb-4">Student Contact</h4>
                          <div class="space-y-2">
                            <div class="flex justify-between">
                              <span class="text-gray-600">Email:</span>
                              <span class="font-medium">\${student.email || 'N/A'}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-gray-600">Phone:</span>
                              <span class="font-medium">\${student.phone || 'N/A'}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-gray-600">Address:</span>
                              <span class="font-medium">\${student.address || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <!-- Parent/Guardian Contact -->
                        <div class="bg-gray-50 rounded-lg p-4">
                          <h4 class="font-medium text-gray-900 mb-4">Parent/Guardian Contact</h4>
                          <div class="space-y-2">
                            <div class="flex justify-between">
                              <span class="text-gray-600">Name:</span>
                              <span class="font-medium">\${student.parentName || 'N/A'}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-gray-600">Phone:</span>
                              <span class="font-medium">\${student.parentPhone || 'N/A'}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-gray-600">Email:</span>
                              <span class="font-medium">\${student.parentEmail || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Research Tab -->
                    <div id="content-research" class="tab-content hidden">
                      <div class="space-y-6">
                        <!-- Projects -->
                        <div class="bg-gray-50 rounded-lg p-4">
                          <h4 class="font-medium text-gray-900 mb-4">Projects</h4>
                          <div class="space-y-2">
                            <div class="flex justify-between">
                              <span class="text-gray-600">Active Projects:</span>
                              <span class="font-medium text-green-600">\${stats.research.activeProjects}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-gray-600">Completed Projects:</span>
                              <span class="font-medium text-blue-600">\${stats.research.completedProjects}</span>
                            </div>
                          </div>
                        </div>

                        <!-- PhD & Fellowship -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="font-medium text-gray-900 mb-4">PhD Status</h4>
                            <div class="text-center">
                              <span class="inline-flex px-3 py-1 text-sm font-medium rounded-full \${stats.research.phdStatus ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
                                \${stats.research.phdStatus || 'Not Enrolled'}
                              </span>
                            </div>
                          </div>

                          <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="font-medium text-gray-900 mb-4">Fellowship</h4>
                            <div class="space-y-2">
                              <div class="text-center">
                                <span class="inline-flex px-3 py-1 text-sm font-medium rounded-full \${stats.research.fellowshipStatus ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                  \${stats.research.fellowshipStatus || 'No Fellowship'}
                                </span>
                              </div>
                              \${stats.research.totalFellowshipAmount > 0 ? \`
                                <div class="text-center text-sm text-gray-600 mt-2">
                                  Total Amount: ₹\${stats.research.totalFellowshipAmount.toLocaleString()}
                                </div>
                              \` : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Back to Overview Button -->
                <div class="text-center">
                  <button 
                    onclick="window.location.href='/dashboard/mentees/student-details'"
                    class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ← Back to Students Overview
                  </button>
                </div>
              </div>
            \`;
          }

          // Helper functions for individual student view
          function getRiskLevelClass(riskLevel) {
            switch(riskLevel) {
              case 'High': return 'bg-red-100 text-red-800';
              case 'Medium': return 'bg-yellow-100 text-yellow-800';
              case 'Low': return 'bg-green-100 text-green-800';
              default: return 'bg-gray-100 text-gray-800';
            }
          }

          function renderCourseWiseAttendance(courseWiseAttendance) {
            return Object.values(courseWiseAttendance).map(course => \`
              <div class="flex justify-between items-center">
                <div>
                  <div class="font-medium text-sm">\${course.course.name}</div>
                  <div class="text-xs text-gray-500">\${course.course.code}</div>
                </div>
                <div class="text-right">
                  <div class="font-medium \${course.average >= 75 ? 'text-green-600' : course.average >= 60 ? 'text-yellow-600' : 'text-red-600'}">\${course.average}%</div>
                  <div class="text-xs text-gray-500">\${course.records.length} records</div>
                </div>
              </div>
            \`).join('');
          }

          function renderCourseWiseScores(courseWiseScores) {
            return Object.values(courseWiseScores).map(course => \`
              <div class="flex justify-between items-center">
                <div>
                  <div class="font-medium text-sm">\${course.course.name}</div>
                  <div class="text-xs text-gray-500">\${course.course.code}</div>
                </div>
                <div class="text-right">
                  <div class="font-medium \${course.average >= 75 ? 'text-green-600' : course.average >= 60 ? 'text-yellow-600' : 'text-red-600'}">\${course.average}%</div>
                  <div class="text-xs text-gray-500">\${course.scores.length} tests</div>
                </div>
              </div>
            \`).join('');
          }

          function showTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
              content.classList.add('hidden');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab-button').forEach(button => {
              button.classList.remove('active-tab');
              button.classList.add('inactive-tab');
            });
            
            // Show selected tab content
            document.getElementById('content-' + tabName).classList.remove('hidden');
            
            // Add active class to selected tab
            document.getElementById('tab-' + tabName).classList.add('active-tab');
            document.getElementById('tab-' + tabName).classList.remove('inactive-tab');
          }


          // View individual student details
          function viewStudentDetails(studentId) {
            window.location.href = \`/dashboard/mentees/student-details?studentId=\${studentId}\`;
          }

          // Event listeners
          document.getElementById('refreshBtn').addEventListener('click', loadStudentData);

          // Initial load
          document.addEventListener('DOMContentLoaded', loadStudentData);
        `}}>
        </script>
      </body>
    </html>
  )
})

import { createRoute } from 'honox/factory'
import Header from '../../components/dashboard/Header'
import Sidebar from '../../components/dashboard/Sidebar'

export default createRoute(async (c) => {
  // Get teacher authentication
  const teacherIdRaw = c.req.header('Cookie')?.match(/uid=([^;]+)/)?.[1]
  if (!teacherIdRaw) {
    return c.redirect('/login')
  }
  
  const teacherId = decodeURIComponent(teacherIdRaw)
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  // Get teacher information
  const teacher = await prisma.teacher.findUnique({
    where: { teacherId }
  })
  
  if (!teacher) {
    return c.redirect('/login')
  }

  return c.render(
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Mental Health and Wellness Dashboard - EduPulse</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>{`
          .fade-in { animation: fadeIn 0.5s ease-in; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .pulse-animation { animation: pulse 2s infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .card-hover { transition: all 0.3s ease; }
          .card-hover:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        `}</style>
      </head>
      <body className="bg-gray-50">
        <div className="flex h-screen">
          <Sidebar currentPath="/dashboard/mental-health" />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              uid={teacherId} 
              userName={teacher.name} 
              userEmail={teacher.email} 
              userPicture={teacher.picture} 
            />
            
            <main className="flex-1 overflow-y-auto p-6">
              {/* Header Section */}
              <div className="gradient-bg rounded-xl p-6 mb-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Mental Health and Wellness Dashboard</h1>
                    <p className="text-white/90">Comprehensive student wellbeing monitoring and support system</p>
                    <div className="flex items-center mt-3 text-sm">
                      <div className="flex items-center mr-4">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 pulse-animation"></div>
                        <span>System Online</span>
                      </div>
                      <span id="lastUpdated">Last updated: Loading...</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-white/20 rounded-lg p-3">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              <div id="loadingState" className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-lg text-gray-600">Loading mental health analytics...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait while we gather the data</p>
              </div>

              {/* Main Content - Hidden initially */}
              <div id="mainContent" className="hidden">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Students</p>
                        <p id="totalStudents" className="text-2xl font-bold text-gray-900">-</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span id="studentsWithAssessments">-</span> with assessments
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Avg Wellness</p>
                        <p id="avgWellness" className="text-2xl font-bold text-gray-900">-/10</p>
                        <p className="text-xs text-gray-500 mt-1">Overall wellbeing</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
                    <div className="flex items-center">
                      <div className="p-3 bg-red-100 rounded-lg">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">High Risk</p>
                        <p id="highRiskCount" className="text-2xl font-bold text-gray-900">-</p>
                        <p className="text-xs text-gray-500 mt-1">Need attention</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0v-1h8v1z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Support</p>
                        <p id="activeSupportCount" className="text-2xl font-bold text-gray-900">-</p>
                        <p className="text-xs text-gray-500 mt-1">Open tickets</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Risk Distribution Chart */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Risk Level Distribution</h3>
                      <button id="refreshRiskChart" className="text-purple-600 hover:text-purple-800 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                    <div className="relative h-64">
                      <canvas id="riskDistributionChart"></canvas>
                    </div>
                  </div>

                  {/* Monthly Trends Chart */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Monthly Wellness Trends</h3>
                      <button id="refreshTrendsChart" className="text-purple-600 hover:text-purple-800 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                    <div className="relative h-64">
                      <canvas id="trendsChart"></canvas>
                    </div>
                  </div>
                </div>

                {/* Student Performance Table */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Student Mental Health Overview</h3>
                    <div className="flex items-center space-x-3">
                      <select id="studentFilter" className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option value="">All Students</option>
                      </select>
                      <button id="refreshTable" className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">
                        Refresh
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latest Assessment</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wellness Score</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody id="studentsTableBody" className="bg-white divide-y divide-gray-200">
                        {/* Dynamic content */}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Mental Health Activities</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full pulse-animation"></div>
                      <span className="text-sm text-gray-600">Live Updates</span>
                    </div>
                  </div>
                  <div id="recentActivities" className="space-y-4">
                    {/* Dynamic content */}
                  </div>
                </div>
              </div>

              {/* Error State */}
              <div id="errorState" className="hidden text-center py-12">
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Data</h3>
                <p className="text-gray-600 mb-4">There was an error loading the mental health analytics.</p>
                <button id="retryButton" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
                  Try Again
                </button>
              </div>
            </main>
          </div>
        </div>

        <script>{`
          let riskChart, trendsChart;
          
          async function loadMentalHealthData() {
            try {
              console.log('Starting to load mental health data...');
              document.getElementById('loadingState').classList.remove('hidden');
              document.getElementById('mainContent').classList.add('hidden');
              document.getElementById('errorState').classList.add('hidden');
              
              console.log('Making fetch request to /api/mental-health-analytics');
              const response = await fetch('/api/mental-health-analytics');
              console.log('Response status:', response.status, response.statusText);
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                throw new Error('Failed to fetch data: ' + response.status);
              }
              
              const data = await response.json();
              console.log('Mental health data loaded successfully:', data);
              
              // Check if we have valid data structure
              if (!data || !data.summary) {
                console.error('Invalid data structure received:', data);
                throw new Error('Invalid data structure');
              }
              
              // Update summary cards with error handling
              try {
                console.log('Updating summary cards...');
                document.getElementById('totalStudents').textContent = String(data.summary.totalStudents || 0);
                document.getElementById('studentsWithAssessments').textContent = String(data.summary.studentsWithAssessments || 0);
                document.getElementById('avgWellness').textContent = (data.summary.avgOverallWellness || 0).toFixed(1) + '/10';
                
                const highRisk = (data.distributions?.riskLevels?.high || 0);
                const critical = (data.distributions?.riskLevels?.critical || 0);
                document.getElementById('highRiskCount').textContent = String(highRisk + critical);
                
                document.getElementById('activeSupportCount').textContent = String(data.summary.openTickets || 0);
                console.log('Summary cards updated successfully');
              } catch (cardError) {
                console.error('Error updating summary cards:', cardError);
              }
              
              // Update timestamp
              try {
                document.getElementById('lastUpdated').textContent = 
                  'Last updated: ' + new Date().toLocaleTimeString();
                console.log('Timestamp updated');
              } catch (timestampError) {
                console.error('Error updating timestamp:', timestampError);
              }
              
              // Create charts
              try {
                console.log('Creating charts...');
                createRiskDistributionChart(data.distributions?.riskLevels || {low: 0, medium: 0, high: 0, critical: 0});
                createTrendsChart(data.trends?.monthly || []);
                console.log('Charts created successfully');
              } catch (chartError) {
                console.error('Error creating charts:', chartError);
              }
              
              // Update student table
              try {
                console.log('Updating student table...');
                updateStudentTable(data.rawData?.assessments || []);
                console.log('Student table updated');
              } catch (tableError) {
                console.error('Error updating student table:', tableError);
              }
              
              // Update recent activities
              try {
                console.log('Updating recent activities...');
                updateRecentActivities(data.recentActivities || []);
                console.log('Recent activities updated');
              } catch (activitiesError) {
                console.error('Error updating recent activities:', activitiesError);
              }
              
              // Show main content
              try {
                console.log('Showing main content...');
                document.getElementById('loadingState').classList.add('hidden');
                document.getElementById('mainContent').classList.remove('hidden');
                document.getElementById('mainContent').classList.add('fade-in');
                console.log('Main content displayed successfully!');
              } catch (displayError) {
                console.error('Error showing main content:', displayError);
              }
              
            } catch (error) {
              console.error('Error loading mental health data:', error);
              document.getElementById('loadingState').classList.add('hidden');
              document.getElementById('errorState').classList.remove('hidden');
            }
          }
          
          function createRiskDistributionChart(riskLevels) {
            try {
              const ctx = document.getElementById('riskDistributionChart').getContext('2d');
              
              if (riskChart) riskChart.destroy();
              
              // Handle empty data
              const safeRiskLevels = riskLevels || {low: 0, medium: 0, high: 0, critical: 0};
              const hasData = (safeRiskLevels.low + safeRiskLevels.medium + safeRiskLevels.high + safeRiskLevels.critical) > 0;
              
              riskChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                  labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'],
                  datasets: [{
                    data: hasData ? [safeRiskLevels.low, safeRiskLevels.medium, safeRiskLevels.high, safeRiskLevels.critical] : [1, 0, 0, 0],
                    backgroundColor: hasData ? ['#10B981', '#F59E0B', '#EF4444', '#DC2626'] : ['#E5E7EB'],
                    borderWidth: 2,
                    borderColor: '#fff'
                  }]
                },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 20,
                      usePointStyle: true
                    }
                  }
                }
              }
            });
            } catch (error) {
              console.error('Error creating risk distribution chart:', error);
            }
          }
          
          function createTrendsChart(monthlyData) {
            try {
              const ctx = document.getElementById('trendsChart').getContext('2d');
              
              if (trendsChart) trendsChart.destroy();
              
              // Handle empty data
              const safeMonthlyData = monthlyData || [];
              const hasData = safeMonthlyData.length > 0;
              
              // Default data for empty state
              const defaultData = hasData ? safeMonthlyData : [
                {month: 'No Data', avgWellness: 0, avgStress: 0}
              ];
              
              trendsChart = new Chart(ctx, {
                type: 'line',
                data: {
                  labels: defaultData.map(d => d.month),
                  datasets: [{
                    label: 'Average Wellness',
                    data: defaultData.map(d => d.avgWellness || 0),
                    borderColor: hasData ? '#8B5CF6' : '#E5E7EB',
                    backgroundColor: hasData ? 'rgba(139, 92, 246, 0.1)' : 'rgba(229, 231, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                  }, {
                    label: 'Average Stress',
                    data: defaultData.map(d => d.avgStress || 0),
                    borderColor: hasData ? '#EF4444' : '#E5E7EB',
                    backgroundColor: hasData ? 'rgba(239, 68, 68, 0.1)' : 'rgba(229, 231, 235, 0.1)',
                    tension: 0.4,
                    fill: false
                  }]
                },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 10
                  }
                }
              }
            });
            } catch (error) {
              console.error('Error creating trends chart:', error);
            }
          }
          
          function updateStudentTable(assessments) {
            const tbody = document.getElementById('studentsTableBody');
            tbody.innerHTML = '';
            
            // Group assessments by student (latest first)
            const studentMap = new Map();
            assessments.forEach(assessment => {
              if (!studentMap.has(assessment.studentId) || 
                  new Date(assessment.assessmentDate) > new Date(studentMap.get(assessment.studentId).assessmentDate)) {
                studentMap.set(assessment.studentId, assessment);
              }
            });
            
            Array.from(studentMap.values()).forEach(assessment => {
              const riskScore = (assessment.stressLevel + assessment.anxietyLevel + assessment.depressionLevel) / 3;
              let riskLevel = 'Low';
              let riskColor = 'green';
              
              if (riskScore > 7) { riskLevel = 'Critical'; riskColor = 'red'; }
              else if (riskScore > 5) { riskLevel = 'High'; riskColor = 'orange'; }
              else if (riskScore > 3) { riskLevel = 'Medium'; riskColor = 'yellow'; }
              
              const row = document.createElement('tr');
              row.innerHTML = 
                '<td class="px-6 py-4 whitespace-nowrap">' +
                  '<div class="flex items-center">' +
                    '<div class="flex-shrink-0 h-10 w-10">' +
                      '<div class="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">' +
                        '<span class="text-sm font-medium text-purple-600">' + assessment.student.name.charAt(0) + '</span>' +
                      '</div>' +
                    '</div>' +
                    '<div class="ml-4">' +
                      '<div class="text-sm font-medium text-gray-900">' + assessment.student.name + '</div>' +
                      '<div class="text-sm text-gray-500">' + (assessment.student.department || 'N/A') + '</div>' +
                    '</div>' +
                  '</div>' +
                '</td>' +
                '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' +
                  new Date(assessment.assessmentDate).toLocaleDateString() +
                '</td>' +
                '<td class="px-6 py-4 whitespace-nowrap">' +
                  '<div class="flex items-center">' +
                    '<div class="flex-1 bg-gray-200 rounded-full h-2 mr-2">' +
                      '<div class="bg-purple-600 h-2 rounded-full" style="width: ' + (assessment.overallWellness * 10) + '%"></div>' +
                    '</div>' +
                    '<span class="text-sm font-medium text-gray-900">' + assessment.overallWellness + '/10</span>' +
                  '</div>' +
                '</td>' +
                '<td class="px-6 py-4 whitespace-nowrap">' +
                  '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-' + riskColor + '-100 text-' + riskColor + '-800">' +
                    riskLevel +
                  '</span>' +
                '</td>' +
                '<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">' +
                  '<button onclick="viewStudentDetails(\'' + assessment.studentId + '\')" class="text-purple-600 hover:text-purple-900 mr-3">View</button>' +
                  '<button onclick="scheduleAppointment(\'' + assessment.studentId + '\')" class="text-blue-600 hover:text-blue-900">Schedule</button>' +
                '</td>';
              tbody.appendChild(row);
            });
          }
          
          function updateRecentActivities(activities) {
            const container = document.getElementById('recentActivities');
            container.innerHTML = '';
            
            activities.slice(0, 10).forEach(activity => {
              let icon = '📊';
              let bgColor = 'bg-blue-50';
              let textColor = 'text-blue-600';
              
              switch (activity.type) {
                case 'assessment': icon = '📊'; bgColor = 'bg-blue-50'; textColor = 'text-blue-600'; break;
                case 'appointment': icon = '🗓️'; bgColor = 'bg-green-50'; textColor = 'text-green-600'; break;
                case 'support': icon = '🎫'; bgColor = 'bg-purple-50'; textColor = 'text-purple-600'; break;
              }
              
              const div = document.createElement('div');
              div.className = 'flex items-center p-4 ' + bgColor + ' rounded-lg';
              div.innerHTML = 
                '<div class="flex-shrink-0">' +
                  '<span class="text-2xl">' + icon + '</span>' +
                '</div>' +
                '<div class="ml-4 flex-1">' +
                  '<p class="text-sm font-medium text-gray-900">' + (activity.studentName || 'Anonymous') + '</p>' +
                  '<p class="text-sm text-gray-600">' + activity.details + '</p>' +
                  '<p class="text-xs text-gray-500 mt-1">' + new Date(activity.date).toLocaleString() + '</p>' +
                '</div>' +
                '<div class="flex-shrink-0">' +
                  '<span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ' + bgColor + ' ' + textColor + '">' +
                    activity.type.charAt(0).toUpperCase() + activity.type.slice(1) +
                  '</span>' +
                '</div>';
              container.appendChild(div);
            });
          }
          
          function viewStudentDetails(studentId) {
            window.location.href = '/dashboard/mental-health/student/' + studentId;
          }
          
          function scheduleAppointment(studentId) {
            // TODO: Implement appointment scheduling modal
            alert('Appointment scheduling feature coming soon!');
          }
          
          // Event listeners
          document.getElementById('retryButton').addEventListener('click', loadMentalHealthData);
          document.getElementById('refreshTable').addEventListener('click', loadMentalHealthData);
          document.getElementById('refreshRiskChart').addEventListener('click', loadMentalHealthData);
          document.getElementById('refreshTrendsChart').addEventListener('click', loadMentalHealthData);
          
          // Load data on page load
          loadMentalHealthData();
        `}</script>
      </body>
    </html>
  )
})

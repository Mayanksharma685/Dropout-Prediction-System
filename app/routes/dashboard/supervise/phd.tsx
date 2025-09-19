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
        <title>PhD Supervision - EduPulse</title>
        <script src="https://unpkg.com/htmx.org@1.9.10"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          {`
            .modal {
              display: none;
            }
            .modal.active {
              display: flex;
            }
            .status-ongoing { @apply bg-green-100 text-green-800; }
            .status-completed { @apply bg-blue-100 text-blue-800; }
            .status-discontinued { @apply bg-red-100 text-red-800; }
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
            .fade-in {
              animation: fadeIn 0.5s ease-in;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}
        </style>
      </head>
      <body>
        <div class="flex h-screen bg-gray-100">
          <Sidebar currentPath="/dashboard/supervise/phd" />
          <div class="flex-1 flex flex-col overflow-hidden">
            <Header uid={teacherId} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
            <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                  <div>
                    <h1 class="text-2xl font-bold text-gray-900">PhD Supervision</h1>
                    <p class="text-gray-600 mt-1">Manage and track PhD student research</p>
                  </div>
                  <div class="flex gap-3">
                    <button 
                      id="refreshBtn"
                      class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <span>🔄</span>
                      Refresh
                    </button>
                    <button 
                      onclick="openModal('addPhdModal')"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <span>+</span>
                      Add PhD Student
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                <div id="loadingState" class="flex justify-center items-center py-12">
                  <div class="loading-spinner"></div>
                  <span class="ml-3 text-gray-600">Loading PhD supervision data...</span>
                </div>

                {/* Main Content */}
                <div id="mainContent" class="hidden space-y-6">
                  {/* Summary Cards */}
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Total PhD Students</p>
                          <p id="totalPhds" class="text-2xl font-bold text-gray-900">-</p>
                        </div>
                        <div class="p-3 bg-blue-100 rounded-full">
                          <span class="text-blue-600 text-xl">🎓</span>
                        </div>
                      </div>
                    </div>

                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Ongoing Research</p>
                          <p id="ongoingPhds" class="text-2xl font-bold text-green-600">-</p>
                        </div>
                        <div class="p-3 bg-green-100 rounded-full">
                          <span class="text-green-600 text-xl">🔬</span>
                        </div>
                      </div>
                    </div>

                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Completed PhDs</p>
                          <p id="completedPhds" class="text-2xl font-bold text-blue-600">-</p>
                        </div>
                        <div class="p-3 bg-blue-100 rounded-full">
                          <span class="text-blue-600 text-xl">✅</span>
                        </div>
                      </div>
                    </div>

                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Avg. Duration</p>
                          <p id="avgDuration" class="text-2xl font-bold text-gray-900">-</p>
                        </div>
                        <div class="p-3 bg-purple-100 rounded-full">
                          <span class="text-purple-600 text-xl">⏱️</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Status Distribution */}
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">PhD Status Distribution</h3>
                      <div class="relative h-64">
                        <canvas id="statusChart"></canvas>
                      </div>
                    </div>

                    {/* Research Areas */}
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Research Areas</h3>
                      <div class="relative h-64">
                        <canvas id="researchAreasChart"></canvas>
                      </div>
                    </div>

                    {/* Completion Trends */}
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Completion Trends</h3>
                      <div class="relative h-64">
                        <canvas id="completionTrendsChart"></canvas>
                      </div>
                    </div>

                    {/* Duration Distribution */}
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Duration Distribution</h3>
                      <div class="relative h-64">
                        <canvas id="durationChart"></canvas>
                      </div>
                    </div>
                  </div>

                  {/* PhD Supervisions List */}
                  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div class="p-6 border-b border-gray-200">
                      <h2 class="text-lg font-semibold text-gray-900">PhD Students Under Supervision</h2>
                    </div>
                    <div id="phd-container" class="divide-y divide-gray-200">
                      {/* PhD supervisions will be loaded here */}
                    </div>
                  </div>

                  {/* Upcoming Completions */}
                  <div id="upcomingSection" class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div class="p-6 border-b border-gray-200">
                      <h2 class="text-lg font-semibold text-gray-900">Upcoming Completions</h2>
                      <p class="text-sm text-gray-600">PhDs expected to complete in the next 6 months</p>
                    </div>
                    <div id="upcoming-container" class="divide-y divide-gray-200">
                      {/* Upcoming completions will be loaded here */}
                    </div>
                  </div>
                </div>

                {/* Add PhD Modal */}
                <div id="addPhdModal" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div class="flex justify-between items-center mb-4">
                      <h3 class="text-lg font-semibold text-gray-900">Add PhD Student</h3>
                      <button onclick="closeModal('addPhdModal')" class="text-gray-400 hover:text-gray-600">
                        <span class="text-xl">×</span>
                      </button>
                    </div>
                    <form id="addPhdForm" class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Research Title</label>
                        <input 
                          type="text" 
                          name="title" 
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter research title"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Research Area</label>
                        <input 
                          type="text" 
                          name="researchArea" 
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter research area"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                        <input 
                          type="text" 
                          name="studentId" 
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter student ID"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input 
                          type="date" 
                          name="startDate" 
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Expected End Date (Optional)</label>
                        <input 
                          type="date" 
                          name="expectedEnd"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                          name="status"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Ongoing">Ongoing</option>
                          <option value="Completed">Completed</option>
                          <option value="Discontinued">Discontinued</option>
                        </select>
                      </div>
                      <div class="flex gap-3 pt-4">
                        <button 
                          type="submit"
                          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add PhD Student
                        </button>
                        <button 
                          type="button"
                          onclick="closeModal('addPhdModal')"
                          class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Edit PhD Modal */}
                <div id="editPhdModal" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div class="flex justify-between items-center mb-4">
                      <h3 class="text-lg font-semibold text-gray-900">Edit PhD Supervision</h3>
                      <button onclick="closeModal('editPhdModal')" class="text-gray-400 hover:text-gray-600">
                        <span class="text-xl">×</span>
                      </button>
                    </div>
                    <form id="editPhdForm" class="space-y-4">
                      <input type="hidden" name="phdId" id="editPhdId" />
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Research Title</label>
                        <input 
                          type="text" 
                          name="title" 
                          id="editTitle"
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Research Area</label>
                        <input 
                          type="text" 
                          name="researchArea" 
                          id="editResearchArea"
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                        <input 
                          type="text" 
                          name="studentId" 
                          id="editStudentId"
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input 
                          type="date" 
                          name="startDate" 
                          id="editStartDate"
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Expected End Date</label>
                        <input 
                          type="date" 
                          name="expectedEnd"
                          id="editExpectedEnd"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                          name="status"
                          id="editStatus"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Ongoing">Ongoing</option>
                          <option value="Completed">Completed</option>
                          <option value="Discontinued">Discontinued</option>
                        </select>
                      </div>
                      <div class="flex gap-3 pt-4">
                        <button 
                          type="submit"
                          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Update PhD
                        </button>
                        <button 
                          type="button"
                          onclick="closeModal('editPhdModal')"
                          class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{
          __html: `
            // Modal functions
            function openModal(modalId) {
              document.getElementById(modalId).classList.add('active');
            }

            function closeModal(modalId) {
              document.getElementById(modalId).classList.remove('active');
            }

            // Load PhD supervisions and analytics on page load
            document.addEventListener('DOMContentLoaded', function() {
              console.log('PhD page loaded, starting analytics...');
              loadAnalytics();
              loadPhdSupervisions();
            });

            // Refresh button functionality
            document.getElementById('refreshBtn').addEventListener('click', function() {
              console.log('Refresh button clicked');
              document.getElementById('loadingState').style.display = 'block';
              document.getElementById('mainContent').classList.add('hidden');
              loadAnalytics();
              loadPhdSupervisions();
            });

            // Load analytics function
            async function loadAnalytics() {
              console.log('=== Starting loadAnalytics ===');
              
              try {
                console.log('Fetching /api/phd-analytics...');
                const response = await fetch('/api/phd-analytics');
                console.log('Response status:', response.status);
                
                if (!response.ok) {
                  throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const analytics = await response.json();
                console.log('Analytics data received:', analytics);
                
                // Check for API error
                if (analytics.error) {
                  throw new Error(analytics.error);
                }
                
                // Update summary cards with fallbacks
                const summary = analytics.summary || {};
                document.getElementById('totalPhds').textContent = summary.totalPhds || '0';
                document.getElementById('ongoingPhds').textContent = summary.ongoingPhds || '0';
                document.getElementById('completedPhds').textContent = summary.completedPhds || '0';
                document.getElementById('avgDuration').textContent = summary.averageDuration || 'N/A';
                
                // Create charts with error handling
                const charts = analytics.charts || {};
                try {
                  createStatusChart(charts.statusDistribution || {});
                  createResearchAreasChart(charts.researchAreas || {});
                  createCompletionTrendsChart(charts.completionTrends || {});
                  createDurationChart(charts.durationDistribution || { labels: [], values: [] });
                } catch (chartError) {
                  console.warn('Chart creation failed:', chartError);
                }
                
                // Load upcoming completions
                loadUpcomingCompletions(analytics.upcomingCompletions || []);
                
                // Show content
                document.getElementById('loadingState').style.display = 'none';
                document.getElementById('mainContent').classList.remove('hidden');
                document.getElementById('mainContent').classList.add('fade-in');
                
                console.log('Analytics loaded successfully');
                
              } catch (error) {
                console.error('Analytics loading failed:', error);
                
                // Show error with helpful buttons
                document.getElementById('loadingState').innerHTML = \`
                  <div class="text-center p-6">
                    <div class="text-red-500 mb-4">
                      <h3 class="font-bold text-lg mb-2">Failed to load analytics</h3>
                      <p class="mb-4">\${error.message}</p>
                    </div>
                    <div class="space-x-2">
                      <button onclick="loadAnalytics()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Try Again
                      </button>
                      <button onclick="createTestDataAndReload()" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        Create Test Data
                      </button>
                      <a href="/dashboard/supervise/phd-simple" class="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                        Debug Page
                      </a>
                    </div>
                  </div>
                \`;
              }
            }
            
            // Helper function to create test data and reload
            async function createTestDataAndReload() {
              try {
                console.log('Creating test data...');
                const response = await fetch('/api/create-test-data', { method: 'POST' });
                const result = await response.json();
                console.log('Test data created:', result);
                
                // Reload analytics after creating test data
                setTimeout(() => {
                  document.getElementById('loadingState').innerHTML = \`
                    <div class="flex justify-center items-center py-12">
                      <div class="loading-spinner"></div>
                      <span class="ml-3 text-gray-600">Loading analytics with new test data...</span>
                    </div>
                  \`;
                  loadAnalytics();
                }, 1000);
                
              } catch (error) {
                console.error('Failed to create test data:', error);
                alert('Failed to create test data: ' + error.message);
              }
            }

            // Chart creation functions
            function createStatusChart(data) {
              const ctx = document.getElementById('statusChart').getContext('2d');
              const hasData = Object.values(data).some(val => val > 0);
              
              if (!hasData) {
                ctx.canvas.parentElement.innerHTML = \`
                  <div class="flex items-center justify-center h-64 text-gray-500">
                    <div class="text-center">
                      <div class="text-4xl mb-2">📊</div>
                      <p>No data available</p>
                    </div>
                  </div>
                \`;
                return;
              }
              
              new Chart(ctx, {
                type: 'doughnut',
                data: {
                  labels: Object.keys(data),
                  datasets: [{
                    data: Object.values(data),
                    backgroundColor: ['#10b981', '#3b82f6', '#ef4444']
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }
              });
            }

            function createResearchAreasChart(data) {
              const ctx = document.getElementById('researchAreasChart').getContext('2d');
              const hasData = Object.keys(data).length > 0 && Object.values(data).some(val => val > 0);
              
              if (!hasData) {
                ctx.canvas.parentElement.innerHTML = \`
                  <div class="flex items-center justify-center h-64 text-gray-500">
                    <div class="text-center">
                      <div class="text-4xl mb-2">🔬</div>
                      <p>No research areas data</p>
                    </div>
                  </div>
                \`;
                return;
              }
              
              new Chart(ctx, {
                type: 'bar',
                data: {
                  labels: Object.keys(data),
                  datasets: [{
                    data: Object.values(data),
                    backgroundColor: '#6366f1'
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                  }
                }
              });
            }

            function createCompletionTrendsChart(data) {
              const ctx = document.getElementById('completionTrendsChart').getContext('2d');
              const hasData = Object.values(data).some(val => val > 0);
              
              if (!hasData) {
                ctx.canvas.parentElement.innerHTML = \`
                  <div class="flex items-center justify-center h-64 text-gray-500">
                    <div class="text-center">
                      <div class="text-4xl mb-2">📈</div>
                      <p>No completion trends data</p>
                    </div>
                  </div>
                \`;
                return;
              }
              
              new Chart(ctx, {
                type: 'line',
                data: {
                  labels: Object.keys(data),
                  datasets: [{
                    label: 'Completions',
                    data: Object.values(data),
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                  }
                }
              });
            }

            function createDurationChart(data) {
              const ctx = document.getElementById('durationChart').getContext('2d');
              const hasData = data.values && data.values.some(val => val > 0);
              
              if (!hasData) {
                ctx.canvas.parentElement.innerHTML = \`
                  <div class="flex items-center justify-center h-64 text-gray-500">
                    <div class="text-center">
                      <div class="text-4xl mb-2">⏱️</div>
                      <p>No duration data</p>
                    </div>
                  </div>
                \`;
                return;
              }
              
              new Chart(ctx, {
                type: 'bar',
                data: {
                  labels: data.labels,
                  datasets: [{
                    data: data.values,
                    backgroundColor: '#f59e0b'
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                  }
                }
              });
            }

            function loadUpcomingCompletions(upcomingCompletions) {
              const container = document.getElementById('upcoming-container');
              
              if (upcomingCompletions.length === 0) {
                container.innerHTML = \`
                  <div class="p-8 text-center text-gray-500">
                    <div class="text-4xl mb-4">📅</div>
                    <p>No PhDs expected to complete in the next 6 months.</p>
                  </div>
                \`;
                return;
              }
              
              container.innerHTML = upcomingCompletions.map(phd => \`
                <div class="p-4 hover:bg-gray-50">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h4 class="font-semibold text-gray-900">\${phd.title}</h4>
                      <p class="text-blue-600 font-medium">\${phd.studentName}</p>
                      <p class="text-sm text-gray-600 mt-1">Research Area: \${phd.researchArea}</p>
                      <p class="text-sm text-orange-600 font-medium mt-1">Expected: \${new Date(phd.expectedEnd).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              \`).join('');
            }

            // Load PhD supervisions function
            async function loadPhdSupervisions() {
              try {
                const response = await fetch('/api/phd-supervision');
                const phdSupervisions = await response.json();
                
                const container = document.getElementById('phd-container');
                
                if (phdSupervisions.length === 0) {
                  container.innerHTML = \`
                    <div class="p-8 text-center text-gray-500">
                      <div class="text-4xl mb-4">🎓</div>
                      <p>No PhD students under supervision. Add your first PhD student to get started.</p>
                    </div>
                  \`;
                  return;
                }
                
                container.innerHTML = phdSupervisions.map(phd => \`
                  <div class="p-6 hover:bg-gray-50">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h3 class="text-lg font-semibold text-gray-900">\${phd.title}</h3>
                          <span class="px-2 py-1 text-xs font-medium rounded-full status-\${phd.status.toLowerCase()}">\${phd.status}</span>
                        </div>
                        <p class="text-blue-600 font-medium mb-3">\${phd.researchArea}</p>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span class="font-medium text-gray-700">Student:</span>
                            <span class="text-gray-600">\${phd.student.name} (\${phd.student.studentId})</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">Department:</span>
                            <span class="text-gray-600">\${phd.student.department || 'N/A'}</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">Start Date:</span>
                            <span class="text-gray-600">\${new Date(phd.startDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">Expected End:</span>
                            <span class="text-gray-600">\${phd.expectedEnd ? new Date(phd.expectedEnd).toLocaleDateString() : 'TBD'}</span>
                          </div>
                        </div>
                      </div>
                      <div class="flex gap-2 ml-4">
                        <button 
                          onclick="editPhd(\${phd.phdId})"
                          class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onclick="deletePhd(\${phd.phdId})"
                          class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                \`).join('');
              } catch (error) {
                console.error('Error loading PhD supervisions:', error);
                document.getElementById('phd-container').innerHTML = \`
                  <div class="p-8 text-center text-red-500">
                    <p>Error loading PhD supervisions. Please try again.</p>
                  </div>
                \`;
              }
            }

            // Add PhD form handler
            document.getElementById('addPhdForm').addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const formData = new FormData(this);
              
              try {
                const response = await fetch('/api/phd-supervision', {
                  method: 'POST',
                  body: formData
                });
                
                if (response.ok) {
                  closeModal('addPhdModal');
                  this.reset();
                  loadPhdSupervisions();
                  alert('PhD student added successfully!');
                } else {
                  const error = await response.json();
                  alert('Error: ' + error.error);
                }
              } catch (error) {
                console.error('Error adding PhD:', error);
                alert('Error adding PhD student. Please try again.');
              }
            });

            // Edit PhD function
            async function editPhd(phdId) {
              try {
                const response = await fetch('/api/phd-supervision');
                const phdSupervisions = await response.json();
                const phd = phdSupervisions.find(p => p.phdId === phdId);
                
                if (phd) {
                  document.getElementById('editPhdId').value = phd.phdId;
                  document.getElementById('editTitle').value = phd.title;
                  document.getElementById('editResearchArea').value = phd.researchArea;
                  document.getElementById('editStudentId').value = phd.studentId;
                  document.getElementById('editStartDate').value = phd.startDate.split('T')[0];
                  document.getElementById('editExpectedEnd').value = phd.expectedEnd ? phd.expectedEnd.split('T')[0] : '';
                  document.getElementById('editStatus').value = phd.status;
                  
                  openModal('editPhdModal');
                }
              } catch (error) {
                console.error('Error loading PhD for edit:', error);
                alert('Error loading PhD details.');
              }
            }

            // Edit PhD form handler
            document.getElementById('editPhdForm').addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const formData = new FormData(this);
              
              try {
                const response = await fetch('/api/phd-supervision', {
                  method: 'PUT',
                  body: formData
                });
                
                if (response.ok) {
                  closeModal('editPhdModal');
                  loadPhdSupervisions();
                  alert('PhD supervision updated successfully!');
                } else {
                  const error = await response.json();
                  alert('Error: ' + error.error);
                }
              } catch (error) {
                console.error('Error updating PhD:', error);
                alert('Error updating PhD supervision. Please try again.');
              }
            });

            // Delete PhD function
            async function deletePhd(phdId) {
              if (confirm('Are you sure you want to delete this PhD supervision?')) {
                try {
                  const response = await fetch(\`/api/phd-supervision?phdId=\${phdId}\`, {
                    method: 'DELETE'
                  });
                  
                  if (response.ok) {
                    loadPhdSupervisions();
                    alert('PhD supervision deleted successfully!');
                  } else {
                    const error = await response.json();
                    alert('Error: ' + error.error);
                  }
                } catch (error) {
                  console.error('Error deleting PhD:', error);
                  alert('Error deleting PhD supervision. Please try again.');
                }
              }
            }
          `
        }} />
      </body>
    </html>
  )
})


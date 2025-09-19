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
        <title>Full Time Fellowship - EduPulse</title>
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
            .status-active { @apply bg-green-100 text-green-800; }
            .status-completed { @apply bg-blue-100 text-blue-800; }
            .status-terminated { @apply bg-red-100 text-red-800; }
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
          <Sidebar currentPath="/dashboard/supervise/fellowship/full-time" />
          <div class="flex-1 flex flex-col overflow-hidden">
            <Header uid={teacherId} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
            <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                  <div>
                    <h1 class="text-2xl font-bold text-gray-900">Full Time Fellowships</h1>
                    <p class="text-gray-600 mt-1">Manage full-time research fellowships</p>
                    <div class="flex gap-4 mt-2">
                      <a 
                        href="/dashboard/supervise/fellowship/part-time"
                        class="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        → View Part Time Fellowships
                      </a>
                    </div>
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
                      onclick="openModal('addFellowshipModal')"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <span>+</span>
                      Add Full Time Fellowship
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                <div id="loadingState" class="flex justify-center items-center py-12">
                  <div class="loading-spinner"></div>
                  <span class="ml-3 text-gray-600">Loading fellowship data...</span>
                </div>

                {/* Main Content */}
                <div id="mainContent" class="hidden space-y-6">
                  {/* Summary Cards */}
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Total Fellowships</p>
                          <p id="totalFellowships" class="text-2xl font-bold text-gray-900">-</p>
                        </div>
                        <div class="p-3 bg-blue-100 rounded-full">
                          <span class="text-blue-600 text-xl">💰</span>
                        </div>
                      </div>
                    </div>

                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Active Fellowships</p>
                          <p id="activeFellowships" class="text-2xl font-bold text-green-600">-</p>
                        </div>
                        <div class="p-3 bg-green-100 rounded-full">
                          <span class="text-green-600 text-xl">✅</span>
                        </div>
                      </div>
                    </div>

                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Monthly Disbursement</p>
                          <p id="monthlyDisbursement" class="text-2xl font-bold text-blue-600">-</p>
                        </div>
                        <div class="p-3 bg-blue-100 rounded-full">
                          <span class="text-blue-600 text-xl">💳</span>
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
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Fellowship Status</h3>
                      <div class="relative h-64">
                        <canvas id="statusChart"></canvas>
                      </div>
                    </div>

                    {/* Amount Distribution */}
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Amount Distribution</h3>
                      <div class="relative h-64">
                        <canvas id="amountChart"></canvas>
                      </div>
                    </div>

                    {/* Monthly Trends */}
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
                      <div class="relative h-64">
                        <canvas id="trendsChart"></canvas>
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

                  {/* Fellowships List */}
                  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div class="p-6 border-b border-gray-200">
                      <h2 class="text-lg font-semibold text-gray-900">Full Time Fellowship Awards</h2>
                    </div>
                    <div id="fellowships-container" class="divide-y divide-gray-200">
                      {/* Fellowships will be loaded here */}
                    </div>
                  </div>

                  {/* Upcoming Expirations */}
                  <div id="upcomingSection" class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div class="p-6 border-b border-gray-200">
                      <h2 class="text-lg font-semibold text-gray-900">Upcoming Expirations</h2>
                      <p class="text-sm text-gray-600">Fellowships ending in the next 3 months</p>
                    </div>
                    <div id="upcoming-container" class="divide-y divide-gray-200">
                      {/* Upcoming expirations will be loaded here */}
                    </div>
                  </div>
                </div>

                {/* Add Fellowship Modal */}
                <div id="addFellowshipModal" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div class="flex justify-between items-center mb-4">
                      <h3 class="text-lg font-semibold text-gray-900">Add Full Time Fellowship</h3>
                      <button onclick="closeModal('addFellowshipModal')" class="text-gray-400 hover:text-gray-600">
                        <span class="text-xl">×</span>
                      </button>
                    </div>
                    <form id="addFellowshipForm" class="space-y-4">
                      <input type="hidden" name="type" value="Full Time" />
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
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fellowship Amount (₹)</label>
                        <input 
                          type="number" 
                          name="amount" 
                          required
                          min="0"
                          step="0.01"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter monthly amount"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                        <input 
                          type="number" 
                          name="duration" 
                          required
                          min="1"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Duration in months"
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
                        <label class="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                        <input 
                          type="date" 
                          name="endDate"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                          name="status"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="Terminated">Terminated</option>
                        </select>
                      </div>
                      <div class="flex gap-3 pt-4">
                        <button 
                          type="submit"
                          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add Fellowship
                        </button>
                        <button 
                          type="button"
                          onclick="closeModal('addFellowshipModal')"
                          class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Edit Fellowship Modal */}
                <div id="editFellowshipModal" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div class="flex justify-between items-center mb-4">
                      <h3 class="text-lg font-semibold text-gray-900">Edit Full Time Fellowship</h3>
                      <button onclick="closeModal('editFellowshipModal')" class="text-gray-400 hover:text-gray-600">
                        <span class="text-xl">×</span>
                      </button>
                    </div>
                    <form id="editFellowshipForm" class="space-y-4">
                      <input type="hidden" name="fellowshipId" id="editFellowshipId" />
                      <input type="hidden" name="type" value="Full Time" />
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
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fellowship Amount (₹)</label>
                        <input 
                          type="number" 
                          name="amount" 
                          id="editAmount"
                          required
                          min="0"
                          step="0.01"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                        <input 
                          type="number" 
                          name="duration" 
                          id="editDuration"
                          required
                          min="1"
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
                        <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input 
                          type="date" 
                          name="endDate"
                          id="editEndDate"
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
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="Terminated">Terminated</option>
                        </select>
                      </div>
                      <div class="flex gap-3 pt-4">
                        <button 
                          type="submit"
                          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Update Fellowship
                        </button>
                        <button 
                          type="button"
                          onclick="closeModal('editFellowshipModal')"
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

            // Load fellowships and analytics on page load
            document.addEventListener('DOMContentLoaded', function() {
              console.log('Full-time fellowship page loaded, starting analytics...');
              loadAnalytics();
              loadFellowships();
            });

            // Refresh button functionality
            document.getElementById('refreshBtn').addEventListener('click', function() {
              console.log('Refresh button clicked');
              document.getElementById('loadingState').style.display = 'block';
              document.getElementById('mainContent').classList.add('hidden');
              loadAnalytics();
              loadFellowships();
            });

            // Load analytics function
            async function loadAnalytics() {
              console.log('Loading full-time fellowship analytics...');
              
              try {
                const response = await fetch('/api/fellowship-analytics?type=Full Time');
                console.log('Fellowship analytics response status:', response.status);
                
                if (!response.ok) {
                  throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const analytics = await response.json();
                console.log('Fellowship analytics data:', analytics);
                
                // Check for API error
                if (analytics.error) {
                  throw new Error(analytics.error);
                }
                
                // Update summary cards with fallbacks
                const summary = analytics.summary || {};
                document.getElementById('totalFellowships').textContent = summary.totalFellowships || '0';
                document.getElementById('activeFellowships').textContent = summary.activeFellowships || '0';
                document.getElementById('monthlyDisbursement').textContent = '₹' + (summary.monthlyDisbursement || '0');
                document.getElementById('avgDuration').textContent = summary.averageDuration || 'N/A';
                
                // Create charts with error handling
                const charts = analytics.charts || {};
                try {
                  createStatusChart(charts.statusDistribution || {});
                  createAmountChart(charts.amountRanges || {});
                  createTrendsChart(charts.monthlyTrends || {});
                  createDurationChart(charts.durationDistribution || { labels: [], values: [] });
                } catch (chartError) {
                  console.warn('Chart creation failed:', chartError);
                }
                
                // Load upcoming expirations
                loadUpcomingExpirations(analytics.upcomingExpirations || []);
                
                // Show content
                document.getElementById('loadingState').style.display = 'none';
                document.getElementById('mainContent').classList.remove('hidden');
                document.getElementById('mainContent').classList.add('fade-in');
                
                console.log('Full-time fellowship analytics loaded successfully');
                
              } catch (error) {
                console.error('Fellowship analytics loading failed:', error);
                
                // Show error with helpful buttons
                document.getElementById('loadingState').innerHTML = \`
                  <div class="text-center p-6">
                    <div class="text-red-500 mb-4">
                      <h3 class="font-bold text-lg mb-2">Failed to load fellowship analytics</h3>
                      <p class="mb-4">\${error.message}</p>
                    </div>
                    <div class="space-x-2">
                      <button onclick="loadAnalytics()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Try Again
                      </button>
                      <button onclick="createTestDataAndReload()" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        Create Test Data
                      </button>
                      <a href="/dashboard/test-api" class="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                        Debug APIs
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

            function createAmountChart(data) {
              const ctx = document.getElementById('amountChart').getContext('2d');
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

            function createTrendsChart(data) {
              const ctx = document.getElementById('trendsChart').getContext('2d');
              new Chart(ctx, {
                type: 'line',
                data: {
                  labels: Object.keys(data),
                  datasets: [{
                    label: 'New Fellowships',
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

            function loadUpcomingExpirations(upcomingExpirations) {
              const container = document.getElementById('upcoming-container');
              
              if (upcomingExpirations.length === 0) {
                container.innerHTML = \`
                  <div class="p-8 text-center text-gray-500">
                    <div class="text-4xl mb-4">📅</div>
                    <p>No fellowships expiring in the next 3 months.</p>
                  </div>
                \`;
                return;
              }
              
              container.innerHTML = upcomingExpirations.map(fellowship => \`
                <div class="p-4 hover:bg-gray-50">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h4 class="font-semibold text-gray-900">\${fellowship.studentName}</h4>
                      <p class="text-blue-600 font-medium">₹\${Number(fellowship.amount).toLocaleString('en-IN')} / month</p>
                      <p class="text-sm text-gray-600 mt-1">Duration: \${fellowship.duration} months</p>
                      <p class="text-sm text-orange-600 font-medium mt-1">Expires: \${new Date(fellowship.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              \`).join('');
            }

            // Load fellowships function
            async function loadFellowships() {
              try {
                const response = await fetch('/api/fellowships?type=Full Time');
                const fellowships = await response.json();
                
                const container = document.getElementById('fellowships-container');
                
                if (fellowships.length === 0) {
                  container.innerHTML = \`
                    <div class="p-8 text-center text-gray-500">
                      <div class="text-4xl mb-4">💰</div>
                      <p>No full-time fellowships found. Add your first fellowship to get started.</p>
                    </div>
                  \`;
                  return;
                }
                
                container.innerHTML = fellowships.map(fellowship => \`
                  <div class="p-6 hover:bg-gray-50">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h3 class="text-lg font-semibold text-gray-900">Full Time Fellowship</h3>
                          <span class="px-2 py-1 text-xs font-medium rounded-full status-\${fellowship.status.toLowerCase()}">\${fellowship.status}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span class="font-medium text-gray-700">Student:</span>
                            <span class="text-gray-600">\${fellowship.student.name} (\${fellowship.student.studentId})</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">Department:</span>
                            <span class="text-gray-600">\${fellowship.student.department || 'N/A'}</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">Amount:</span>
                            <span class="text-gray-600 font-semibold">₹\${fellowship.amount.toLocaleString()}/month</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">Duration:</span>
                            <span class="text-gray-600">\${fellowship.duration} months</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">Start Date:</span>
                            <span class="text-gray-600">\${new Date(fellowship.startDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">End Date:</span>
                            <span class="text-gray-600">\${fellowship.endDate ? new Date(fellowship.endDate).toLocaleDateString() : 'Ongoing'}</span>
                          </div>
                        </div>
                        <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div class="text-sm">
                            <span class="font-medium text-green-800">Total Fellowship Value:</span>
                            <span class="text-green-700 font-semibold">₹\${(fellowship.amount * fellowship.duration).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div class="flex gap-2 ml-4">
                        <button 
                          onclick="editFellowship(\${fellowship.fellowshipId})"
                          class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onclick="deleteFellowship(\${fellowship.fellowshipId})"
                          class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                \`).join('');
              } catch (error) {
                console.error('Error loading fellowships:', error);
                document.getElementById('fellowships-container').innerHTML = \`
                  <div class="p-8 text-center text-red-500">
                    <p>Error loading fellowships. Please try again.</p>
                  </div>
                \`;
              }
            }

            // Add fellowship form handler
            document.getElementById('addFellowshipForm').addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const formData = new FormData(this);
              
              try {
                const response = await fetch('/api/fellowships', {
                  method: 'POST',
                  body: formData
                });
                
                if (response.ok) {
                  closeModal('addFellowshipModal');
                  this.reset();
                  loadFellowships();
                  alert('Fellowship added successfully!');
                } else {
                  const error = await response.json();
                  alert('Error: ' + error.error);
                }
              } catch (error) {
                console.error('Error adding fellowship:', error);
                alert('Error adding fellowship. Please try again.');
              }
            });

            // Edit fellowship function
            async function editFellowship(fellowshipId) {
              try {
                const response = await fetch('/api/fellowships?type=Full Time');
                const fellowships = await response.json();
                const fellowship = fellowships.find(f => f.fellowshipId === fellowshipId);
                
                if (fellowship) {
                  document.getElementById('editFellowshipId').value = fellowship.fellowshipId;
                  document.getElementById('editStudentId').value = fellowship.studentId;
                  document.getElementById('editAmount').value = fellowship.amount;
                  document.getElementById('editDuration').value = fellowship.duration;
                  document.getElementById('editStartDate').value = fellowship.startDate.split('T')[0];
                  document.getElementById('editEndDate').value = fellowship.endDate ? fellowship.endDate.split('T')[0] : '';
                  document.getElementById('editStatus').value = fellowship.status;
                  
                  openModal('editFellowshipModal');
                }
              } catch (error) {
                console.error('Error loading fellowship for edit:', error);
                alert('Error loading fellowship details.');
              }
            }

            // Edit fellowship form handler
            document.getElementById('editFellowshipForm').addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const formData = new FormData(this);
              
              try {
                const response = await fetch('/api/fellowships', {
                  method: 'PUT',
                  body: formData
                });
                
                if (response.ok) {
                  closeModal('editFellowshipModal');
                  loadFellowships();
                  alert('Fellowship updated successfully!');
                } else {
                  const error = await response.json();
                  alert('Error: ' + error.error);
                }
              } catch (error) {
                console.error('Error updating fellowship:', error);
                alert('Error updating fellowship. Please try again.');
              }
            });

            // Delete fellowship function
            async function deleteFellowship(fellowshipId) {
              if (confirm('Are you sure you want to delete this fellowship?')) {
                try {
                  const response = await fetch(\`/api/fellowships?fellowshipId=\${fellowshipId}\`, {
                    method: 'DELETE'
                  });
                  
                  if (response.ok) {
                    loadFellowships();
                    alert('Fellowship deleted successfully!');
                  } else {
                    const error = await response.json();
                    alert('Error: ' + error.error);
                  }
                } catch (error) {
                  console.error('Error deleting fellowship:', error);
                  alert('Error deleting fellowship. Please try again.');
                }
              }
            }
          `
        }} />
      </body>
    </html>
  )
})



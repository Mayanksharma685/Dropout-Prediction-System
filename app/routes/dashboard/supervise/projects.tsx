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
        <title>Project Supervision Analytics - EduPulse</title>
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
            .status-suspended { @apply bg-red-100 text-red-800; }
            .loading-spinner {
              border: 2px solid #f3f3f3;
              border-top: 2px solid #3498db;
              border-radius: 50%;
              width: 20px;
              height: 20px;
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
        <div class="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <Sidebar currentPath="/dashboard/supervise/projects" />
          <div class="flex-1 flex flex-col overflow-hidden">
            <Header uid={teacherId} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
            <main class="flex-1 overflow-x-hidden overflow-y-auto">
              <div class="p-6">
                {/* Header Section */}
                <div class="bg-gradient-to-r from-gray-200 via-gray-200 to-gray-200 rounded-2xl p-8 mb-8 text-black">
                  <div class="flex justify-between items-center">
                    <div>
                      <h1 class="text-3xl font-bold mb-2 text-black">Project Supervision Analytics</h1>
                      <p class="text-black">Comprehensive insights into your project supervision activities</p>
                      <div class="flex items-center gap-2 mt-4 text-black">
                        <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span class="text-sm text-black">Live Analytics • Last updated: <span id="last-updated"></span></span>
                      </div>
                    </div>
                    <div class="text-right">
                      <button 
                        onclick="refreshData()"
                        id="refresh-btn"
                        class="px-4 py-2 bg-white/20 backdrop-blur-sm text-black rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center gap-2 mb-3"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Refresh
                      </button>
                      <button 
                        onclick="openModal('addProjectModal')"
                        class="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-semibold"
                      >
                        <span class="text-xl">+</span>
                        Add New Project
                      </button>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                <div id="loading-state" class="text-center py-12">
                  <div class="loading-spinner mx-auto mb-4"></div>
                  <p class="text-gray-600">Loading project analytics...</p>
                </div>

                {/* Analytics Dashboard */}
                <div id="analytics-dashboard" class="hidden">
                  {/* Summary Cards */}
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Total Projects</p>
                          <p id="total-projects" class="text-3xl font-bold text-gray-900">-</p>
                        </div>
                        <div class="p-3 bg-blue-100 rounded-lg">
                          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Active Projects</p>
                          <p id="active-projects" class="text-3xl font-bold text-green-600">-</p>
                        </div>
                        <div class="p-3 bg-green-100 rounded-lg">
                          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Completion Rate</p>
                          <p id="completion-rate" class="text-3xl font-bold text-blue-600">-%</p>
                        </div>
                        <div class="p-3 bg-blue-100 rounded-lg">
                          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Avg Duration</p>
                          <p id="avg-duration" class="text-3xl font-bold text-purple-600">- days</p>
                        </div>
                        <div class="p-3 bg-purple-100 rounded-lg">
                          <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Status Distribution Chart */}
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Project Status Distribution</h3>
                      <div class="relative h-64">
                        <canvas id="statusChart"></canvas>
                      </div>
                    </div>

                    {/* Monthly Trends Chart */}
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Monthly Project Trends</h3>
                      <div class="relative h-64">
                        <canvas id="trendsChart"></canvas>
                      </div>
                    </div>

                    {/* Department Distribution Chart */}
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
                      <div class="relative h-64">
                        <canvas id="departmentChart"></canvas>
                      </div>
                    </div>

                    {/* Duration Analysis Chart */}
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Project Duration Analysis</h3>
                      <div class="relative h-64">
                        <canvas id="durationChart"></canvas>
                      </div>
                    </div>
                  </div>

                  {/* Activity Sections */}
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Recent Activity */}
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                      <div id="recent-activity" class="space-y-3">
                        {/* Activity items will be loaded here */}
                      </div>
                    </div>

                    {/* Upcoming Deadlines */}
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
                      <div id="upcoming-deadlines" class="space-y-3">
                        {/* Deadline items will be loaded here */}
                      </div>
                    </div>
                  </div>

                  {/* Projects List */}
                  <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div class="p-6 border-b border-gray-200">
                      <div class="flex justify-between items-center">
                        <h2 class="text-lg font-semibold text-gray-900">All Projects</h2>
                        <div class="flex gap-2">
                          <select id="status-filter" class="px-3 py-2 border border-gray-300 rounded-md text-sm">
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                            <option value="Suspended">Suspended</option>
                          </select>
                          <input 
                            type="text" 
                            id="search-projects" 
                            placeholder="Search projects..." 
                            class="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
                          />
                        </div>
                      </div>
                    </div>
                    <div id="projects-container" class="divide-y divide-gray-200">
                      {/* Projects will be loaded here */}
                    </div>
                  </div>
                </div>

                {/* Add Project Modal */}
                <div id="addProjectModal" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div class="flex justify-between items-center mb-4">
                      <h3 class="text-lg font-semibold text-gray-900">Add New Project</h3>
                      <button onclick="closeModal('addProjectModal')" class="text-gray-400 hover:text-gray-600">
                        <span class="text-xl">×</span>
                      </button>
                    </div>
                    <form id="addProjectForm" class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                        <input 
                          type="text" 
                          name="title" 
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter project title"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                          name="description" 
                          rows="3"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Project description (optional)"
                        ></textarea>
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
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                      <div class="flex gap-3 pt-4">
                        <button 
                          type="submit"
                          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add Project
                        </button>
                        <button 
                          type="button"
                          onclick="closeModal('addProjectModal')"
                          class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Edit Project Modal */}
                <div id="editProjectModal" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div class="flex justify-between items-center mb-4">
                      <h3 class="text-lg font-semibold text-gray-900">Edit Project</h3>
                      <button onclick="closeModal('editProjectModal')" class="text-gray-400 hover:text-gray-600">
                        <span class="text-xl">×</span>
                      </button>
                    </div>
                    <form id="editProjectForm" class="space-y-4">
                      <input type="hidden" name="projectId" id="editProjectId" />
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                        <input 
                          type="text" 
                          name="title" 
                          id="editTitle"
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                          name="description" 
                          id="editDescription"
                          rows="3"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
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
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                      <div class="flex gap-3 pt-4">
                        <button 
                          type="submit"
                          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Update Project
                        </button>
                        <button 
                          type="button"
                          onclick="closeModal('editProjectModal')"
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

        <script>
          {`
            // Global variables for charts
            let statusChart, trendsChart, departmentChart, durationChart;
            let allProjects = [];
            let filteredProjects = [];

            // Modal functions
            function openModal(modalId) {
              document.getElementById(modalId).classList.add('active');
            }

            function closeModal(modalId) {
              document.getElementById(modalId).classList.remove('active');
            }

            // Load all data on page load
            document.addEventListener('DOMContentLoaded', function() {
              loadAnalytics();
              updateLastUpdated();
              
              // Setup event listeners
              document.getElementById('status-filter').addEventListener('change', filterProjects);
              document.getElementById('search-projects').addEventListener('input', filterProjects);
            });

            // Update last updated timestamp
            function updateLastUpdated() {
              document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
            }

            // Refresh all data
            async function refreshData() {
              const refreshBtn = document.getElementById('refresh-btn');
              refreshBtn.innerHTML = '<div class="loading-spinner"></div> Refreshing...';
              refreshBtn.disabled = true;
              
              await loadAnalytics();
              updateLastUpdated();
              
              refreshBtn.innerHTML = \`
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
              \`;
              refreshBtn.disabled = false;
            }

            // Load analytics data
            async function loadAnalytics() {
              try {
                // Show loading state
                document.getElementById('loading-state').classList.remove('hidden');
                document.getElementById('analytics-dashboard').classList.add('hidden');

                // Fetch analytics and projects data
                const [analyticsResponse, projectsResponse] = await Promise.all([
                  fetch('/api/projects-analytics'),
                  fetch('/api/projects')
                ]);

                const analytics = await analyticsResponse.json();
                const projects = await projectsResponse.json();

                allProjects = projects;
                filteredProjects = projects;

                // Update summary cards
                updateSummaryCards(analytics.summary);
                
                // Create charts
                createCharts(analytics);
                
                // Update activity sections
                updateRecentActivity(analytics.activity.recent);
                updateUpcomingDeadlines(analytics.activity.upcomingDeadlines);
                
                // Load projects list
                displayProjects(filteredProjects);

                // Hide loading state and show dashboard
                document.getElementById('loading-state').classList.add('hidden');
                document.getElementById('analytics-dashboard').classList.remove('hidden');
                document.getElementById('analytics-dashboard').classList.add('fade-in');

              } catch (error) {
                console.error('Error loading analytics:', error);
                document.getElementById('loading-state').innerHTML = \`
                  <div class="text-center py-12">
                    <div class="text-red-500 mb-4">
                      <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <p class="text-red-600 mb-4">Error loading analytics data</p>
                    <button onclick="loadAnalytics()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Try Again
                    </button>
                  </div>
                \`;
              }
            }

            // Update summary cards
            function updateSummaryCards(summary) {
              document.getElementById('total-projects').textContent = summary.totalProjects;
              document.getElementById('active-projects').textContent = summary.activeProjects;
              document.getElementById('completion-rate').textContent = summary.completionRate + '%';
              document.getElementById('avg-duration').textContent = summary.avgDuration + ' days';
            }

            // Create charts
            function createCharts(analytics) {
              // Destroy existing charts
              if (statusChart) statusChart.destroy();
              if (trendsChart) trendsChart.destroy();
              if (departmentChart) departmentChart.destroy();
              if (durationChart) durationChart.destroy();

              // Status Distribution Chart
              const statusCtx = document.getElementById('statusChart').getContext('2d');
              statusChart = new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                  labels: Object.keys(analytics.distributions.status),
                  datasets: [{
                    data: Object.values(analytics.distributions.status),
                    backgroundColor: ['#10B981', '#3B82F6', '#EF4444'],
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

              // Monthly Trends Chart
              const trendsCtx = document.getElementById('trendsChart').getContext('2d');
              trendsChart = new Chart(trendsCtx, {
                type: 'line',
                data: {
                  labels: analytics.trends.monthly.map(item => item.month),
                  datasets: [{
                    label: 'Started',
                    data: analytics.trends.monthly.map(item => item.started),
                    borderColor: '#3B82F6',
                    backgroundColor: '#3B82F6',
                    tension: 0.4
                  }, {
                    label: 'Completed',
                    data: analytics.trends.monthly.map(item => item.completed),
                    borderColor: '#10B981',
                    backgroundColor: '#10B981',
                    tension: 0.4
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }
              });

              // Department Distribution Chart
              const departmentCtx = document.getElementById('departmentChart').getContext('2d');
              departmentChart = new Chart(departmentCtx, {
                type: 'bar',
                data: {
                  labels: Object.keys(analytics.distributions.departments),
                  datasets: [{
                    label: 'Projects',
                    data: Object.values(analytics.distributions.departments),
                    backgroundColor: '#8B5CF6',
                    borderColor: '#8B5CF6',
                    borderWidth: 1
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }
              });

              // Duration Analysis Chart
              const durationCtx = document.getElementById('durationChart').getContext('2d');
              durationChart = new Chart(durationCtx, {
                type: 'bar',
                data: {
                  labels: Object.keys(analytics.distributions.duration),
                  datasets: [{
                    label: 'Projects',
                    data: Object.values(analytics.distributions.duration),
                    backgroundColor: '#F59E0B',
                    borderColor: '#F59E0B',
                    borderWidth: 1
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }
              });
            }

            // Update recent activity
            function updateRecentActivity(activities) {
              const container = document.getElementById('recent-activity');
              
              if (activities.length === 0) {
                container.innerHTML = \`
                  <div class="text-center py-8 text-gray-500">
                    <div class="text-3xl mb-2">📋</div>
                    <p>No recent activity</p>
                  </div>
                \`;
                return;
              }

              container.innerHTML = activities.map(activity => \`
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center \${
                    activity.action === 'Started' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }">
                    \${activity.action === 'Started' ? '🚀' : '✅'}
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">\${activity.title}</p>
                    <p class="text-xs text-gray-600">\${activity.studentName} • \${activity.action}</p>
                  </div>
                  <div class="text-xs text-gray-500">
                    \${new Date(activity.date).toLocaleDateString()}
                  </div>
                </div>
              \`).join('');
            }

            // Update upcoming deadlines
            function updateUpcomingDeadlines(deadlines) {
              const container = document.getElementById('upcoming-deadlines');
              
              if (deadlines.length === 0) {
                container.innerHTML = \`
                  <div class="text-center py-8 text-gray-500">
                    <div class="text-3xl mb-2">📅</div>
                    <p>No upcoming deadlines</p>
                  </div>
                \`;
                return;
              }

              container.innerHTML = deadlines.map(deadline => \`
                <div class="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div class="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-sm font-bold">
                    \${deadline.daysRemaining}
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">\${deadline.title}</p>
                    <p class="text-xs text-gray-600">\${deadline.studentName}</p>
                  </div>
                  <div class="text-xs text-yellow-600 font-medium">
                    \${deadline.daysRemaining} days left
                  </div>
                </div>
              \`).join('');
            }

            // Display projects with filtering
            function displayProjects(projects) {
              const container = document.getElementById('projects-container');
              
              if (projects.length === 0) {
                container.innerHTML = \`
                  <div class="p-8 text-center text-gray-500">
                    <div class="text-4xl mb-4">📋</div>
                    <p>No projects found matching your criteria.</p>
                  </div>
                \`;
                return;
              }
              
              container.innerHTML = projects.map(project => \`
                <div class="p-6 hover:bg-gray-50 transition-colors">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <h3 class="text-lg font-semibold text-gray-900">\${project.title}</h3>
                        <span class="px-2 py-1 text-xs font-medium rounded-full status-\${project.status.toLowerCase()}">\${project.status}</span>
                      </div>
                      \${project.description ? \`<p class="text-gray-600 mb-3">\${project.description}</p>\` : ''}
                      <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span class="font-medium text-gray-700">Student:</span>
                          <span class="text-gray-600">\${project.student.name} (\${project.student.studentId})</span>
                        </div>
                        <div>
                          <span class="font-medium text-gray-700">Department:</span>
                          <span class="text-gray-600">\${project.student.department || 'N/A'}</span>
                        </div>
                        <div>
                          <span class="font-medium text-gray-700">Start Date:</span>
                          <span class="text-gray-600">\${new Date(project.startDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span class="font-medium text-gray-700">End Date:</span>
                          <span class="text-gray-600">\${project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex gap-2 ml-4">
                      <button 
                        onclick="editProject(\${project.projectId})"
                        class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onclick="deleteProject(\${project.projectId})"
                        class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              \`).join('');
            }

            // Filter projects
            function filterProjects() {
              const statusFilter = document.getElementById('status-filter').value;
              const searchTerm = document.getElementById('search-projects').value.toLowerCase();
              
              filteredProjects = allProjects.filter(project => {
                const matchesStatus = !statusFilter || project.status === statusFilter;
                const matchesSearch = !searchTerm || 
                  project.title.toLowerCase().includes(searchTerm) ||
                  project.student.name.toLowerCase().includes(searchTerm) ||
                  (project.description && project.description.toLowerCase().includes(searchTerm));
                
                return matchesStatus && matchesSearch;
              });
              
              displayProjects(filteredProjects);
            }

            // Add project form handler
            document.addEventListener('DOMContentLoaded', function() {
              document.getElementById('addProjectForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                
                try {
                  const response = await fetch('/api/projects', {
                    method: 'POST',
                    body: formData
                  });
                  
                  if (response.ok) {
                    closeModal('addProjectModal');
                    this.reset();
                    await loadAnalytics(); // Reload all data including analytics
                    showNotification('Project added successfully!', 'success');
                  } else {
                    const error = await response.json();
                    showNotification('Error: ' + error.error, 'error');
                  }
                } catch (error) {
                  console.error('Error adding project:', error);
                  showNotification('Error adding project. Please try again.', 'error');
                }
              });

              // Edit project form handler
              document.getElementById('editProjectForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                
                try {
                  const response = await fetch('/api/projects', {
                    method: 'PUT',
                    body: formData
                  });
                  
                  if (response.ok) {
                    closeModal('editProjectModal');
                    await loadAnalytics(); // Reload all data including analytics
                    showNotification('Project updated successfully!', 'success');
                  } else {
                    const error = await response.json();
                    showNotification('Error: ' + error.error, 'error');
                  }
                } catch (error) {
                  console.error('Error updating project:', error);
                  showNotification('Error updating project. Please try again.', 'error');
                }
              });
            });

            // Edit project function
            async function editProject(projectId) {
              try {
                const project = allProjects.find(p => p.projectId === projectId);
                
                if (project) {
                  document.getElementById('editProjectId').value = project.projectId;
                  document.getElementById('editTitle').value = project.title;
                  document.getElementById('editDescription').value = project.description || '';
                  document.getElementById('editStudentId').value = project.studentId;
                  document.getElementById('editStartDate').value = project.startDate.split('T')[0];
                  document.getElementById('editEndDate').value = project.endDate ? project.endDate.split('T')[0] : '';
                  document.getElementById('editStatus').value = project.status;
                  
                  openModal('editProjectModal');
                }
              } catch (error) {
                console.error('Error loading project for edit:', error);
                showNotification('Error loading project details.', 'error');
              }
            }

            // Delete project function
            async function deleteProject(projectId) {
              if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                try {
                  const response = await fetch(\`/api/projects?projectId=\${projectId}\`, {
                    method: 'DELETE'
                  });
                  
                  if (response.ok) {
                    await loadAnalytics(); // Reload all data including analytics
                    showNotification('Project deleted successfully!', 'success');
                  } else {
                    const error = await response.json();
                    showNotification('Error: ' + error.error, 'error');
                  }
                } catch (error) {
                  console.error('Error deleting project:', error);
                  showNotification('Error deleting project. Please try again.', 'error');
                }
              }
            }

            // Show notification function
            function showNotification(message, type = 'info') {
              // Create notification element
              const notification = document.createElement('div');
              notification.className = \`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full \${
                type === 'success' ? 'bg-green-500 text-white' :
                type === 'error' ? 'bg-red-500 text-white' :
                'bg-blue-500 text-white'
              }\`;
              notification.textContent = message;
              
              document.body.appendChild(notification);
              
              // Animate in
              setTimeout(() => {
                notification.classList.remove('translate-x-full');
              }, 100);
              
              // Remove after 5 seconds
              setTimeout(() => {
                notification.classList.add('translate-x-full');
                setTimeout(() => {
                  document.body.removeChild(notification);
                }, 300);
              }, 5000);
            }
          `}
        </script>
      </body>
    </html>
  )
})


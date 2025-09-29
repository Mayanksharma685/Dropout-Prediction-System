interface MentalHealthSummaryProps {
  teacherId: string
}

export default function MentalHealthSummary({ teacherId }: MentalHealthSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Mental Health Overview</h3>
        <a 
          href="/dashboard/mental-health" 
          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
        >
          View Details →
        </a>
      </div>
      
      <div id="mentalHealthLoading" className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="mt-2 text-sm text-gray-600">Loading mental health data...</p>
      </div>
      
      <div id="mentalHealthContent" className="hidden">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Avg Wellness</p>
                <p id="avgWellnessScore" className="text-xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">High Risk</p>
                <p id="highRiskCount" className="text-xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Risk Distribution */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Risk Level Distribution</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Critical</span>
              </div>
              <span id="criticalCount" className="text-sm font-medium text-gray-900">-</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">High</span>
              </div>
              <span id="highCount" className="text-sm font-medium text-gray-900">-</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Medium</span>
              </div>
              <span id="mediumCount" className="text-sm font-medium text-gray-900">-</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Low</span>
              </div>
              <span id="lowCount" className="text-sm font-medium text-gray-900">-</span>
            </div>
          </div>
        </div>
        
        {/* Recent Activities */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Mental Health Activities</h4>
          <div id="recentMentalHealthActivities" className="space-y-2">
            {/* Dynamic content */}
          </div>
        </div>
      </div>
      
      <div id="mentalHealthError" className="hidden text-center py-8">
        <div className="text-red-500 mb-2">
          <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">Failed to load mental health data</p>
      </div>
    </div>
  )
}

// Add the JavaScript functionality
const mentalHealthScript = `
async function loadMentalHealthSummary() {
  try {
    const response = await fetch('/api/mental-health-analytics');
    if (!response.ok) throw new Error('Failed to fetch');
    
    const data = await response.json();
    
    // Update summary cards
    document.getElementById('avgWellnessScore').textContent = data.summary.avgOverallWellness + '/10';
    document.getElementById('highRiskCount').textContent = 
      (data.distributions.riskLevels.high + data.distributions.riskLevels.critical);
    
    // Update risk distribution
    document.getElementById('criticalCount').textContent = data.distributions.riskLevels.critical;
    document.getElementById('highCount').textContent = data.distributions.riskLevels.high;
    document.getElementById('mediumCount').textContent = data.distributions.riskLevels.medium;
    document.getElementById('lowCount').textContent = data.distributions.riskLevels.low;
    
    // Update recent activities
    const activitiesContainer = document.getElementById('recentMentalHealthActivities');
    activitiesContainer.innerHTML = '';
    
    data.recentActivities.slice(0, 3).forEach(activity => {
      const div = document.createElement('div');
      div.className = 'flex items-center text-sm text-gray-600';
      
      let icon = '';
      switch (activity.type) {
        case 'assessment': icon = '📊'; break;
        case 'appointment': icon = '🗓️'; break;
        case 'support': icon = '🎫'; break;
      }
      
      div.innerHTML = \`
        <span class="mr-2">\${icon}</span>
        <span class="flex-1">\${activity.studentName}: \${activity.details.substring(0, 40)}...</span>
      \`;
      
      activitiesContainer.appendChild(div);
    });
    
    // Show content, hide loading
    document.getElementById('mentalHealthLoading').classList.add('hidden');
    document.getElementById('mentalHealthContent').classList.remove('hidden');
    
  } catch (error) {
    console.error('Error loading mental health summary:', error);
    document.getElementById('mentalHealthLoading').classList.add('hidden');
    document.getElementById('mentalHealthError').classList.remove('hidden');
  }
}

// Load data when component mounts
if (typeof window !== 'undefined') {
  loadMentalHealthSummary();
}
`

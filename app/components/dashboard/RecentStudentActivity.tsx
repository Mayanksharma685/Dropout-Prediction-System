import { FC } from 'hono/jsx'

interface ActivityItem {
  id: string
  studentName: string
  activity: string
  type: 'achievement' | 'attendance' | 'test' | 'fee' | 'backlog' | 'risk'
  value?: string | number
  timestamp: string
  priority: 'high' | 'medium' | 'low'
}

interface RecentStudentActivityProps {
  activities: ActivityItem[]
}

const RecentStudentActivity: FC<RecentStudentActivityProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    const icons = {
      achievement: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>`,
      attendance: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>`,
      test: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
      </svg>`,
      fee: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
      </svg>`,
      backlog: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>`,
      risk: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
      </svg>`
    }
    return icons[type as keyof typeof icons] || icons.achievement
  }

  const getActivityColor = (type: string, priority: string) => {
    if (priority === 'high') return 'text-red-600 bg-red-50 border-red-200'
    if (priority === 'medium') return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    
    const colors = {
      achievement: 'text-green-600 bg-green-50 border-green-200',
      attendance: 'text-blue-600 bg-blue-50 border-blue-200',
      test: 'text-purple-600 bg-purple-50 border-purple-200',
      fee: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      backlog: 'text-orange-600 bg-orange-50 border-orange-200',
      risk: 'text-red-600 bg-red-50 border-red-200'
    }
    return colors[type as keyof typeof colors] || colors.achievement
  }

  const getPriorityBadge = (priority: string) => {
    const badges = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    }
    return badges[priority as keyof typeof badges] || badges.low
  }

  return (
    <div class="bg-white rounded-xl border shadow-sm p-6 w-full">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-slate-800">Recent Student Activity</h3>
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span class="text-xs text-slate-500">Live Updates</span>
        </div>
      </div>

      <div class="space-y-3 max-h-80 overflow-y-auto">
        {activities.length === 0 ? (
          <div class="text-center py-8">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <p class="text-slate-500">No recent activity to display</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} class="flex items-start space-x-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors">
              <div class={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${getActivityColor(activity.type, activity.priority)}`}>
                <div class="scale-75" dangerouslySetInnerHTML={{ __html: getActivityIcon(activity.type) }} />
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-slate-900 truncate">
                    {activity.studentName}
                  </p>
                  <div class="flex items-center space-x-2">
                    {activity.priority !== 'low' && (
                      <span class={`px-1.5 py-0.5 text-xs font-medium rounded-full border ${getPriorityBadge(activity.priority)}`}>
                        {activity.priority}
                      </span>
                    )}
                    <span class="text-xs text-slate-500">{activity.timestamp}</span>
                  </div>
                </div>
                
                <p class="text-xs text-slate-600 mt-1">
                  {activity.activity}
                  {activity.value && (
                    <span class="font-medium text-slate-800 ml-1">
                      {activity.value}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {activities.length > 0 && (
        <div class="mt-6 pt-4 border-t border-slate-100">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 text-xs text-slate-500">
              <div class="flex items-center space-x-1">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Achievements</span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Attendance</span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Tests</span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Alerts</span>
              </div>
            </div>
            <button class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              View All →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecentStudentActivity

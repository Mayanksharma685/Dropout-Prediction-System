type KPI = { 
  label: string; 
  value: string | number; 
  hint?: string;
  icon?: string;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

export default function KPIs(props: { items: KPI[] }) {
  const { items } = props
  
  const getIconSVG = (iconName: string) => {
    const icons: Record<string, string> = {
      students: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
      </svg>`,
      risk: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
      </svg>`,
      backlog: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>`,
      fees: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
      </svg>`
    }
    return icons[iconName] || ''
  }
  
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return `<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17l9.2-9.2M17 17V7H7"></path>
        </svg>`
      case 'down':
        return `<svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 7l-9.2 9.2M7 7v10h10"></path>
        </svg>`
      case 'stable':
        return `<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"></path>
        </svg>`
      default:
        return ''
    }
  }
  
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((kpi, index) => {
        const colorClasses = {
          blue: 'from-blue-500 to-blue-600 text-white',
          green: 'from-green-500 to-green-600 text-white',
          yellow: 'from-yellow-500 to-yellow-600 text-white',
          red: 'from-red-500 to-red-600 text-white',
          purple: 'from-purple-500 to-purple-600 text-white',
          indigo: 'from-indigo-500 to-indigo-600 text-white'
        }
        
        const gradientClass = colorClasses[kpi.color as keyof typeof colorClasses] || 'from-slate-500 to-slate-600 text-white'
        
        return (
          <div class={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClass} p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            {/* Background Pattern */}
            <div class="absolute inset-0 opacity-10">
              <div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white"></div>
              <div class="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white opacity-50"></div>
            </div>
            
            {/* Content */}
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="text-sm font-medium opacity-90">{kpi.label}</div>
                {kpi.icon && (
                  <div class="opacity-80" dangerouslySetInnerHTML={{ __html: getIconSVG(kpi.icon) }} />
                )}
              </div>
              
              <div class="text-3xl font-bold mb-2">{kpi.value}</div>
              
              {kpi.trend && kpi.trendValue && (
                <div class="flex items-center space-x-1 text-sm opacity-90">
                  <span dangerouslySetInnerHTML={{ __html: getTrendIcon(kpi.trend) }} />
                  <span>{kpi.trendValue}</span>
                </div>
              )}
              
              {kpi.hint && !kpi.trend && (
                <div class="text-sm opacity-75">{kpi.hint}</div>
              )}
            </div>
            
            {/* Shine Effect */}
            <div class="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
          </div>
        )
      })}
    </div>
  )
}



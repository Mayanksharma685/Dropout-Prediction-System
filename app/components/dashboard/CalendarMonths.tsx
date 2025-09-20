import { FC } from 'hono/jsx'

interface CalendarMonthsProps {
  currentDate?: Date
}

const CalendarMonths: FC<CalendarMonthsProps> = ({ currentDate = new Date() }) => {
  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  // Get first day of month and number of days
  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()
  
  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Generate calendar days
  const calendarDays = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }
  
  // Check if a day is today
  const isToday = (day: number | null) => {
    if (!day) return false
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    )
  }
  
  // Check if a day is in the past
  const isPast = (day: number | null) => {
    if (!day) return false
    const dayDate = new Date(currentYear, currentMonth, day)
    return dayDate < today && !isToday(day)
  }
  
  return (
    <div class="bg-white rounded-xl border shadow-sm p-4">
      {/* Calendar Header */}
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-semibold text-slate-800">
          {monthNames[currentMonth]} {currentYear}
        </h4>
        <div class="flex space-x-1">
          <button class="p-1 rounded-md hover:bg-slate-100 text-slate-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <button class="p-1 rounded-md hover:bg-slate-100 text-slate-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Day Headers */}
      <div class="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((dayName) => (
          <div key={dayName} class="text-center text-xs font-medium text-slate-500 py-2">
            {dayName}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div class="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            class={`
              aspect-square flex items-center justify-center text-sm rounded-md cursor-pointer
              ${day === null 
                ? '' 
                : isToday(day)
                  ? 'bg-blue-500 text-white font-semibold'
                  : isPast(day)
                    ? 'text-slate-400 hover:bg-slate-50'
                    : 'text-slate-700 hover:bg-slate-100'
              }
            `}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Legend */}
      <div class="flex items-center justify-center space-x-4 mt-4 pt-3 border-t border-slate-100">
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span class="text-xs text-slate-600">Today</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-slate-100 rounded-full"></div>
          <span class="text-xs text-slate-600">Available</span>
        </div>
      </div>
    </div>
  )
}

export default CalendarMonths

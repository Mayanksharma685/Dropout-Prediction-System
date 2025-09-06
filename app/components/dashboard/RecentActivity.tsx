type Activity = { date: string; message: string }

export default function RecentActivity(props: { items: Activity[] }) {
  const { items } = props
  return (
    <div class="rounded-xl border bg-white p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-700">Recent Activity</h3>
      <ul class="mt-3 space-y-3 text-sm">
        {items.map((a) => (
          <li class="flex items-start gap-2">
            <span class="mt-1 inline-block h-2 w-2 rounded-full bg-blue-500"></span>
            <div>
              <div class="text-gray-900">{a.message}</div>
              <div class="text-xs text-gray-500">{a.date}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}



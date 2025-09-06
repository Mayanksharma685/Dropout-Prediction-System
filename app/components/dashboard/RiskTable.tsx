type RiskRow = {
  studentId: string
  name: string
  riskLevel: string
  attendancePercent?: number
  avgScore?: number
  dueMonths?: number
}

export default function RiskTable(props: { rows: RiskRow[] }) {
  const { rows } = props
  return (
    <div class="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table class="min-w-full text-left text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="px-4 py-3">Student</th>
            <th class="px-4 py-3">Risk</th>
            <th class="px-4 py-3">Attendance</th>
            <th class="px-4 py-3">Avg Score</th>
            <th class="px-4 py-3">Fee Due</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr class="border-t hover:bg-gray-50/60">
              <td class="px-4 py-3">
                <div class="font-medium">{r.name}</div>
                <div class="text-xs text-gray-500">{r.studentId}</div>
              </td>
              <td class="px-4 py-3">
                <span class={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                  r.riskLevel === 'High' ? 'bg-red-100 text-red-700' : r.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'
                }`}>
                  {r.riskLevel}
                </span>
              </td>
              <td class="px-4 py-3">{r.attendancePercent ?? '-'}%</td>
              <td class="px-4 py-3">{r.avgScore ?? '-'}</td>
              <td class="px-4 py-3">{r.dueMonths ?? 0} mo</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}



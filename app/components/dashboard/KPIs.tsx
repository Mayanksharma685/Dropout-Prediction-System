type KPI = { label: string; value: string | number; hint?: string }

export default function KPIs(props: { items: KPI[] }) {
  const { items } = props
  return (
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((kpi) => (
        <div class="rounded-xl border bg-white p-5 shadow-sm hover:shadow transition-shadow">
          <div class="text-xs uppercase tracking-wide text-gray-500">{kpi.label}</div>
          <div class="mt-1 text-3xl font-bold">{kpi.value}</div>
          {kpi.hint && <div class="text-xs text-gray-500 mt-1">{kpi.hint}</div>}
        </div>
      ))}
    </div>
  )
}



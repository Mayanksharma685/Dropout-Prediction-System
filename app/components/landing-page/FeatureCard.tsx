export default function FeatureCard(props: any) {
  const { icon, title, description, children, class: className } = props || {}
  return (
    <div class={`rounded-lg border shadow-sm p-5 bg-white ${className ?? ''}`}>
      <div class="flex items-start gap-3">
        {icon && <div class="text-2xl">{icon}</div>}
        <div>
          <h3 class="text-lg font-semibold">{title}</h3>
          {description && <p class="mt-1 text-gray-600">{description}</p>}
        </div>
      </div>
      {children && <div class="mt-4 text-sm text-gray-700">{children}</div>}
    </div>
  )
}



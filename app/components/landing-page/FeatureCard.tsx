export default function FeatureCard(props: any) {
  const { icon, title, description, children, class: className } = props || {}
  return (
    <div class={`group rounded-xl border border-gray-200 shadow-sm hover:shadow-lg p-6 bg-white transition-all duration-200 hover:border-[#FC816B]/20 hover:-translate-y-1 ${className ?? ''}`}>
      <div class="flex items-start gap-4">
        {icon && (
          <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
            {icon}
          </div>
        )}
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 group-hover:text-[#FC816B] transition-colors duration-200">{title}</h3>
          {description && <p class="mt-2 text-gray-600 leading-relaxed">{description}</p>}
        </div>
      </div>
      {children && <div class="mt-4 text-sm text-gray-700 leading-relaxed">{children}</div>}
    </div>
  )
}



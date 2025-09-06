export default function Section(props: any) {
  const { id, title, subtitle, children, class: className } = props || {}
  return (
    <section id={id} class={`py-16 ${className ?? ''}`}>
      <div class="max-w-6xl mx-auto px-4">
        {title && (
          <div class="mb-8 text-center">
            <h2 class="text-3xl md:text-4xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p class="mt-3 text-gray-600 md:text-lg">{subtitle}</p>}
          </div>
        )}
        <div>{children}</div>
      </div>
    </section>
  )
}



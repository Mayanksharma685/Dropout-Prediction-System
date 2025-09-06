type ModalProps = {
  id: string
  title: string
  description?: string
  onCloseJs?: string
  children: any
}

export function AuthModal(props: ModalProps) {
  const { id, title, description, onCloseJs, children } = props
  return (
    <div
      id={id}
      class="fixed inset-0 z-50 hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
    >
      <div class="absolute inset-0 bg-black/40" onclick={onCloseJs ?? `closeModal('${id}')`}></div>
      <div class="relative mx-auto my-12 w-[92%] max-w-md rounded-lg bg-white shadow-lg">
        <div class="flex items-center justify-between border-b p-4">
          <h3 id={`${id}-title`} class="text-xl font-semibold">{title}</h3>
          <button
            aria-label="Close"
            class="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100"
            onclick={onCloseJs ?? `closeModal('${id}')`}
          >
            ✕
          </button>
        </div>
        {description && <p class="px-4 pt-3 text-gray-600">{description}</p>}
        <div class="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}



import { useEffect, useRef } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function execCommand(command: string, value?: string) {
  document.execCommand(command, false, value)
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
        {[
          { label: 'B', command: 'bold', title: 'Kalın' },
          { label: 'I', command: 'italic', title: 'İtalik' },
          { label: 'U', command: 'underline', title: 'Altı çizili' },
        ].map((item) => (
          <button
            key={item.command}
            type="button"
            title={item.title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              editorRef.current?.focus()
              execCommand(item.command)
              onChange(editorRef.current?.innerHTML ?? '')
            }}
            className="rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-white"
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          title="Başlık"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            editorRef.current?.focus()
            execCommand('formatBlock', 'h2')
            onChange(editorRef.current?.innerHTML ?? '')
          }}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-white"
        >
          H2
        </button>
        <button
          type="button"
          title="Madde işareti"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            editorRef.current?.focus()
            execCommand('insertUnorderedList')
            onChange(editorRef.current?.innerHTML ?? '')
          }}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-white"
        >
          • Liste
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={() => onChange(editorRef.current?.innerHTML ?? '')}
        className="min-h-48 px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none [&:empty::before]:text-slate-400 [&:empty::before]:content-[attr(data-placeholder)]"
      />
    </div>
  )
}

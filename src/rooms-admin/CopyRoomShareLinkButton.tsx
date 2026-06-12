import { useMemo, useState } from 'react'
import { buildPrivateRoomShareUrl } from '../site/roomShareLink'

interface CopyRoomShareLinkButtonProps {
  unitName: string
}

export function CopyRoomShareLinkButton({ unitName }: CopyRoomShareLinkButtonProps) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shareUrl = useMemo(() => buildPrivateRoomShareUrl(unitName), [unitName])

  async function handleCopy() {
    setError(null)

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Link kopyalanamadı. URL\'yi manuel seçip kopyalayın.')
    }
  }

  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-800">
        Özel Oda Paylaşım Linki
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Bu link herkese açık listede görünmez. Yalnızca doğrudan URL ile erişilebilir.
      </p>
      <p className="mt-3 break-all rounded-xl bg-white px-4 py-3 font-mono text-xs text-slate-800 ring-1 ring-sky-100 sm:text-sm">
        {shareUrl}
      </p>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {copied && (
        <p className="mt-2 text-sm font-medium text-emerald-700">Link panoya kopyalandı.</p>
      )}
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="mt-4 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
      >
        Linki Kopyala
      </button>
    </section>
  )
}

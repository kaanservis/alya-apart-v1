import { useCallback, useEffect, useRef, useState } from 'react'
import { formatBackupFileSize } from './backupFileName'
import {
  BACKUP_HISTORY_CHANGED,
  deleteBackupHistoryRecord,
  downloadBackupHistoryRecord,
  getBackupHistory,
} from './backupHistory'
import {
  exportExcelBackup,
  exportJsonBackup,
  buildBackupPreview,
  parseBackupJson,
  restoreBackup,
  runAutoDailyBackupIfNeeded,
} from './backupService'
import {
  BACKUP_SETTINGS_CHANGED,
  getBackupSettings,
  saveBackupSettings,
} from './backupSettings'
import type { BackupHistoryRecord, BackupPayload, BackupPreview, RestoreMode } from './backupTypes'

interface BackupPageProps {
  onUpdated: () => void
}

function formatBackupDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Istanbul',
  }).format(new Date(value))
}

function backupTypeLabel(type: BackupHistoryRecord['type']) {
  if (type === 'json') {
    return 'JSON'
  }

  if (type === 'excel') {
    return 'Excel'
  }

  return 'Otomatik'
}

export function BackupPage({ onUpdated }: BackupPageProps) {
  const importInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autoDailyBackup, setAutoDailyBackup] = useState(() => getBackupSettings().autoDailyBackup)
  const [history, setHistory] = useState<BackupHistoryRecord[]>(() => getBackupHistory())
  const [importPreview, setImportPreview] = useState<BackupPreview | null>(null)
  const [importPayload, setImportPayload] = useState<BackupPayload | null>(null)
  const [importFileName, setImportFileName] = useState<string | null>(null)
  const [restoreMode, setRestoreMode] = useState<RestoreMode>('merge')
  const [confirmRestore, setConfirmRestore] = useState(false)

  const refreshHistory = useCallback(() => {
    setHistory(getBackupHistory())
  }, [])

  useEffect(() => {
    function handleHistoryChanged() {
      refreshHistory()
    }

    function handleSettingsChanged() {
      setAutoDailyBackup(getBackupSettings().autoDailyBackup)
    }

    window.addEventListener(BACKUP_HISTORY_CHANGED, handleHistoryChanged)
    window.addEventListener(BACKUP_SETTINGS_CHANGED, handleSettingsChanged)

    return () => {
      window.removeEventListener(BACKUP_HISTORY_CHANGED, handleHistoryChanged)
      window.removeEventListener(BACKUP_SETTINGS_CHANGED, handleSettingsChanged)
    }
  }, [refreshHistory])

  useEffect(() => {
    async function runAutoBackup() {
      try {
        const created = await runAutoDailyBackupIfNeeded()
        if (created) {
          refreshHistory()
          setMessage('Otomatik günlük yedek oluşturuldu.')
        }
      } catch (autoError) {
        setError(autoError instanceof Error ? autoError.message : 'Otomatik yedek oluşturulamadı.')
      }
    }

    void runAutoBackup()
  }, [refreshHistory])

  async function handleJsonExport() {
    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      const result = await exportJsonBackup()
      refreshHistory()
      setMessage(`${result.fileName} indirildi.`)
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'JSON yedek alınamadı.')
    } finally {
      setBusy(false)
    }
  }

  async function handleExcelExport() {
    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      const result = await exportExcelBackup()
      refreshHistory()
      setMessage(`${result.fileName} indirildi.`)
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Excel dışa aktarılamadı.')
    } finally {
      setBusy(false)
    }
  }

  function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    setError(null)
    setMessage(null)
    setConfirmRestore(false)

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const content = String(reader.result ?? '')
        const payload = parseBackupJson(content)
        setImportPayload(payload)
        setImportPreview(buildBackupPreview(payload))
        setImportFileName(file.name)
      } catch (parseError) {
        setImportPayload(null)
        setImportPreview(null)
        setImportFileName(null)
        setError(parseError instanceof Error ? parseError.message : 'Yedek dosyası okunamadı.')
      }
    }

    reader.readAsText(file, 'utf-8')
  }

  async function handleRestore() {
    if (!importPayload) {
      return
    }

    if (!confirmRestore) {
      setConfirmRestore(true)
      return
    }

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      await restoreBackup(importPayload, restoreMode)
      setImportPayload(null)
      setImportPreview(null)
      setImportFileName(null)
      setConfirmRestore(false)
      setMessage(
        restoreMode === 'full'
          ? 'Tam geri yükleme tamamlandı.'
          : 'Birleştirme geri yüklemesi tamamlandı.',
      )
      onUpdated()
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Geri yükleme başarısız.')
      setConfirmRestore(false)
    } finally {
      setBusy(false)
    }
  }

  function handleAutoBackupToggle(enabled: boolean) {
    const settings = getBackupSettings()
    saveBackupSettings({
      autoDailyBackup: enabled,
      lastAutoBackupDate: settings.lastAutoBackupDate,
    })
    setAutoDailyBackup(enabled)
    setMessage(enabled ? 'Otomatik günlük yedek etkinleştirildi.' : 'Otomatik günlük yedek kapatıldı.')
  }

  function clearImportPreview() {
    setImportPayload(null)
    setImportPreview(null)
    setImportFileName(null)
    setConfirmRestore(false)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm ring-1 ring-blue-50 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Veri Koruma</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Yedekleme</h2>
        <p className="mt-2 text-sm text-slate-600">
          Tek tıkla yedek alın, dosya yükleyerek geri yükleyin veya Excel olarak dışa aktarın.
        </p>
      </section>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="grid gap-5">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleJsonExport()}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-8 text-left text-white shadow-xl shadow-blue-700/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-700/40 disabled:opacity-60 sm:px-10 sm:py-10"
        >
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-transform group-hover:scale-110" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl ring-1 ring-white/25 backdrop-blur-sm">
              {'{ }'}
            </span>
            <div>
              <p className="text-2xl font-bold uppercase tracking-wide sm:text-3xl">JSON Yedek Al</p>
              <p className="mt-2 text-sm text-blue-100/90">
                Odalar, rezervasyonlar ve masraflar —{' '}
                <span className="font-semibold">alya-apart-backup-YYYY-MM-DD-HH-MM.json</span>
              </p>
            </div>
          </div>
        </button>

        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg ring-1 ring-amber-100">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            disabled={busy}
            onChange={handleImportFile}
            className="sr-only"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => importInputRef.current?.click()}
            className="group relative w-full px-6 py-8 text-left transition-all hover:bg-amber-100/40 disabled:opacity-60 sm:px-10 sm:py-10"
          >
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-600 text-3xl text-white shadow-lg shadow-amber-600/30">
                ↑
              </span>
              <div>
                <p className="text-2xl font-bold uppercase tracking-wide text-amber-950 sm:text-3xl">
                  Yedekten Geri Yükle
                </p>
                <p className="mt-2 text-sm text-amber-900/80">
                  JSON yedek dosyasını yükleyin — içe aktarmadan önce kayıt sayıları önizlenir.
                </p>
              </div>
            </div>
          </button>

          {importPreview && importPayload && (
            <div className="border-t border-amber-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Yedek Önizleme</p>
                  {importFileName && <p className="mt-1 text-xs text-slate-500">{importFileName}</p>}
                </div>
                <button
                  type="button"
                  onClick={clearImportPreview}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Temizle
                </button>
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-semibold uppercase text-slate-500">Oda</dt>
                  <dd className="mt-1 text-2xl font-bold text-slate-900">{importPreview.roomCount}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-semibold uppercase text-slate-500">Rezervasyon</dt>
                  <dd className="mt-1 text-2xl font-bold text-slate-900">
                    {importPreview.reservationCount}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-semibold uppercase text-slate-500">Masraf</dt>
                  <dd className="mt-1 text-2xl font-bold text-slate-900">
                    {importPreview.expenseCount}
                  </dd>
                </div>
              </dl>

              {importPreview.exportedAt && (
                <p className="mt-4 text-sm text-slate-600">
                  Yedek tarihi: {formatBackupDate(importPreview.exportedAt)}
                </p>
              )}

              <div className="mt-5">
                <p className="text-sm font-semibold text-slate-900">Geri Yükleme Seçeneği</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                    <input
                      type="radio"
                      name="restore-mode"
                      checked={restoreMode === 'full'}
                      onChange={() => {
                        setRestoreMode('full')
                        setConfirmRestore(false)
                      }}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-bold text-slate-900">Tam Geri Yükleme</span>
                      <span className="mt-1 block text-xs text-slate-600">
                        Mevcut rezervasyon ve masraf kayıtlarını silip yedeği yükler.
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                    <input
                      type="radio"
                      name="restore-mode"
                      checked={restoreMode === 'merge'}
                      onChange={() => {
                        setRestoreMode('merge')
                        setConfirmRestore(false)
                      }}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-bold text-slate-900">Birleştir</span>
                      <span className="mt-1 block text-xs text-slate-600">
                        Mevcut kayıtları korur, yedekte olup sistemde olmayan kayıtları ekler.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                Bu işlem mevcut verilerin üzerine yazılmasına neden olabilir.
              </div>

              {confirmRestore && (
                <div className="mt-4 rounded-xl border border-red-300 bg-red-100 px-4 py-3 text-sm font-semibold text-red-900">
                  Onaylamak için geri yükleme düğmesine tekrar tıklayın.
                </div>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={() => void handleRestore()}
                className={`mt-4 w-full rounded-xl px-5 py-4 text-base font-bold text-white disabled:opacity-50 sm:w-auto ${
                  confirmRestore ? 'bg-red-700 hover:bg-red-800' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {busy
                  ? 'Geri yükleniyor...'
                  : confirmRestore
                    ? 'Geri Yüklemeyi Onayla'
                    : 'Yedeği Geri Yükle'}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => void handleExcelExport()}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 px-6 py-8 text-left text-white shadow-xl shadow-emerald-700/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-700/40 disabled:opacity-60 sm:px-10 sm:py-10"
        >
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-transform group-hover:scale-110" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl ring-1 ring-white/25 backdrop-blur-sm">
              X
            </span>
            <div>
              <p className="text-2xl font-bold uppercase tracking-wide sm:text-3xl">Excel Dışa Aktar</p>
              <p className="mt-2 text-sm text-emerald-100/90">
                Rezervasyonlar ve masraflar — CSV/Excel uyumlu dosya
              </p>
            </div>
          </div>
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={autoDailyBackup}
            onChange={(event) => handleAutoBackupToggle(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-900">Otomatik Günlük Yedek</span>
            <span className="mt-1 block text-sm text-slate-600">
              Her gün bir JSON yedek kaydı oluşturulur ve geçmişe eklenir.
            </span>
          </span>
        </label>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-bold text-slate-900">Yedek Geçmişi</h3>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Henüz kayıtlı yedek yok.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-bold">Yedek Tarihi</th>
                  <th className="px-4 py-3 font-bold">Tür</th>
                  <th className="px-4 py-3 font-bold">Dosya Boyutu</th>
                  <th className="px-4 py-3 font-bold">Dosya</th>
                  <th className="px-4 py-3 font-bold">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{formatBackupDate(record.createdAt)}</td>
                    <td className="px-4 py-3">{backupTypeLabel(record.type)}</td>
                    <td className="px-4 py-3">{formatBackupFileSize(record.fileSize)}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{record.fileName}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => downloadBackupHistoryRecord(record)}
                          className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
                        >
                          Tekrar İndir
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteBackupHistoryRecord(record.id)
                            refreshHistory()
                          }}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

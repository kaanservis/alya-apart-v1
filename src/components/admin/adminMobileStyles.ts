/** Shared responsive class strings for admin panel (mobile ≤768px). Desktop unchanged. */

export const adminPageStack = 'flex flex-col gap-6 max-md:gap-1.5'

export const adminSectionCard =
  'rounded-2xl border border-slate-200 bg-white shadow-sm max-md:rounded-lg max-md:shadow-sm'

export const adminSectionPadding = 'p-5 sm:p-6 max-md:p-2.5'

export const adminPageEyebrow =
  'text-xs font-semibold uppercase tracking-wider text-blue-600 max-md:text-[8px] max-md:tracking-wide'

export const adminPageTitle =
  'mt-1 text-2xl font-bold tracking-tight text-slate-900 max-md:mt-0 max-md:text-base'

export const adminPageDescription = 'mt-2 text-sm text-slate-600 max-md:mt-0.5 max-md:text-[11px]'

export const adminSectionTitle = 'text-lg font-bold text-slate-900 max-md:text-[13px]'

export const adminActionBtn =
  'inline-flex min-h-[42px] items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold max-md:min-h-[36px] max-md:rounded-lg max-md:px-2 max-md:py-1.5 max-md:text-[11px]'

export const adminActionBtnPrimary = `${adminActionBtn} bg-blue-700 text-white hover:bg-blue-800`

export const adminActionBtnSecondary = `${adminActionBtn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`

export const adminActionBtnDanger = `${adminActionBtn} bg-red-600 text-white hover:bg-red-700`

/** Primary CTA — very compact on mobile (~40% shorter than desktop) */
export const adminPrimaryCta =
  'group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-7 text-white shadow-xl shadow-blue-700/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-700/40 max-md:rounded-lg max-md:px-3 max-md:py-2.5 sm:px-10 sm:py-8'

export const adminPrimaryCtaIcon =
  'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl font-bold ring-1 ring-white/25 backdrop-blur-sm max-md:h-7 max-md:w-7 max-md:rounded-md max-md:text-base'

export const adminPrimaryCtaTitle =
  'text-2xl font-bold uppercase tracking-wide sm:text-3xl max-md:text-sm max-md:leading-tight'

export const adminPrimaryCtaSubtitle =
  'mt-1 text-sm text-blue-100/90 max-md:hidden sm:mt-1 sm:block'

export const adminMobileCardList = 'space-y-2 p-3 max-md:space-y-1.5 max-md:p-1.5 md:hidden'

export const adminMobileCard =
  'rounded-xl border border-slate-200 bg-white p-3 shadow-sm max-md:rounded-lg max-md:p-2'

export const adminMobileCardLabel =
  'text-[10px] font-semibold uppercase tracking-wide text-slate-500 max-md:text-[8px]'

export const adminMobileCardValue = 'text-sm font-semibold text-slate-900 max-md:text-[11px]'

/** Dashboard compact stat row — always 4 columns */
export const adminDashboardCompactStatGrid =
  'grid grid-cols-4 gap-1 max-md:gap-1 sm:gap-2'

export const adminDashboardCompactStatBox =
  'dashboard-compact-stat flex flex-col items-center justify-center rounded-lg border px-0.5 py-1.5 text-center max-md:min-h-[52px] max-md:py-1 sm:rounded-xl sm:px-2 sm:py-2.5'

/** Reservation detail action buttons — full width stack on mobile */
export const adminDetailActionsStack =
  'flex flex-wrap gap-2 max-md:flex-col max-md:gap-1.5 [&_button]:max-md:w-full'

/** Cari summary — 3 columns on all breakpoints */
export const adminCariSummaryGrid = 'grid grid-cols-3 gap-2 max-md:gap-1 sm:gap-3'

export const adminCariSummaryCard = 'rounded-xl bg-white p-4 ring-1 ring-slate-200 max-md:p-1.5 max-md:rounded-lg'

export const adminCariSummaryLabel =
  'text-xs font-semibold uppercase tracking-wide text-slate-500 max-md:text-[8px] max-md:leading-tight'

export const adminCariSummaryValue =
  'mt-2 text-2xl font-black text-slate-900 max-md:mt-0.5 max-md:text-xs max-md:font-bold'

/** WhatsApp quick message chips — horizontal scroll on mobile */
export const adminWhatsAppChipRow =
  'admin-whatsapp-chips flex gap-2 overflow-x-auto pb-1 max-md:flex-nowrap max-md:gap-1.5 sm:flex-wrap'

export const adminWhatsAppChip =
  'inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-[#25D366]/20 max-md:px-2 max-md:py-1 max-md:text-[10px] sm:text-sm'

/** App shell header — compact on mobile */
export const adminShellHeader =
  'sticky top-0 z-30 border-b border-blue-900/20 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 shadow-lg shadow-blue-900/20'

export const adminShellHeaderInner =
  'flex items-center gap-2 px-3 py-3 max-md:gap-1.5 max-md:px-2 max-md:py-1.5 sm:gap-4 sm:px-6 sm:py-4 lg:px-8'

export const adminShellHeaderTitle =
  'truncate text-lg font-bold tracking-tight text-white max-md:text-sm sm:text-xl sm:text-2xl'

export const adminShellHeaderEyebrow =
  'text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-100/80 max-md:text-[8px] sm:text-xs sm:tracking-[0.18em]'

export const adminShellMain =
  'admin-shell-main min-w-0 flex-1 overflow-x-hidden px-3 py-4 max-md:px-2 max-md:py-2 sm:px-6 sm:py-6 lg:px-8'

/** Shared responsive class strings for admin panel (mobile ≤768px). Desktop unchanged. */

export const adminPageStack = 'flex flex-col gap-6 max-md:gap-4'

export const adminSectionCard =
  'rounded-2xl border border-slate-200 bg-white shadow-sm max-md:rounded-xl max-md:shadow-sm'

export const adminSectionPadding = 'p-5 sm:p-6 max-md:p-3'

export const adminPageEyebrow =
  'text-xs font-semibold uppercase tracking-wider text-blue-600 max-md:text-[10px] max-md:tracking-wide'

export const adminPageTitle = 'mt-1 text-2xl font-bold tracking-tight text-slate-900 max-md:text-lg'

export const adminPageDescription = 'mt-2 text-sm text-slate-600 max-md:mt-1 max-md:text-xs'

export const adminSectionTitle = 'text-lg font-bold text-slate-900 max-md:text-base'

export const adminActionBtn =
  'inline-flex items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold max-md:rounded-lg max-md:px-2.5 max-md:py-1.5 max-md:text-xs'

export const adminActionBtnPrimary = `${adminActionBtn} bg-blue-700 text-white hover:bg-blue-800`

export const adminActionBtnSecondary = `${adminActionBtn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`

export const adminActionBtnDanger = `${adminActionBtn} bg-red-600 text-white hover:bg-red-700`

/** Primary CTA — intentionally NOT shrunk on mobile */
export const adminPrimaryCta =
  'group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-7 text-white shadow-xl shadow-blue-700/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-700/40 sm:px-10 sm:py-8'

export const adminMobileCardList = 'space-y-2.5 p-3 max-md:p-2 md:hidden'

export const adminMobileCard =
  'rounded-xl border border-slate-200 bg-white p-3 shadow-sm max-md:p-2.5'

export const adminMobileCardLabel =
  'text-[10px] font-semibold uppercase tracking-wide text-slate-500 max-md:text-[9px]'

export const adminMobileCardValue = 'text-sm font-semibold text-slate-900 max-md:text-xs'

import { isSupabaseConfigured, supabase } from './supabase'

export type ConnectionTestStatus = 'pending' | 'success' | 'error' | 'skipped'

export interface ConnectionTestResult {
  name: string
  table: string
  status: ConnectionTestStatus
  message: string
}

export interface SupabaseConnectionReport {
  configured: boolean
  clientInitialized: boolean
  results: ConnectionTestResult[]
  allPassed: boolean
}

async function testTableAccess(
  name: string,
  table: string,
  query: () => PromiseLike<{ error: { message: string } | null }>,
): Promise<ConnectionTestResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      name,
      table,
      status: 'skipped',
      message: 'Supabase yapılandırılmadı.',
    }
  }

  try {
    const { error } = await query()

    if (error) {
      return {
        name,
        table,
        status: 'error',
        message: error.message,
      }
    }

    return {
      name,
      table,
      status: 'success',
      message: 'Bağlantı başarılı.',
    }
  } catch (error) {
    return {
      name,
      table,
      status: 'error',
      message: error instanceof Error ? error.message : 'Bilinmeyen hata.',
    }
  }
}

export async function runSupabaseConnectionTest(): Promise<SupabaseConnectionReport> {
  const configured = isSupabaseConfigured
  const clientInitialized = Boolean(supabase)

  if (!configured || !supabase) {
    return {
      configured,
      clientInitialized,
      results: [
        {
          name: 'Ortam Değişkenleri',
          table: '—',
          status: 'error',
          message:
            'VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY .env dosyasında tanımlı olmalıdır.',
        },
      ],
      allPassed: false,
    }
  }

  const client = supabase

  const results = await Promise.all([
    testTableAccess('Odalar', 'accommodation_units', () =>
      client.from('accommodation_units').select('id').limit(1),
    ),
    testTableAccess('Rezervasyonlar', 'reservations', () =>
      client.from('reservations').select('id').limit(1),
    ),
    testTableAccess('Masraflar', 'expenses', () =>
      client.from('expenses').select('id').limit(1),
    ),
  ])

  return {
    configured,
    clientInitialized,
    results,
    allPassed: results.every((result) => result.status === 'success'),
  }
}

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvFile(path) {
  const content = readFileSync(path, 'utf8')
  const env = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    env[key] = value
  }

  return env
}

async function testTable(client, table) {
  const { error } = await client.from(table).select('id').limit(1)
  return error?.message ?? null
}

const APARTMENT_COLUMNS =
  'id,name,description,cover_image,feature_near_sea,feature_wifi,feature_ac,feature_kitchen,feature_balcony,feature_family_friendly,sort_order,created_at,updated_at'

async function testApartments(client) {
  const { data, error, status } = await client
    .from('apartments')
    .select(APARTMENT_COLUMNS)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  if (error) {
    return { ok: false, message: error.message, count: 0 }
  }

  return {
    ok: true,
    message: null,
    count: data?.length ?? 0,
    status,
    sample: (data ?? []).slice(0, 3).map((row) => `${row.id}:${row.name}`),
  }
}

async function testApartmentUpdate(client) {
  const { data: rows, error: readError } = await client.from('apartments').select('id').limit(1)

  if (readError || !rows?.[0]?.id) {
    return { ok: false, message: readError?.message ?? 'no apartment rows to test update against' }
  }

  const apartmentId = Number(rows[0].id)
  const probeValue = `rls-probe-${Date.now()}`

  const { data, error, status } = await client
    .from('apartments')
    .update({ cover_image: probeValue })
    .eq('id', apartmentId)
    .select('id,cover_image')

  if (error) {
    return { ok: false, message: `UPDATE failed: ${error.message}`, apartmentId, status }
  }

  if (!data || data.length === 0) {
    return {
      ok: false,
      message: 'UPDATE returned 0 rows — run 023_apartments_update_rls.sql',
      apartmentId,
      status,
    }
  }

  await client.from('apartments').update({ cover_image: null }).eq('id', apartmentId)

  return { ok: true, message: null, apartmentId, status }
}

async function main() {
  const envPath = resolve(process.cwd(), '.env')
  const env = loadEnvFile(envPath)
  const url = env.VITE_SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY

  console.log('Supabase Connection Test')
  console.log('========================')

  if (!url || !anonKey) {
    console.error('FAIL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
    process.exit(1)
  }

  if (url.includes('your-project') || anonKey === 'your-anon-key') {
    console.error('FAIL: .env still contains placeholder values')
    process.exit(1)
  }

  console.log(`URL: ${url}`)
  console.log(`Anon key length: ${anonKey.length}`)
  console.log('Client: initialized')

  const client = createClient(url, anonKey)
  const tables = ['accommodation_units', 'reservations', 'expenses']
  let failed = false

  for (const table of tables) {
    const errorMessage = await testTable(client, table)

    if (errorMessage) {
      failed = true
      console.error(`FAIL: ${table} — ${errorMessage}`)
    } else {
      console.log(`OK: ${table}`)
    }
  }

  const apartmentsResult = await testApartments(client)

  if (!apartmentsResult.ok) {
    failed = true
    console.error(`FAIL: apartments — ${apartmentsResult.message}`)
  } else if (apartmentsResult.count === 0) {
    failed = true
    console.error('FAIL: apartments — query succeeded but returned 0 rows (check RLS SELECT policy)')
  } else {
    console.log(`OK: apartments (${apartmentsResult.count} rows: ${apartmentsResult.sample.join(', ')})`)
  }

  const updateResult = await testApartmentUpdate(client)

  if (!updateResult.ok) {
    failed = true
    console.error(
      `FAIL: apartments UPDATE (id=${updateResult.apartmentId ?? '?'}) — ${updateResult.message}`,
    )
  } else {
    console.log(`OK: apartments UPDATE (id=${updateResult.apartmentId})`)
  }

  if (failed) {
    process.exit(1)
  }

  console.log('All connection tests passed.')
}

main().catch((error) => {
  console.error('FAIL:', error instanceof Error ? error.message : error)
  process.exit(1)
})

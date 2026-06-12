import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const UNIT_NAMES = [
  'Yaren 2',
  'Belkız 3',
  'Ayşegül 7',
  'Berrin 8',
  '201',
  '202',
  '203',
  '204',
  '205',
  '301',
  '302',
  '303',
  '304',
  '305',
]

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

async function main() {
  const envPath = resolve(process.cwd(), '.env')
  const env = loadEnvFile(envPath)
  const url = env.VITE_SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY

  console.log('Accommodation Units Seed')
  console.log('========================')

  if (!url || !anonKey) {
    console.error('FAIL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
    process.exit(1)
  }

  const client = createClient(url, anonKey)

  const { data: existing, error: countError, count } = await client
    .from('accommodation_units')
    .select('name', { count: 'exact' })

  if (countError) {
    console.error('FAIL: Could not read accommodation_units —', countError.message)
    process.exit(1)
  }

  const existingCount = count ?? existing?.length ?? 0
  console.log(`Existing units: ${existingCount}`)

  if (existingCount > 0) {
    console.log('Table already has data. Skipping insert.')
    for (const row of existing ?? []) {
      console.log(`  - ${row.name}`)
    }
    return
  }

  const rows = UNIT_NAMES.map((name) => ({
    name,
    status: 'Boş',
  }))

  const { data: inserted, error: insertError } = await client
    .from('accommodation_units')
    .insert(rows)
    .select('id, name, status')

  if (insertError) {
    console.error('FAIL: Insert failed —', insertError.message)
    process.exit(1)
  }

  console.log(`Inserted ${inserted?.length ?? 0} units:`)
  for (const row of inserted ?? []) {
    console.log(`  OK: ${row.name} (${row.status})`)
  }

  const { count: finalCount, error: verifyError } = await client
    .from('accommodation_units')
    .select('id', { count: 'exact', head: true })

  if (verifyError) {
    console.error('FAIL: Verification failed —', verifyError.message)
    process.exit(1)
  }

  if (finalCount !== UNIT_NAMES.length) {
    console.error(`FAIL: Expected ${UNIT_NAMES.length} units, found ${finalCount}`)
    process.exit(1)
  }

  console.log(`Verified: ${finalCount} units in accommodation_units.`)
}

main().catch((error) => {
  console.error('FAIL:', error instanceof Error ? error.message : error)
  process.exit(1)
})

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const EXPECTED_UNITS = [
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
  const env = loadEnvFile(resolve(process.cwd(), '.env'))
  const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

  const { data, error } = await client
    .from('accommodation_units')
    .select('id, name, status')
    .order('name', { ascending: true })

  if (error) {
    console.error('FAIL:', error.message)
    process.exit(1)
  }

  const names = (data ?? []).map((row) => row.name)
  const missing = EXPECTED_UNITS.filter((name) => !names.includes(name))
  const extra = names.filter((name) => !EXPECTED_UNITS.includes(name))

  console.log('Units loaded from Supabase')
  console.log('============================')
  console.log(`Total: ${names.length}`)
  for (const row of data ?? []) {
    console.log(`  ${row.name} — ${row.status}`)
  }

  if (missing.length > 0) {
    console.error('FAIL: Missing units:', missing.join(', '))
    process.exit(1)
  }

  if (extra.length > 0) {
    console.error('FAIL: Unexpected units:', extra.join(', '))
    process.exit(1)
  }

  console.log('All 14 expected units are present.')
}

main().catch((error) => {
  console.error('FAIL:', error instanceof Error ? error.message : error)
  process.exit(1)
})

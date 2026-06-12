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

  if (failed) {
    process.exit(1)
  }

  console.log('All connection tests passed.')
}

main().catch((error) => {
  console.error('FAIL:', error instanceof Error ? error.message : error)
  process.exit(1)
})

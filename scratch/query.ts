import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Read .env file manually
const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const env: Record<string, string> = {}
envContent.split('\n').forEach((line) => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim()
  }
})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)

async function run() {
  // We can query pg_enum via Supabaserpc or a standard query if allowed,
  // or we can select from information_schema, or we can try to insert a dummy value and read the error,
  // or query existing business_user_roles to see what roles exist.
  const { data, error } = await supabase
    .from('business_user_roles')
    .select('role')
    .limit(10)

  console.log('Existing roles:', data)
  console.log('Query error:', error)
}

run()

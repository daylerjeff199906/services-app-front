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
  const { data: services, error: sError } = await supabase
    .from('services')
    .select('*')
    .limit(10)

  console.log('Services:', services)
  console.log('Services error:', sError)

  const { data: categories, error: cError } = await supabase
    .from('service_categories')
    .select('*')
    .limit(10)

  console.log('Categories:', categories)
  console.log('Categories error:', cError)
}

run()

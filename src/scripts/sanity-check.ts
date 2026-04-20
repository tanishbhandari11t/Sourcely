import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.local' })

async function checkConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('--- Sourcely Diagnostic ---')
  console.log(`Target URL: ${url}`)
  
  if (!url || !key) {
    console.error('ERROR: Missing Supabase Keys in .env.local')
    return
  }

  const supabase = createClient(url, key)

  try {
    const { data, error } = await supabase.from('workspaces').select('id').limit(1)
    
    if (error) {
       console.error('Supabase RLS/Connection Error:', error.message)
    } else {
       console.log('SUCCESS: Connection to Supabase Cloud is SOLID.')
    }
  } catch (e: any) {
    console.error('Network/Crashed Error:', e.message)
  }
}

checkConnection()

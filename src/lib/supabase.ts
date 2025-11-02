import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

const nodeEnv = import.meta.env.VITE_NODE_ENV || import.meta.env.MODE
const isLocalhost = nodeEnv === 'localhost'
const supabaseKey = isLocalhost ? import.meta.env.VITE_SUPABASE_SERVICE_KEY : import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
}

console.log(`Running in ${nodeEnv}`)

export const supabase = createClient(supabaseUrl, supabaseKey)

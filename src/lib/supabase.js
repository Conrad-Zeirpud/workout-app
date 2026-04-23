import { createClient } from '@supabase/supabase-js'

console.log('🧪 Test env:', import.meta.env.VITE_TEST)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Supabase URL:', supabaseUrl)
console.log('🔧 Supabase Key:', supabaseAnonKey ? supabaseAnonKey.slice(0, 20) + '...' : 'MANQUANTE')

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Variables Supabase manquantes.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)
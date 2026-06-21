import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jfnlkitnhnmlyvfsishv.supabase.co'

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmbmxraXRuaG5tbHl2ZnNpc2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5OTA5OTksImV4cCI6MjA5NzU2Njk5OX0.sLB8kVs8-aexBQIFzVe4Zz740IjwDyARnd6D2HigDWY'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)
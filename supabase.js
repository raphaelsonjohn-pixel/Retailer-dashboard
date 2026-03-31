// supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://sutrnnlbmuxggbvfwrpk.supabase.co'      // replace with your Supabase URL
const SUPABASE_ANON_KEY = 'sb_publishable_yJni7Xxl78x24V1mJvLjVg_RAWAsGOt' // replace with your anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
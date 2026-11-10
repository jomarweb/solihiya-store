import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const configured = Boolean(url && key)
export const supabase = configured ? createClient(url, key) : null

export const peso = (n) => '₱' + Number(n || 0).toLocaleString('en-PH')
export const img = (base, w = 900, h) =>
  `${base}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=75`

export const CATEGORIES = ['Seating', 'Tables', 'Beds', 'Storage', 'Lighting', 'Decor']
export const FREE_SHIPPING_FROM = 50000
export const SHIPPING_FEE = 1500

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requireAuth() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }
  return data.user
}

export async function requireApiAuth() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    return null
  }
  return data.user
}

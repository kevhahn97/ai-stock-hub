import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { getRecentUploads } from '@/lib/getRecentUploads'

export async function GET() {
  const supabase = await createSupabaseClient()
  const results = await getRecentUploads(supabase, 20)
  return NextResponse.json(results)
}

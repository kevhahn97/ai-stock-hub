import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      // go to home page
      const url = new URL('/', request.url)
      return NextResponse.redirect(url)
    }
    console.error(error)
  }
  const url = request.nextUrl.clone()
  url.pathname = '/error'
  console.log(url)
  return NextResponse.redirect(url)
}

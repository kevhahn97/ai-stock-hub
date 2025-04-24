import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function createClient(response?: NextResponse) {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options) {
        if (response) {
          response.cookies.set(name, value, options)
        }
      },
      remove(name: string, options) {
        if (response) {
          response.cookies.set(name, '', options)
        }
      },
    },
  })
}

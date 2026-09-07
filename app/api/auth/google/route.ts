import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'Google sign-in is not configured.' }, { status: 503 })
  const callback = new URL('/api/auth/google/callback', process.env.NEXT_PUBLIC_APP_URL || request.url).toString()
  const response = new NextResponse(null, { status: 302 })
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: values => values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  })
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback } })
  if (error || !data.url) return NextResponse.json({ error: error?.message || 'Google sign-in could not be started.' }, { status: 500 })
  response.headers.set('Location', data.url)
  return response
}

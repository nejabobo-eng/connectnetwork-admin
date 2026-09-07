import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookieName, createAdminSession } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = new URL('/', process.env.NEXT_PUBLIC_APP_URL || request.url)
  if (!code) return NextResponse.redirect(new URL('/?error=signin', request.url))
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.redirect(new URL('/?error=signin', request.url))
  try {
    const response = NextResponse.redirect(redirect)
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: values => values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    })
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    const user = data.user
    if (error || !user?.email || user.email.toLowerCase() !== (process.env.ADMIN_EMAIL || 'nejabobo@gmail.com').toLowerCase()) throw new Error('Unauthorised user')
    response.cookies.set(cookieName, createAdminSession(user.email), { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 12 })
    return response
  } catch (error) {
    const failure = new URL('/?error=signin', process.env.NEXT_PUBLIC_APP_URL || request.url)
    failure.searchParams.set('reason', error instanceof Error ? error.message.slice(0, 120) : 'Unknown sign-in error')
    return NextResponse.redirect(failure)
  }
}

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { cookieName, createAdminSession } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const verifier = cookies().get('connectnetwork_admin_pkce_verifier')?.value
  const redirect = new URL('/', process.env.NEXT_PUBLIC_APP_URL || request.url)
  if (!code || !verifier) return NextResponse.redirect(new URL('/?error=signin&reason=Google+verification+expired', request.url))
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.redirect(new URL('/?error=signin', request.url))
  try {
    const response = NextResponse.redirect(redirect)
    const tokenResponse = await fetch(`${url}/auth/v1/token?grant_type=pkce`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify({ auth_code: code, code_verifier: verifier }), cache: 'no-store' })
    if (!tokenResponse.ok) throw new Error('Google token exchange failed')
    const tokens = await tokenResponse.json()
    const userResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${tokens.access_token}` }, cache: 'no-store' })
    const user = await userResponse.json()
    if (!userResponse.ok || !user.email || user.email.toLowerCase() !== (process.env.ADMIN_EMAIL || 'nejabobo@gmail.com').toLowerCase()) throw new Error('This Google account is not authorised')
    response.cookies.set(cookieName, createAdminSession(user.email), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 12 })
    response.cookies.delete('connectnetwork_admin_pkce_verifier')
    return response
  } catch (error) {
    const failure = new URL('/?error=signin', process.env.NEXT_PUBLIC_APP_URL || request.url)
    failure.searchParams.set('reason', error instanceof Error ? error.message.slice(0, 120) : 'Unknown sign-in error')
    return NextResponse.redirect(failure)
  }
}

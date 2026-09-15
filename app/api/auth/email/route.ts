import { NextResponse } from 'next/server'
import { cookieName, createAdminSession, isAuthorisedAdminEmail } from '@/lib/admin-auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) return NextResponse.json({ error: 'Enter your authorised email address and password.' }, { status: 400 })
  if (!isAuthorisedAdminEmail(email)) return NextResponse.json({ error: 'This account is not authorised for the dashboard.' }, { status: 403 })
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'Admin authentication is not configured.' }, { status: 503 })
  const signIn = await fetch(`${url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), cache: 'no-store' })
  const payload = await signIn.json().catch(() => ({}))
  if (!signIn.ok || !isAuthorisedAdminEmail(payload.user?.email)) return NextResponse.json({ error: typeof payload.msg === 'string' ? payload.msg : 'Email or password is incorrect.' }, { status: 401 })
  const result = NextResponse.json({ ok: true })
  result.cookies.set(cookieName, createAdminSession(payload.user.email), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 12 })
  return result
}

import { NextResponse } from 'next/server'
import { cookieName, createAdminSession } from '@/lib/admin-auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  if (email !== (process.env.ADMIN_EMAIL || 'nejabobo@gmail.com').toLowerCase()) return NextResponse.json({ error: 'This account is not authorised for the dashboard.' }, { status: 403 })
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'Admin authentication is not configured.' }, { status: 503 })
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), cache: 'no-store' })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) return NextResponse.json({ error: typeof payload.msg === 'string' ? payload.msg : 'Email or password is incorrect.' }, { status: 401 })
  if (payload.user?.email?.toLowerCase() !== email) return NextResponse.json({ error: 'This account is not authorised for the dashboard.' }, { status: 403 })
  const result = NextResponse.json({ ok: true })
  result.cookies.set(cookieName, createAdminSession(email), { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 12 })
  return result
}

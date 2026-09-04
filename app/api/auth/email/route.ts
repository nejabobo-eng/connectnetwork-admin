import { NextResponse } from 'next/server'
import { cookieName, createAdminSession } from '@/lib/admin-auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  if (email !== (process.env.ADMIN_EMAIL || 'nejabobo@gmail.com').toLowerCase()) return NextResponse.json({ error: 'This account is not authorised for the dashboard.' }, { status: 403 })
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: process.env.SUPABASE_ANON_KEY || '', 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), cache: 'no-store' })
  if (!response.ok) return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 })
  const result = NextResponse.json({ ok: true })
  result.cookies.set(cookieName, createAdminSession(email), { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 12 })
  return result
}

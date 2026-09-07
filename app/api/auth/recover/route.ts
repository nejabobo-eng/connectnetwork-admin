import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({}))
  if (typeof email !== 'string' || !email.trim()) return NextResponse.json({ error: 'Enter your email address.' }, { status: 400 })
  const requestOrigin = new URL(request.url).origin
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL
  const appUrl = configuredUrl && /^https:\/\//.test(configuredUrl) ? configuredUrl : requestOrigin
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/recover`, { method: 'POST', headers: { apikey: process.env.SUPABASE_ANON_KEY || '', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim().toLowerCase(), redirect_to: new URL('/reset-password', appUrl).toString() }), cache: 'no-store' })
  if (response.ok) return NextResponse.json({ ok: true })
  const data = await response.json().catch(() => ({}))
  return NextResponse.json({ error: typeof data.msg === 'string' ? data.msg : typeof data.error_description === 'string' ? data.error_description : 'We could not send a reset email.' }, { status: response.status })
}

import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { cookieName, createAdminSession } from '@/lib/admin-auth'

function matches(value: string, expected: string) {
  return value.length === expected.length && timingSafeEqual(Buffer.from(value), Buffer.from(expected))
}

export async function GET(request: NextRequest) {
  const setupSecret = process.env.ADMIN_SETUP_SECRET?.trim()
  const providedSecret = request.nextUrl.searchParams.get('key')?.trim()
  if (!setupSecret) return NextResponse.json({ error: 'Setup secret is not configured in this deployment.' }, { status: 503 })
  if (!providedSecret || !matches(providedSecret, setupSecret)) return NextResponse.json({ error: 'The setup link is not valid.' }, { status: 401 })

  const email = (process.env.ADMIN_EMAIL || 'nejabobo@gmail.com').toLowerCase()
  const response = NextResponse.redirect(new URL('/', request.url))
  response.cookies.set(cookieName, createAdminSession(email), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 2 })
  return response
}

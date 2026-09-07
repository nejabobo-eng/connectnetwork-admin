import { createHash, randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'Google sign-in is not configured.' }, { status: 503 })
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  const callback = new URL('/api/auth/google/callback', process.env.NEXT_PUBLIC_APP_URL || request.url).toString()
  const response = NextResponse.redirect(`${url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(callback)}&code_challenge=${challenge}&code_challenge_method=s256`)
  response.cookies.set('connectnetwork_admin_pkce_verifier', verifier, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 600 })
  return response
}

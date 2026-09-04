import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { cookieName, isValidAdminSession } from '@/lib/admin-auth'
import { controlRequest } from '@/lib/control-client'

function authorised() { return isValidAdminSession(cookies().get(cookieName)?.value) }

export async function GET() {
  if (!authorised()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  try { return NextResponse.json(await controlRequest('/api/control')) } catch { return NextResponse.json({ error: 'The main ConnectNetwork control API is unavailable.' }, { status: 503 }) }
}

export async function POST(request: Request) {
  if (!authorised()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  try { return NextResponse.json(await controlRequest('/api/control', { method: 'POST', body: JSON.stringify(body) })) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Action failed' }, { status: 500 }) }
}

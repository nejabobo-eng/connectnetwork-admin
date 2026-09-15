import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { cookieName, isLocalAdminBypassEnabled, isValidAdminSession } from '@/lib/admin-auth'

export async function POST(request: Request) {
  if (!(isLocalAdminBypassEnabled() || isValidAdminSession(cookies().get(cookieName)?.value))) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const baseUrl = process.env.CONNECTNETWORK_API_URL
  const apiKey = process.env.CONNECTNETWORK_ADMIN_API_KEY
  if (!baseUrl || !apiKey) return NextResponse.json({ error: 'ConnectNetwork control API is not configured.' }, { status: 503 })
  const response = await fetch(new URL('/api/control/upload-product-image', baseUrl), { method: 'POST', headers: { 'x-connectnetwork-admin-key': apiKey }, body: await request.formData(), cache: 'no-store' })
  return NextResponse.json(await response.json().catch(() => ({})), { status: response.status })
}

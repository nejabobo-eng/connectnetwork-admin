import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Setup access is disabled. Sign in with the authorised account.' }, { status: 404 })
}

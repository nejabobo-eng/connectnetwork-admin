import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    configured: {
      appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
      supabaseUrl: Boolean(process.env.SUPABASE_URL),
      supabaseKey: Boolean(process.env.SUPABASE_ANON_KEY),
      adminEmail: Boolean(process.env.ADMIN_EMAIL),
      sessionSecret: Boolean(process.env.ADMIN_SESSION_SECRET),
      localBypassEnabled: process.env.NODE_ENV === 'development' && process.env.ALLOW_LOCAL_ADMIN_BYPASS === 'true',
    },
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  })
}

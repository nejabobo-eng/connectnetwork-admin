import { cookies } from 'next/headers'
import Dashboard from './dashboard'
import { cookieName, isValidAdminSession } from '@/lib/admin-auth'
import LoginForm from './LoginForm'

export default function Home({ searchParams }: { searchParams?: { error?: string; reason?: string } }) {
  if (!isValidAdminSession(cookies().get(cookieName)?.value)) return <main className="mx-auto flex min-h-screen max-w-md items-center px-5"><section className="w-full rounded-2xl border bg-white p-8 shadow-sm"><p className="font-semibold text-green">CONNECTNETWORK</p><h1 className="mt-2 text-3xl font-bold">Owner sign-in</h1><p className="mt-3 text-slate-600">Use the authorised account to open the operations dashboard.</p><a className="mt-6 inline-block rounded-lg bg-navy px-5 py-3 font-semibold text-white" href="/api/auth/google">Continue with Google</a><LoginForm />{searchParams?.error && <p className="mt-5 text-sm text-red-700">Sign-in failed: {searchParams.reason || 'Please try again.'}</p>}</section></main>
  return <Dashboard />
}

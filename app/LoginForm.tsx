'use client'

import { FormEvent, useState } from 'react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('Signing in…')
    try {
      const response = await fetch('/api/auth/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) { setMessage(data.error || 'Sign-in failed. Please try again.'); return }
      window.location.assign('/')
    } catch { setMessage('The sign-in service could not be reached. Please try again.') }
  }

  return <><form className="mt-5 grid gap-3" onSubmit={submit}><input name="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Authorised email address" className="rounded-lg border p-3" autoComplete="email" /><div className="relative"><input name="password" required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full rounded-lg border p-3 pr-20" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword(current => !current)} className="absolute inset-y-0 right-0 px-4 text-sm font-semibold text-primary">{showPassword ? 'Hide' : 'Show'}</button></div><button className="rounded-lg bg-navy px-5 py-3 font-semibold text-white">Sign in with password</button></form>{message && <p className="mt-3 text-sm text-slate-600" role="status">{message}</p>}</>
}

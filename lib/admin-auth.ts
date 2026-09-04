import { createHmac, timingSafeEqual } from 'crypto'

export const cookieName = 'connectnetwork_admin_dashboard'
const secret = process.env.ADMIN_SESSION_SECRET
const adminEmail = (process.env.ADMIN_EMAIL || 'nejabobo@gmail.com').toLowerCase()

export function createAdminSession(email: string) {
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured')
  const normalisedEmail = email.toLowerCase()
  return `${normalisedEmail}.${createHmac('sha256', secret).update(normalisedEmail).digest('hex')}`
}

export function isValidAdminSession(value?: string) {
  if (!value || !secret) return false
  const [email] = value.split('.')
  if (!email || email !== adminEmail) return false
  const expected = createAdminSession(email)
  return value.length === expected.length && timingSafeEqual(Buffer.from(value), Buffer.from(expected))
}

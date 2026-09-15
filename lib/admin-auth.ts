import { createHmac, timingSafeEqual } from 'crypto'

export const cookieName = 'connectnetwork_admin_dashboard'

const sessionLifetimeSeconds = 60 * 60 * 12
const secret = process.env.ADMIN_SESSION_SECRET
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()

function normaliseEmail(email: string) {
  return email.trim().toLowerCase()
}

function encodeEmail(email: string) {
  return Buffer.from(normaliseEmail(email)).toString('base64url')
}

function decodeEmail(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

export function isAuthorisedAdminEmail(email?: string) {
  return Boolean(adminEmail && email && normaliseEmail(email) === adminEmail)
}

export function createAdminSession(email: string) {
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured')
  if (!isAuthorisedAdminEmail(email)) throw new Error('This account is not authorised for the dashboard')

  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetimeSeconds
  const payload = `${encodeEmail(email)}.${expiresAt}`
  const signature = createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${signature}`
}

export function isValidAdminSession(value?: string) {
  if (!value || !secret || !adminEmail) return false

  const [encodedEmail, expiresAtText, signature, ...extraParts] = value.split('.')
  const expiresAt = Number(expiresAtText)
  if (extraParts.length || !encodedEmail || !signature || !Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false

  let email = ''
  try {
    email = decodeEmail(encodedEmail)
  } catch {
    return false
  }
  if (!isAuthorisedAdminEmail(email)) return false

  const payload = `${encodeEmail(email)}.${expiresAt}`
  const expected = `${payload}.${createHmac('sha256', secret).update(payload).digest('hex')}`
  return value.length === expected.length && timingSafeEqual(Buffer.from(value), Buffer.from(expected))
}

export function isLocalAdminBypassEnabled() {
  return process.env.NODE_ENV === 'development' && process.env.ALLOW_LOCAL_ADMIN_BYPASS === 'true'
}

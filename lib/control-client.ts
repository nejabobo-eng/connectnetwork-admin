const baseUrl = process.env.CONNECTNETWORK_API_URL
const apiKey = process.env.CONNECTNETWORK_ADMIN_API_KEY

export async function controlRequest(path: string, init: RequestInit = {}) {
  if (!baseUrl || !apiKey) throw new Error('ConnectNetwork control API is not configured')
  const response = await fetch(new URL(path, baseUrl), { ...init, headers: { 'Content-Type': 'application/json', 'x-connectnetwork-admin-key': apiKey, ...(init.headers || {}) }, cache: 'no-store' })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Control API request failed')
  return body
}

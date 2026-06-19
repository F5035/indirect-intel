import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'indirect-intel-secret-2024')

// Global in-memory stores (reset on cold start — fine for MVP)
global._users = global._users || {}
global._alerts = global._alerts || {}
global._notifications = global._notifications || {}

export const users = global._users
export const alerts = global._alerts
export const notifications = global._notifications

export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'indirect-intel-salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password, hash) {
  return (await hashPassword(password)) === hash
}

export async function createToken(email) {
  return new SignJWT({ sub: email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload.sub
  } catch {
    return null
  }
}

export async function getAuthUser(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return null
  const email = await verifyToken(token)
  if (!email || !users[email]) return null
  return users[email]
}

export function requireSubscription(user) {
  return user?.subscription_active === true
}

export function addNotification(email, target, message) {
  if (!notifications[email]) notifications[email] = []
  notifications[email].push({
    id: notifications[email].length + 1,
    target,
    message,
    created_at: new Date().toISOString(),
    read: false,
  })
}

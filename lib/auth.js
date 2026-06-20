import { SignJWT, jwtVerify } from 'jose'
import { supabaseAdmin } from './supabase'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'indirect-intel-secret-2024')

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
  if (!email) return null

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !user) return null
  return user
}

export function requireSubscription(user) {
  return user?.subscription_active === true
}

export async function addNotification(email, target, message) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (!user) return

  await supabaseAdmin.from('notifications').insert({
    user_id: user.id,
    target,
    message,
    read: false,
  })
}

import { NextResponse } from 'next/server'
import { users, hashPassword, createToken } from '@/lib/auth'

export async function POST(request) {
  const { email, password, company_name } = await request.json()
  if (!email || !password || !company_name)
    return NextResponse.json({ detail: 'Faltan campos requeridos' }, { status: 400 })
  if (users[email])
    return NextResponse.json({ detail: 'Email ya registrado' }, { status: 400 })
  users[email] = {
    email,
    password_hash: await hashPassword(password),
    company_name,
    subscription_active: true,
    subscription_until: new Date(Date.now() + 30 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  }
  const token = await createToken(email)
  return NextResponse.json({ access_token: token, token_type: 'bearer', message: 'Registrado correctamente' })
}

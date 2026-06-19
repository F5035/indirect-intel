import { NextResponse } from 'next/server'
import { users, verifyPassword, createToken } from '@/lib/auth'

export async function POST(request) {
  const { email, password } = await request.json()
  const user = users[email]
  if (!user || !(await verifyPassword(password, user.password_hash)))
    return NextResponse.json({ detail: 'Credenciales inválidas' }, { status: 401 })
  const token = await createToken(email)
  return NextResponse.json({ access_token: token, token_type: 'bearer' })
}

import { NextResponse } from 'next/server'
import { verifyPassword, createToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  const { email, password } = await request.json()

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (!user || !(await verifyPassword(password, user.password_hash)))
    return NextResponse.json({ detail: 'Credenciales inválidas' }, { status: 401 })

  const token = await createToken(email)
  return NextResponse.json({ access_token: token, token_type: 'bearer' })
}

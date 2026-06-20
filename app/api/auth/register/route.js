import { NextResponse } from 'next/server'
import { hashPassword, createToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  const { email, password, company_name } = await request.json()
  if (!email || !password || !company_name)
    return NextResponse.json({ detail: 'Faltan campos requeridos' }, { status: 400 })

  // Verificar si ya existe
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existing)
    return NextResponse.json({ detail: 'Email ya registrado' }, { status: 400 })

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert({
      email,
      password_hash: await hashPassword(password),
      company_name,
      subscription_active: true,
      subscription_until: new Date(Date.now() + 30 * 86400000).toISOString(),
    })
    .select()
    .single()

  if (error)
    return NextResponse.json({ detail: 'Error al registrar usuario' }, { status: 500 })

  const token = await createToken(email)
  return NextResponse.json({ access_token: token, token_type: 'bearer', message: 'Registrado correctamente' })
}

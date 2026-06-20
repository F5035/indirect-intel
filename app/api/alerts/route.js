import { NextResponse } from 'next/server'
import { getAuthUser, requireSubscription, addNotification } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ detail: 'No autorizado' }, { status: 401 })
  if (!requireSubscription(user)) return NextResponse.json({ detail: 'Suscripción requerida' }, { status: 403 })

  const { data: alerts } = await supabaseAdmin
    .from('alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ alerts: alerts || [] })
}

export async function POST(request) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ detail: 'No autorizado' }, { status: 401 })
  if (!requireSubscription(user)) return NextResponse.json({ detail: 'Suscripción requerida' }, { status: 403 })

  const { target, target_type, channel } = await request.json()

  const { data: alert, error } = await supabaseAdmin
    .from('alerts')
    .insert({ user_id: user.id, target, target_type, channel, active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ detail: 'Error al crear alerta' }, { status: 500 })

  await addNotification(user.email, target, `Alerta configurada para "${target}". Te notificaremos cuando haya novedades.`)

  return NextResponse.json({ message: 'Alerta configurada', alert })
}

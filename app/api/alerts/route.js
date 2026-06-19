import { NextResponse } from 'next/server'
import { getAuthUser, requireSubscription, alerts, addNotification } from '@/lib/auth'

export async function GET(request) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ detail: 'No autorizado' }, { status: 401 })
  if (!requireSubscription(user)) return NextResponse.json({ detail: 'Suscripción requerida' }, { status: 403 })
  return NextResponse.json({ alerts: alerts[user.email] || [] })
}

export async function POST(request) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ detail: 'No autorizado' }, { status: 401 })
  if (!requireSubscription(user)) return NextResponse.json({ detail: 'Suscripción requerida' }, { status: 403 })
  const { target, target_type, channel } = await request.json()
  if (!alerts[user.email]) alerts[user.email] = []
  const alert = { id: Date.now(), target, target_type, channel, created_at: new Date().toISOString(), active: true }
  alerts[user.email].push(alert)
  addNotification(user.email, target, `Alerta configurada para "${target}". Te notificaremos cuando haya novedades.`)
  return NextResponse.json({ message: 'Alerta configurada', alert })
}

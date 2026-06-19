import { NextResponse } from 'next/server'
import { getAuthUser, requireSubscription, notifications } from '@/lib/auth'

export async function GET(request) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ detail: 'No autorizado' }, { status: 401 })
  if (!requireSubscription(user)) return NextResponse.json({ detail: 'Suscripción requerida' }, { status: 403 })
  return NextResponse.json({ notifications: notifications[user.email] || [] })
}

import { NextResponse } from 'next/server'
import { getAuthUser, alerts } from '@/lib/auth'

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ detail: 'No autorizado' }, { status: 401 })
  const id = Number(params.id)
  if (alerts[user.email]) alerts[user.email] = alerts[user.email].filter(a => a.id !== id)
  return NextResponse.json({ message: 'Alerta eliminada' })
}

import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ detail: 'No autorizado' }, { status: 401 })

  await supabaseAdmin
    .from('alerts')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  return NextResponse.json({ message: 'Alerta eliminada' })
}

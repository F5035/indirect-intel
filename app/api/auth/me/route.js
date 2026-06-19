import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

export async function GET(request) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ detail: 'No autorizado' }, { status: 401 })
  return NextResponse.json({
    email: user.email,
    company_name: user.company_name,
    subscription_active: user.subscription_active,
    subscription_until: user.subscription_until,
  })
}

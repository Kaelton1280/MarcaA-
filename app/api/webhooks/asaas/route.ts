import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const token = request.headers.get('asaas-webhook-token')
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { event, payment } = body

  if (!payment?.externalReference) {
    return NextResponse.json({ ok: true })
  }

  const userId = payment.externalReference

  const statusMap: Record<string, string> = {
    PAYMENT_RECEIVED: 'active',
    PAYMENT_CONFIRMED: 'active',
    PAYMENT_OVERDUE: 'inactive',
    PAYMENT_DELETED: 'inactive',
    SUBSCRIPTION_INACTIVATED: 'inactive',
    SUBSCRIPTION_DELETED: 'inactive',
  }

  const newStatus = statusMap[event]

  if (newStatus) {
    await prisma.subscription.upsert({
      where: { userId },
      update: { status: newStatus },
      create: {
        userId,
        status: newStatus,
        asaasCustomerId: payment.customer,
        asaasSubscriptionId: payment.subscription,
      },
    })
  }

  return NextResponse.json({ ok: true })
}

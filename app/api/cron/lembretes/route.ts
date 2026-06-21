import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp } from '@/lib/zapi'

// Horário de Brasília para a mensagem do cliente
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Janelas de ±1h para cobrir qualquer intervalo de cron (recomendado: rodar 1×/hora)
  const w24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  const w24hEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000)
  const w2hStart  = new Date(now.getTime() + 1  * 60 * 60 * 1000)
  const w2hEnd    = new Date(now.getTime() + 3  * 60 * 60 * 1000)

  const [appts24h, appts2h] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        status: 'scheduled',
        reminderSent: false,
        startsAt: { gte: w24hStart, lte: w24hEnd },
      },
      include: {
        client:  { select: { name: true, phone: true } },
        service: { select: { name: true } },
      },
    }),
    prisma.appointment.findMany({
      where: {
        status: 'scheduled',
        reminder2hSent: false,
        startsAt: { gte: w2hStart, lte: w2hEnd },
      },
      include: {
        client:  { select: { name: true, phone: true } },
        service: { select: { name: true } },
      },
    }),
  ])

  let sent = 0
  const errors: string[] = []

  // ── Lembretes 24h ────────────────────────────────────────────────────────
  for (const appt of appts24h) {
    const hora = fmtTime(appt.startsAt.toISOString())
    const msg =
      `Olá, ${appt.client.name}! 👋\n` +
      `Lembrando que você tem um horário *amanhã* às *${hora}*.\n` +
      `Serviço: ${appt.service.name}\n\n` +
      `Até lá! ✂️ _MarcaAí_`

    try {
      await sendWhatsApp(appt.client.phone, msg)
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSent: true },
      })
      sent++
    } catch (err) {
      errors.push(`24h | ${appt.id}: ${String(err)}`)
    }
  }

  // ── Lembretes 2h ─────────────────────────────────────────────────────────
  for (const appt of appts2h) {
    const hora = fmtTime(appt.startsAt.toISOString())
    const msg =
      `Olá, ${appt.client.name}! ⏰\n` +
      `Seu horário de *${appt.service.name}* é daqui a pouco, às *${hora}*.\n\n` +
      `Te esperamos! ✂️ _MarcaAí_`

    try {
      await sendWhatsApp(appt.client.phone, msg)
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminder2hSent: true },
      })
      sent++
    } catch (err) {
      errors.push(`2h | ${appt.id}: ${String(err)}`)
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    ...(errors.length > 0 && { errors }),
  })
}

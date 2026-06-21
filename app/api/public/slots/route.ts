import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const userId    = searchParams.get('userId')
  const date      = searchParams.get('date')
  const serviceId = searchParams.get('serviceId')
  const staffId   = searchParams.get('staffId') ?? undefined

  if (!userId || !date || !serviceId) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, userId, active: true },
    select: { duration: true },
  })
  if (!service) {
    return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })
  }

  const dayStart = new Date(`${date}T00:00:00`)
  const dayEnd   = new Date(`${date}T23:59:59`)

  // Se staffId fornecido, conflitos são por profissional; senão, por conta geral
  const existing = await prisma.appointment.findMany({
    where: {
      userId,
      status: 'scheduled',
      startsAt: { gte: dayStart, lte: dayEnd },
      ...(staffId ? { staffId } : {}),
    },
    select: { startsAt: true, endsAt: true },
  })

  const allSlots: string[] = []
  for (let h = 8; h <= 19; h++) {
    allSlots.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 19) allSlots.push(`${String(h).padStart(2, '0')}:30`)
  }

  const now = new Date()

  const available = allSlots.filter((slot) => {
    const slotStart = new Date(`${date}T${slot}:00-03:00`)
    if (slotStart <= now) return false

    const slotEnd = new Date(slotStart.getTime() + service.duration * 60 * 1000)

    const endBRTStr = slotEnd.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    })
    const [endH, endM] = endBRTStr.split(':').map(Number)
    if (endH > 19 || (endH === 19 && endM > 0)) return false

    return !existing.some(
      (appt) => appt.startsAt < slotEnd && appt.endsAt > slotStart,
    )
  })

  return NextResponse.json({ slots: available })
}

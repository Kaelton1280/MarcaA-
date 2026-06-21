import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { userId, serviceId, staffId, date, time, clientName, clientPhone } = body

  if (!userId || !serviceId || !date || !time || !clientName || !clientPhone) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
  }

  const professional = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!professional) {
    return NextResponse.json({ error: 'Profissional não encontrado.' }, { status: 404 })
  }

  // Valida staff se informado
  if (staffId) {
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, userId, active: true },
      select: { id: true },
    })
    if (!staff) {
      return NextResponse.json({ error: 'Profissional da equipe não disponível.' }, { status: 404 })
    }
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, userId, active: true },
    select: { id: true, duration: true },
  })
  if (!service) {
    return NextResponse.json({ error: 'Serviço não disponível.' }, { status: 404 })
  }

  const startsAt = new Date(`${date}T${time}:00-03:00`)
  const endsAt   = new Date(startsAt.getTime() + service.duration * 60 * 1000)

  if (isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: 'Data ou hora inválida.' }, { status: 400 })
  }

  // Conflito por staff (se selecionado) ou por conta geral
  const conflict = await prisma.appointment.findFirst({
    where: {
      userId,
      status: 'scheduled',
      ...(staffId ? { staffId } : {}),
      AND: [{ startsAt: { lt: endsAt } }, { endsAt: { gt: startsAt } }],
    },
  })
  if (conflict) {
    return NextResponse.json(
      { error: 'Horário não disponível. Por favor, escolha outro.' },
      { status: 409 },
    )
  }

  const phoneDigits = clientPhone.replace(/\D/g, '')
  const phoneSuffix = phoneDigits.slice(-9)

  let client = await prisma.client.findFirst({
    where: { userId, phone: { endsWith: phoneSuffix } },
  })

  if (!client) {
    client = await prisma.client.create({
      data: { userId, name: clientName.trim(), phone: clientPhone.trim() },
    })
  }

  await prisma.appointment.create({
    data: {
      userId,
      clientId: client.id,
      serviceId: service.id,
      staffId: staffId ?? null,
      startsAt,
      endsAt,
      status: 'scheduled',
    },
  })

  return NextResponse.json({ ok: true })
}

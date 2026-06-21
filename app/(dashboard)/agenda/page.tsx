import { redirect } from 'next/navigation'
import { startOfWeek, addDays, startOfDay, endOfDay } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AgendaSemana } from '@/components/app/agenda-semana'

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  // Usar T12:00:00 para evitar problemas de data ao cruzar meia-noite entre fusos
  const baseDate = params.semana
    ? new Date(`${params.semana}T12:00:00`)
    : new Date()

  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 }) // Segunda-feira
  const weekEnd = addDays(weekStart, 5)                         // Sábado

  const [appointments, clients, services] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        userId: user.id,
        startsAt: {
          gte: startOfDay(weekStart),
          lte: endOfDay(weekEnd),
        },
      },
      include: {
        client: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, duration: true } },
      },
      orderBy: { startsAt: 'asc' },
    }),
    prisma.client.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.service.findMany({
      where: { userId: user.id, active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, duration: true, price: true },
    }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Agenda</h1>
        <p className="text-sm text-muted-foreground">Visualize e gerencie seus agendamentos</p>
      </div>
      <AgendaSemana
        weekStartISO={weekStart.toISOString()}
        appointments={appointments.map((a) => ({
          id: a.id,
          startsAt: a.startsAt.toISOString(),
          endsAt: a.endsAt.toISOString(),
          status: a.status,
          clientId: a.clientId,
          clientName: a.client.name,
          serviceId: a.serviceId,
          serviceName: a.service.name,
          serviceDuration: a.service.duration,
        }))}
        clients={clients}
        services={services.map((s) => ({ ...s, price: Number(s.price) }))}
      />
    </div>
  )
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
}

export async function createAgendamento(data: {
  clientId: string
  serviceId: string
  date: string    // YYYY-MM-DD
  time: string    // HH:MM
  duration: number
}) {
  const user = await getAuthUser()

  // -03:00 = horário de Brasília; garante armazenamento UTC correto independente do TZ do servidor
  const startsAt = new Date(`${data.date}T${data.time}:00-03:00`)
  const endsAt = new Date(startsAt.getTime() + data.duration * 60 * 1000)

  await prisma.appointment.create({
    data: {
      userId: user.id,
      clientId: data.clientId,
      serviceId: data.serviceId,
      startsAt,
      endsAt,
      status: 'scheduled',
    },
  })

  revalidatePath('/agenda')
}

export async function updateAgendamentoStatus(
  id: string,
  status: 'completed' | 'cancelled' | 'no_show',
) {
  const user = await getAuthUser()

  await prisma.appointment.updateMany({
    where: { id, userId: user.id },
    data: { status },
  })

  revalidatePath('/agenda')
}

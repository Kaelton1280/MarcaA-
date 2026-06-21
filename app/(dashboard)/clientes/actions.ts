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

export async function createCliente(data: { name: string; phone: string; notes: string }) {
  const user = await getAuthUser()

  await prisma.client.create({
    data: {
      userId: user.id,
      name: data.name.trim(),
      phone: data.phone.trim(),
      notes: data.notes.trim() || null,
    },
  })

  revalidatePath('/clientes')
}

export async function updateCliente(
  id: string,
  data: { name: string; phone: string; notes: string },
) {
  const user = await getAuthUser()

  await prisma.client.updateMany({
    where: { id, userId: user.id },
    data: {
      name: data.name.trim(),
      phone: data.phone.trim(),
      notes: data.notes.trim() || null,
    },
  })

  revalidatePath('/clientes')
}

export async function deleteCliente(id: string) {
  const user = await getAuthUser()

  try {
    await prisma.client.deleteMany({
      where: { id, userId: user.id },
    })
  } catch {
    throw new Error('Não é possível excluir um cliente com agendamentos vinculados.')
  }

  revalidatePath('/clientes')
}

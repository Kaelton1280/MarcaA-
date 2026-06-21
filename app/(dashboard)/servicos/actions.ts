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

export async function createServico(data: { name: string; duration: number; price: number }) {
  const user = await getAuthUser()

  await prisma.service.create({
    data: {
      userId: user.id,
      name: data.name.trim(),
      duration: data.duration,
      price: data.price,
    },
  })

  revalidatePath('/servicos')
}

export async function updateServico(
  id: string,
  data: { name: string; duration: number; price: number; active: boolean },
) {
  const user = await getAuthUser()

  await prisma.service.updateMany({
    where: { id, userId: user.id },
    data: {
      name: data.name.trim(),
      duration: data.duration,
      price: data.price,
      active: data.active,
    },
  })

  revalidatePath('/servicos')
}

export async function toggleServico(id: string, active: boolean) {
  const user = await getAuthUser()

  await prisma.service.updateMany({
    where: { id, userId: user.id },
    data: { active },
  })

  revalidatePath('/servicos')
}

export async function deleteServico(id: string) {
  const user = await getAuthUser()

  try {
    await prisma.service.deleteMany({
      where: { id, userId: user.id },
    })
  } catch {
    throw new Error('Não é possível excluir um serviço com agendamentos vinculados.')
  }

  revalidatePath('/servicos')
}

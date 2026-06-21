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

export async function createStaff(data: {
  name: string
  specialty: string
  avatarUrl?: string
}) {
  const user = await getAuthUser()
  await prisma.staff.create({
    data: {
      userId: user.id,
      name: data.name.trim(),
      specialty: data.specialty.trim() || null,
      avatarUrl: data.avatarUrl ?? null,
    },
  })
  revalidatePath('/profissionais')
}

export async function updateStaff(id: string, data: {
  name: string
  specialty: string
  avatarUrl?: string
}) {
  const user = await getAuthUser()
  await prisma.staff.updateMany({
    where: { id, userId: user.id },
    data: {
      name: data.name.trim(),
      specialty: data.specialty.trim() || null,
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
    },
  })
  revalidatePath('/profissionais')
}

export async function toggleStaff(id: string, active: boolean) {
  const user = await getAuthUser()
  await prisma.staff.updateMany({
    where: { id, userId: user.id },
    data: { active },
  })
  revalidatePath('/profissionais')
}

export async function deleteStaff(id: string) {
  const user = await getAuthUser()
  await prisma.staff.deleteMany({
    where: { id, userId: user.id },
  })
  revalidatePath('/profissionais')
}

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

export async function updatePerfil(data: {
  name: string
  salonName: string
  phone: string
}) {
  const user = await getAuthUser()

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name.trim() || null,
      salonName: data.salonName.trim() || null,
      phone: data.phone.trim() || null,
    },
  })

  revalidatePath('/configuracoes')
}

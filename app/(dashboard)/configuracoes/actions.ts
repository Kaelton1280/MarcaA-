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
  slug: string
}) {
  const user = await getAuthUser()

  const slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || null

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name.trim() || null,
        salonName: data.salonName.trim() || null,
        phone: data.phone.trim() || null,
        slug,
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('Unique constraint') && msg.includes('slug')) {
      return { error: 'Este link já está em uso. Escolha outro.' }
    }
    throw e
  }

  revalidatePath('/configuracoes')
  return { error: null }
}

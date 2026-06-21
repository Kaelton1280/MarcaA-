import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PerfilForm } from '@/components/app/perfil-form'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, salonName: true, phone: true, email: true },
  })

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edite as informações do seu perfil e do seu salão.
        </p>
      </div>

      <PerfilForm
        initialName={profile?.name ?? ''}
        initialSalonName={profile?.salonName ?? ''}
        initialPhone={profile?.phone ?? ''}
        email={profile?.email ?? user.email ?? ''}
      />
    </div>
  )
}

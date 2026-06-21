import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ProfissionaisTable } from '@/components/app/profissionais-table'

export default async function ProfissionaisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await prisma.staff.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      specialty: true,
      avatarUrl: true,
      active: true,
      _count: { select: { appointments: true } },
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Profissionais</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie a equipe que aparece para os clientes na hora do agendamento.
        </p>
      </div>
      <ProfissionaisTable staff={staff} />
    </div>
  )
}

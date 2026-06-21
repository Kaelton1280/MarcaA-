import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ServicosTable } from '@/components/app/servicos-table'

export default async function ServicosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rows = await prisma.service.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  })

  const servicos = rows.map((s) => ({
    id: s.id,
    name: s.name,
    duration: s.duration,
    price: Number(s.price),
    active: s.active,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Serviços</h1>
        <p className="text-sm text-muted-foreground">Gerencie os serviços que você oferece</p>
      </div>
      <ServicosTable servicos={servicos} />
    </div>
  )
}

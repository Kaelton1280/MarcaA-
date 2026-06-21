import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ClientesTable } from '@/components/app/clientes-table'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rows = await prisma.client.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      phone: true,
      notes: true,
      createdAt: true,
      _count: { select: { appointments: true } },
    },
  })

  const clientes = rows.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    notes: c.notes ?? '',
    createdAt: c.createdAt.toISOString(),
    totalAppointments: c._count.appointments,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua carteira de clientes</p>
      </div>
      <ClientesTable clientes={clientes} />
    </div>
  )
}

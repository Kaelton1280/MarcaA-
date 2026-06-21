import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BookingFlow } from '@/components/public/booking-flow'

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId: param } = await params

  const professional = await prisma.user.findFirst({
    where: { OR: [{ slug: param }, { id: param }] },
    select: { id: true, name: true, email: true, salonName: true },
  })

  if (!professional) notFound()

  const userId = professional.id

  const [services, staffMembers] = await Promise.all([
    prisma.service.findMany({
      where: { userId, active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, duration: true, price: true },
    }),
    prisma.staff.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, specialty: true, avatarUrl: true },
    }),
  ])

  const displayName = professional.name ?? professional.email
  const salonTitle = professional.salonName ?? 'MarcaAí'

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 pt-10 pb-20">

        {/* Aurora blobs */}
        <div className="absolute -top-10 left-1/4 h-64 w-64 rounded-full bg-indigo-600/25 blur-[90px]" />
        <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-violet-600/20 blur-[70px]" />
        <div className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/10 blur-[60px]" />

        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #a5b4fc 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Conteúdo hero */}
        <div className="relative z-10 flex flex-col items-center text-center">

          {/* Branding */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-xs text-indigo-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
            Agendamento online via MarcaAí ✂️
          </div>

          {/* Avatar */}
          <div className="relative mb-5">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-4xl font-bold text-white shadow-xl shadow-indigo-900/60">
              {salonTitle[0].toUpperCase()}
            </div>
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full ring-4 ring-indigo-400/30 ring-offset-4 ring-offset-transparent" />
          </div>

          {/* Nome do salão */}
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            {salonTitle}
          </h1>
          <p className="mt-3 text-sm text-indigo-200/70">
            {staffMembers.length > 0
              ? 'Escolha o profissional e agende seu horário'
              : 'Escolha um serviço e agende seu horário'}
          </p>
        </div>
      </div>

      {/* ── Formulário ────────────────────────────────────────────────────── */}
      {/* -mt-8 cria sobreposição suave sobre o hero */}
      <div className="relative z-10 mx-auto max-w-lg -mt-8 px-4 pb-12">
        {services.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center text-muted-foreground shadow-sm">
            Nenhum serviço disponível no momento.
          </div>
        ) : (
          <BookingFlow
            userId={userId}
            professionalName={displayName!}
            services={services.map((s) => ({ ...s, price: Number(s.price) }))}
            staffList={staffMembers}
          />
        )}
      </div>

    </main>
  )
}

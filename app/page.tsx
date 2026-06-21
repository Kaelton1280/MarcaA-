import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">

      {/* Aurora background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950" />
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-600/25 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, #a5b4fc 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Conteúdo */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-10 px-4 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
          14 dias grátis · Sem cartão de crédito
        </div>

        {/* Heading */}
        <div className="flex max-w-2xl flex-col items-center gap-5">
          <h1 className="text-6xl font-bold tracking-tight text-white md:text-7xl">
            Sua agenda,{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              do seu jeito
            </span>
          </h1>
          <p className="text-lg leading-relaxed text-slate-400 md:text-xl">
            Plataforma de agendamento para barbeiros, cabeleireiros e profissionais da beleza.
            Organize sua semana, reduza faltas e aumente seu faturamento.
          </p>
        </div>

        {/* Features rápidas */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-400">
          {[
            'Agendamento online',
            'Lembretes via WhatsApp',
            'Controle de clientes',
            'Relatório de faturamento',
          ].map((f) => (
            <span key={f} className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
          >
            Começar grátis
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:-translate-y-0.5"
          >
            Já tenho conta
          </Link>
        </div>

        {/* Social proof */}
        <p className="text-xs text-slate-600">
          MarcaAí · Feito para profissionais da beleza no Brasil
        </p>
      </div>
    </main>
  )
}

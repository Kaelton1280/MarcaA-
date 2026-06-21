import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'

// ─── Helpers de data (UTC puro para consistência com a agenda) ────────────────

function utcStartOfDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function utcStartOfWeek(d: Date) {
  const dow = d.getUTCDay() || 7 // dom=7
  const monday = new Date(utcStartOfDay(d))
  monday.setUTCDate(monday.getUTCDate() - (dow - 1))
  return monday
}

function utcStartOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

function fmtDate(date: Date) {
  const d = String(date.getUTCDate()).padStart(2, '0')
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const y = String(date.getUTCFullYear()).slice(2)
  return `${d}/${m}/${y}`
}

// ─── Sub-componentes (server) ─────────────────────────────────────────────────

function SummaryCard({
  label,
  count,
  total,
  accent = false,
}: {
  label: string
  count: number
  total: number
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        accent ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
      }`}
    >
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>
        {formatCurrency(total)}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {count} atendimento{count !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FaturamentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const startOfMonth = utcStartOfMonth(now)
  const ninetyDaysAgo = new Date(now)
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90)

  const [mesAtual, recentes] = await Promise.all([
    // Atendimentos concluídos deste mês (para stats + top serviços)
    prisma.appointment.findMany({
      where: {
        userId: user.id,
        status: 'completed',
        startsAt: { gte: startOfMonth },
      },
      include: {
        service: { select: { name: true, price: true } },
        client: { select: { name: true } },
      },
      orderBy: { startsAt: 'desc' },
    }),
    // Últimos 30 atendimentos concluídos (pode incluir meses anteriores)
    prisma.appointment.findMany({
      where: {
        userId: user.id,
        status: 'completed',
        startsAt: { gte: ninetyDaysAgo },
      },
      include: {
        service: { select: { name: true, price: true } },
        client: { select: { name: true } },
      },
      orderBy: { startsAt: 'desc' },
      take: 30,
    }),
  ])

  // ── Cálculo de stats ────────────────────────────────────────────────────────
  const startOfToday = utcStartOfDay(now)
  const startOfWeek = utcStartOfWeek(now)

  const apptHoje = mesAtual.filter((a) => a.startsAt >= startOfToday)
  const apptSemana = mesAtual.filter((a) => a.startsAt >= startOfWeek)

  const totalHoje = apptHoje.reduce((s, a) => s + Number(a.service.price), 0)
  const totalSemana = apptSemana.reduce((s, a) => s + Number(a.service.price), 0)
  const totalMes = mesAtual.reduce((s, a) => s + Number(a.service.price), 0)

  // ── Top serviços do mês ─────────────────────────────────────────────────────
  const svcMap = new Map<string, { name: string; count: number; total: number }>()
  for (const a of mesAtual) {
    const cur = svcMap.get(a.service.name) ?? { name: a.service.name, count: 0, total: 0 }
    svcMap.set(a.service.name, {
      name: cur.name,
      count: cur.count + 1,
      total: cur.total + Number(a.service.price),
    })
  }
  const topServicos = [...svcMap.values()].sort((a, b) => b.total - a.total).slice(0, 5)
  const maxTotal = topServicos[0]?.total ?? 1

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold">Faturamento</h1>
        <p className="text-sm text-muted-foreground">Acompanhe sua receita por período</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Hoje" count={apptHoje.length} total={totalHoje} />
        <SummaryCard label="Esta semana" count={apptSemana.length} total={totalSemana} accent />
        <SummaryCard label="Este mês" count={mesAtual.length} total={totalMes} />
      </div>

      {/* Corpo */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* Top serviços — 2 colunas */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold">Top serviços do mês</h2>
          {topServicos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum atendimento concluído este mês.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {topServicos.map((s) => (
                <div key={s.name}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{s.name}</span>
                    <span className="flex-shrink-0 text-muted-foreground text-xs">
                      {formatCurrency(s.total)} · {s.count}×
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(s.total / maxTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico recente — 3 colunas */}
        <div className="lg:col-span-3 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Atendimentos recentes</h2>
          </div>

          {recentes.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Nenhum atendimento concluído ainda.
            </div>
          ) : (
            <div className="divide-y divide-border overflow-auto max-h-[480px]">
              {recentes.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.service.name} · {fmtDate(a.startsAt)}
                    </p>
                  </div>
                  <span className="ml-4 flex-shrink-0 text-sm font-semibold text-emerald-600">
                    + {formatCurrency(Number(a.service.price))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

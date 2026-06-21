'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createAgendamento, updateAgendamentoStatus } from '@/app/(dashboard)/agenda/actions'

// ─── Types ───────────────────────────────────────────────────────────────────

type Appointment = {
  id: string
  startsAt: string
  endsAt: string
  status: string
  clientId: string
  clientName: string
  serviceId: string
  serviceName: string
  serviceDuration: number
}

type Client = { id: string; name: string }
type Service = { id: string; name: string; duration: number; price: number }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  completed: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  cancelled: 'bg-slate-100 border-slate-200 text-slate-400',
  no_show: 'bg-orange-50 border-orange-200 text-orange-700',
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Faltou',
}

// Converte UTC para horário de Brasília (UTC-3) para exibição
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function addMinToTime(time: string, min: number) {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + min
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function toDateISO(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function apptBelongsToDay(apptISO: string, day: Date) {
  return apptISO.startsWith(toDateISO(day))
}

function fmtDuration(min: number) {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AgendaSemana({
  weekStartISO,
  appointments,
  clients,
  services,
}: {
  weekStartISO: string
  appointments: Appointment[]
  clients: Client[]
  services: Service[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('09:00')
  const [clientId, setClientId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // Constrói os 6 dias da semana usando UTC para evitar problemas de fuso
  const weekStart = new Date(weekStartISO)
  const days = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(weekStart)
    d.setUTCDate(d.getUTCDate() + i)
    return d
  })

  const now = new Date()
  const todayStr = toDateISO(now)
  const weekLabel = `${days[0].getUTCDate()} ${MONTHS[days[0].getUTCMonth()]} – ${days[5].getUTCDate()} ${MONTHS[days[5].getUTCMonth()]} ${days[0].getUTCFullYear()}`
  const totalSemana = appointments.filter((a) => a.status !== 'cancelled').length

  function navigate(offset: number) {
    const next = new Date(weekStart)
    next.setUTCDate(next.getUTCDate() + offset * 7)
    router.push(`/agenda?semana=${toDateISO(next)}`)
  }

  function openModal(dayISO?: string) {
    setFormDate(dayISO ?? todayStr)
    setFormTime('09:00')
    setClientId('')
    setServiceId('')
    setFormError(null)
    setModalOpen(true)
  }

  const selectedService = services.find((s) => s.id === serviceId)
  const endTime = selectedService ? addMinToTime(formTime, selectedService.duration) : ''

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId) { setFormError('Selecione o cliente.'); return }
    if (!serviceId) { setFormError('Selecione o serviço.'); return }
    setFormError(null)

    startTransition(async () => {
      await createAgendamento({
        clientId,
        serviceId,
        date: formDate,
        time: formTime,
        duration: selectedService!.duration,
      })
      setModalOpen(false)
    })
  }

  function handleStatus(id: string, status: 'completed' | 'cancelled' | 'no_show') {
    const labels = { completed: 'concluído', cancelled: 'cancelado', no_show: 'faltou' }
    if (!confirm(`Marcar este agendamento como ${labels[status]}?`)) return
    startTransition(async () => { await updateAgendamentoStatus(id, status) })
  }

  return (
    <>
      {/* Controles da semana */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            ‹
          </button>
          <span className="min-w-[200px] text-center text-sm font-medium">{weekLabel}</span>
          <button
            onClick={() => navigate(1)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            ›
          </button>
          <button
            onClick={() => router.push('/agenda')}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Hoje
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {totalSemana} agendamento{totalSemana !== 1 ? 's' : ''} na semana
          </span>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <span className="text-base leading-none">+</span>
            Novo agendamento
          </button>
        </div>
      </div>

      {/* Grade semanal — 3 colunas no mobile, 6 no desktop */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {days.map((day, i) => {
          const dayStr = toDateISO(day)
          const isToday = dayStr === todayStr
          const dayAppts = appointments.filter((a) => apptBelongsToDay(a.startsAt, day))

          return (
            <div
              key={i}
              className={`flex flex-col overflow-hidden rounded-xl border bg-card ${
                isToday ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'
              }`}
            >
              {/* Cabeçalho do dia */}
              <div
                className={`px-2 py-2.5 text-center ${
                  isToday ? 'bg-primary text-primary-foreground' : 'bg-muted/40'
                }`}
              >
                <p className={`text-xs font-medium ${isToday ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {DAY_LABELS[i]}
                </p>
                <p className={`text-xl font-bold leading-tight ${isToday ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {day.getUTCDate()}
                </p>
              </div>

              {/* Agendamentos */}
              <div className="flex flex-1 flex-col gap-1.5 p-2">
                {dayAppts.length === 0 ? (
                  <button
                    onClick={() => openModal(dayStr)}
                    className="flex flex-1 min-h-[80px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground/40 transition-colors hover:border-primary/30 hover:text-primary/50"
                  >
                    livre
                  </button>
                ) : (
                  dayAppts.map((a) => (
                    <ApptCard
                      key={a.id}
                      appt={a}
                      onComplete={() => handleStatus(a.id, 'completed')}
                      onCancel={() => handleStatus(a.id, 'cancelled')}
                      onNoShow={() => handleStatus(a.id, 'no_show')}
                      isPending={isPending}
                    />
                  ))
                )}
              </div>

              {dayAppts.length > 0 && (
                <div className="px-2 pb-2">
                  <button
                    onClick={() => openModal(dayStr)}
                    className="w-full rounded-md border border-dashed border-border py-1 text-xs text-muted-foreground/40 transition-colors hover:border-primary/30 hover:text-primary/50"
                  >
                    + adicionar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal novo agendamento */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold">Novo agendamento</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {formError && (
                <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Data</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Horário</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Cliente</label>
                {clients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum cliente cadastrado.{' '}
                    <a href="/clientes" className="text-primary underline">Cadastrar agora</a>
                  </p>
                ) : (
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Selecione o cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Serviço</label>
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum serviço ativo.{' '}
                    <a href="/servicos" className="text-primary underline">Cadastrar agora</a>
                  </p>
                ) : (
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Selecione o serviço</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {fmtDuration(s.duration)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedService && (
                <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duração</span>
                    <span className="font-medium">{fmtDuration(selectedService.duration)}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-muted-foreground">Término</span>
                    <span className="font-medium">{endTime}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-semibold text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService.price)}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !clientId || !serviceId}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? 'Agendando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Card de agendamento ──────────────────────────────────────────────────────

function ApptCard({
  appt: a,
  onComplete,
  onCancel,
  onNoShow,
  isPending,
}: {
  appt: Appointment
  onComplete: () => void
  onCancel: () => void
  onNoShow: () => void
  isPending: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const style = STATUS_STYLES[a.status] ?? STATUS_STYLES.scheduled
  const isScheduled = a.status === 'scheduled'

  return (
    <div
      className={`rounded-lg border p-2 cursor-pointer select-none transition-all ${style}`}
      onClick={() => isScheduled && setExpanded((v) => !v)}
    >
      <p className="text-xs font-semibold tabular-nums">
        {fmtTime(a.startsAt)} – {fmtTime(a.endsAt)}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/40 text-[9px] font-bold">
          {getInitials(a.clientName)}
        </div>
        <p className="truncate text-xs font-medium">{a.clientName}</p>
      </div>
      <p className="mt-0.5 truncate text-xs opacity-70">{a.serviceName}</p>

      {!isScheduled && (
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide opacity-60">
          {STATUS_LABELS[a.status] ?? a.status}
        </p>
      )}

      {expanded && isScheduled && (
        <div
          className="mt-2 flex flex-col gap-1 border-t border-current/20 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onComplete}
            disabled={isPending}
            className="w-full rounded bg-emerald-600 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            ✓ Concluir
          </button>
          <button
            onClick={onNoShow}
            disabled={isPending}
            className="w-full rounded bg-orange-500 py-1 text-[10px] font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            Faltou
          </button>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="w-full rounded bg-slate-400 py-1 text-[10px] font-semibold text-white hover:bg-slate-500 disabled:opacity-50"
          >
            ✗ Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

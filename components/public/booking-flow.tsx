'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'

type Service = { id: string; name: string; duration: number; price: number }
type StaffMember = { id: string; name: string; specialty: string | null; avatarUrl: string | null }

function fmtDuration(min: number) {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  const isCell = d.length > 10
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (isCell) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
}

function fmtDateBR(iso: string) {
  return iso.split('-').reverse().join('/')
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function BookingFlow({
  userId,
  professionalName,
  services,
  staffList,
}: {
  userId: string
  professionalName: string
  services: Service[]
  staffList: StaffMember[]
}) {
  const hasStaff = staffList.length > 0

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedTime, setSelectedTime] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  // When staff changes, reset downstream selections
  function handleStaffSelect(s: StaffMember) {
    setSelectedStaff(s)
    setSelectedService(null)
    setSelectedDate('')
    setSlots([])
    setSelectedTime('')
  }

  async function handleServiceSelect(s: Service) {
    setSelectedService(s)
    setSelectedDate('')
    setSlots([])
    setSelectedTime('')
  }

  async function handleDateChange(date: string) {
    setSelectedDate(date)
    setSelectedTime('')
    setSlots([])
    if (!selectedService || !date) return

    setLoadingSlots(true)
    try {
      const params = new URLSearchParams({
        userId,
        date,
        serviceId: selectedService.id,
        ...(selectedStaff ? { staffId: selectedStaff.id } : {}),
      })
      const res = await fetch(`/api/public/slots?${params}`)
      const data = await res.json()
      setSlots(data.slots ?? [])
    } finally {
      setLoadingSlots(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientName.trim()) { setError('Informe seu nome.'); return }
    if (clientPhone.replace(/\D/g, '').length < 10) {
      setError('Informe um telefone com DDD.')
      return
    }

    setError(null)
    setSubmitting(true)

    const res = await fetch('/api/public/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        serviceId: selectedService!.id,
        staffId: selectedStaff?.id ?? null,
        date: selectedDate,
        time: selectedTime,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
      }),
    })

    if (res.ok) {
      setDone(true)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao confirmar. Tente novamente.')
      setSubmitting(false)
    }
  }

  // Step numbers depend on whether staff selection is shown
  const step = (n: number) => hasStaff ? n : n - 1

  // ── Tela de confirmação ────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 text-5xl">✅</div>
        <h2 className="text-xl font-bold text-emerald-800">Agendamento confirmado!</h2>
        <div className="mt-4 space-y-1 text-sm text-emerald-700">
          {selectedStaff && (
            <p><span className="font-medium">Profissional:</span> {selectedStaff.name}</p>
          )}
          <p><span className="font-medium">Serviço:</span> {selectedService?.name}</p>
          <p><span className="font-medium">Data:</span> {fmtDateBR(selectedDate)} às {selectedTime}</p>
          <p><span className="font-medium">Valor:</span> {formatCurrency(selectedService!.price)}</p>
        </div>
        <p className="mt-6 text-sm text-emerald-600">
          {selectedStaff ? selectedStaff.name : professionalName} vai te esperar. Até lá! 👋
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Step 1: Profissional (somente se há equipe cadastrada) ─────────── */}
      {hasStaff && (
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-foreground">1. Escolha o profissional</h2>
          <div className="flex flex-col gap-2">
            {staffList.map((s) => (
              <button
                key={s.id}
                onClick={() => handleStaffSelect(s)}
                className={`flex items-center gap-4 rounded-lg border p-4 text-left transition-all ${
                  selectedStaff?.id === s.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                {s.avatarUrl ? (
                  <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border border-border">
                    <Image src={s.avatarUrl} alt={s.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      selectedStaff?.id === s.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {getInitials(s.name)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{s.name}</p>
                  {s.specialty && (
                    <p className="text-sm text-muted-foreground">{s.specialty}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Step 2 (ou 1): Serviço ───────────────────────────────────────── */}
      {(!hasStaff || selectedStaff) && (
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-foreground">{step(2)}. Escolha o serviço</h2>
          <div className="flex flex-col gap-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => handleServiceSelect(s)}
                className={`flex items-center justify-between rounded-lg border p-4 text-left transition-all ${
                  selectedService?.id === s.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <div>
                  <p className="font-medium text-foreground">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{fmtDuration(s.duration)}</p>
                </div>
                <p className="font-semibold text-primary">{formatCurrency(s.price)}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Step 3 (ou 2): Data ──────────────────────────────────────────── */}
      {selectedService && (
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-foreground">{step(3)}. Escolha a data</h2>
          <input
            type="date"
            min={today}
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </section>
      )}

      {/* ── Step 4 (ou 3): Horário ───────────────────────────────────────── */}
      {selectedDate && selectedService && (
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-foreground">{step(4)}. Escolha o horário</h2>

          {loadingSlots ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Carregando horários...</p>
          ) : slots.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum horário disponível nesta data. Tente outro dia.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`rounded-md border py-2 text-sm font-medium transition-all ${
                    selectedTime === slot
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Step 5 (ou 4): Dados do cliente ─────────────────────────────── */}
      {selectedTime && (
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-foreground">{step(5)}. Seus dados</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Resumo */}
            <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm space-y-1">
              {selectedStaff && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profissional</span>
                  <span className="font-medium">{selectedStaff.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviço</span>
                <span className="font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data e hora</span>
                <span className="font-medium">{fmtDateBR(selectedDate)} às {selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-semibold text-primary">{formatCurrency(selectedService!.price)}</span>
              </div>
            </div>

            {error && (
              <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Seu nome</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Como prefere ser chamado(a)?"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Telefone (WhatsApp)</label>
              <input
                type="tel"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Confirmando...' : 'Confirmar agendamento'}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}

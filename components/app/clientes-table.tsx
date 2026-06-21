'use client'

import { useState, useTransition } from 'react'
import { createCliente, updateCliente, deleteCliente } from '@/app/(dashboard)/clientes/actions'

type Cliente = {
  id: string
  name: string
  phone: string
  notes: string
  createdAt: string
  totalAppointments: number
}

type ModalState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; cliente: Cliente }

function formatPhone(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  return digits
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

export function ClientesTable({ clientes }: { clientes: Cliente[] }) {
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const filtered = clientes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  )

  function openCreate() {
    setName(''); setPhone(''); setNotes(''); setFormError(null)
    setModal({ mode: 'create' })
  }

  function openEdit(c: Cliente) {
    setName(c.name); setPhone(c.phone); setNotes(c.notes); setFormError(null)
    setModal({ mode: 'edit', cliente: c })
  }

  function close() { setModal({ mode: 'closed' }); setFormError(null) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const rawPhone = phone.replace(/\D/g, '')
    if (!name.trim()) { setFormError('Informe o nome do cliente.'); return }
    if (rawPhone.length < 10) { setFormError('Informe um telefone válido com DDD.'); return }
    setFormError(null)

    startTransition(async () => {
      if (modal.mode === 'create') {
        await createCliente({ name, phone, notes })
      } else if (modal.mode === 'edit') {
        await updateCliente(modal.cliente.id, { name, phone, notes })
      }
      close()
    })
  }

  function handleDelete(c: Cliente) {
    if (!confirm(`Excluir "${c.name}"? Esta ação não pode ser desfeita.`)) return
    setActionError(null)
    startTransition(async () => {
      try {
        await deleteCliente(c.id)
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Erro ao excluir.')
      }
    })
  }

  return (
    <>
      {/* Barra superior */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:w-64"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'cliente' : 'clientes'}
          </span>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <span className="text-base leading-none">+</span>
            Novo cliente
          </button>
        </div>
      </div>

      {actionError && (
        <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {/* Lista vazia */}
      {clientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl">👤</div>
          <div>
            <p className="font-medium text-foreground">Nenhum cliente cadastrado</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Adicione seus clientes para começar a agendar.</p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Cadastrar primeiro cliente
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="font-medium text-foreground">Nenhum resultado para "{search}"</p>
          <p className="text-sm text-muted-foreground">Tente outro nome ou número.</p>
        </div>
      ) : (
        /* Tabela */
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Telefone</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Observações</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden sm:table-cell">Agendamentos</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(c.name)}
                      </div>
                      <span className="font-medium text-foreground">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-xs truncate">
                    {c.notes || <span className="italic opacity-40">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {c.totalAppointments}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        disabled={isPending}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal.mode !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold">
              {modal.mode === 'create' ? 'Novo cliente' : 'Editar cliente'}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {formError && (
                <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Nome completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Telefone (WhatsApp)</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">
                  Observações <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferências, alergias, etc."
                  rows={3}
                  className="resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? 'Salvando...' : modal.mode === 'create' ? 'Cadastrar' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState, useTransition } from 'react'
import {
  createServico,
  updateServico,
  toggleServico,
  deleteServico,
} from '@/app/(dashboard)/servicos/actions'
import { formatCurrency } from '@/lib/utils'

type Servico = { id: string; name: string; duration: number; price: number; active: boolean }

type ModalState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; servico: Servico }

const DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2h' },
  { value: 150, label: '2h 30min' },
  { value: 180, label: '3h' },
]

function fmtDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

export function ServicosTable({ servicos }: { servicos: Servico[] }) {
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [duration, setDuration] = useState(30)
  const [price, setPrice] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function openCreate() {
    setName(''); setDuration(30); setPrice(''); setFormError(null)
    setModal({ mode: 'create' })
  }

  function openEdit(s: Servico) {
    setName(s.name)
    setDuration(s.duration)
    setPrice(s.price.toFixed(2).replace('.', ','))
    setFormError(null)
    setModal({ mode: 'edit', servico: s })
  }

  function close() { setModal({ mode: 'closed' }); setFormError(null) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const priceNum = parseFloat(price.replace(',', '.'))
    if (!name.trim()) { setFormError('Informe o nome do serviço.'); return }
    if (isNaN(priceNum) || priceNum <= 0) { setFormError('Informe um preço válido (ex: 45,00).'); return }
    setFormError(null)

    startTransition(async () => {
      if (modal.mode === 'create') {
        await createServico({ name, duration, price: priceNum })
      } else if (modal.mode === 'edit') {
        await updateServico(modal.servico.id, { name, duration, price: priceNum, active: modal.servico.active })
      }
      close()
    })
  }

  function handleToggle(s: Servico) {
    startTransition(async () => { await toggleServico(s.id, !s.active) })
  }

  function handleDelete(s: Servico) {
    if (!confirm(`Excluir "${s.name}"? Esta ação não pode ser desfeita.`)) return
    setActionError(null)
    startTransition(async () => {
      try {
        await deleteServico(s.id)
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Erro ao excluir.')
      }
    })
  }

  return (
    <>
      {/* Barra superior */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {servicos.length} {servicos.length === 1 ? 'serviço' : 'serviços'} cadastrado{servicos.length === 1 ? '' : 's'}
        </span>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <span className="text-base leading-none">+</span>
          Novo serviço
        </button>
      </div>

      {actionError && (
        <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {/* Lista vazia */}
      {servicos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl">✂️</div>
          <div>
            <p className="font-medium text-foreground">Nenhum serviço cadastrado</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Adicione os serviços que você oferece para começar a agendar.</p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Cadastrar primeiro serviço
          </button>
        </div>
      ) : (
        /* Tabela */
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Serviço</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Duração</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Preço</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {servicos.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{fmtDuration(s.duration)}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{formatCurrency(s.price)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(s)}
                      disabled={isPending}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                        s.active
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} />
                      {s.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
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
              {modal.mode === 'create' ? 'Novo serviço' : 'Editar serviço'}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {formError && (
                <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Nome do serviço</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Corte masculino"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Duração</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Preço (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 45,00"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
                  {isPending ? 'Salvando...' : modal.mode === 'create' ? 'Criar serviço' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

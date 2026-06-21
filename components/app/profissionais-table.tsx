'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import { createStaff, updateStaff, toggleStaff, deleteStaff } from '@/app/(dashboard)/profissionais/actions'

type StaffItem = {
  id: string
  name: string
  specialty: string | null
  avatarUrl: string | null
  active: boolean
  _count: { appointments: number }
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function Avatar({
  avatarUrl,
  name,
  size = 'md',
  active = true,
}: {
  avatarUrl: string | null
  name: string
  size?: 'sm' | 'md'
  active?: boolean
}) {
  const dim = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-sm'

  if (avatarUrl) {
    return (
      <div className={`relative ${dim} flex-shrink-0 overflow-hidden rounded-full ${!active ? 'opacity-50 grayscale' : ''}`}>
        <Image src={avatarUrl} alt={name} fill className="object-cover" />
      </div>
    )
  }

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-bold ${dim} ${
        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      }`}
    >
      {getInitials(name)}
    </div>
  )
}

function StaffModal({
  initial,
  onClose,
}: {
  initial?: StaffItem
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [specialty, setSpecialty] = useState(initial?.specialty ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial?.avatarUrl ?? null)
  const [preview, setPreview] = useState<string | null>(initial?.avatarUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview imediato
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploadError(null)
    setUploading(true)

    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/staff/upload-avatar', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setUploadError(data.error ?? 'Erro no upload.')
        setPreview(avatarUrl) // reverte preview para a foto anterior
        return
      }

      setAvatarUrl(data.url)
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || uploading) return

    startTransition(async () => {
      if (initial) {
        await updateStaff(initial.id, {
          name,
          specialty,
          avatarUrl: avatarUrl ?? undefined,
        })
      } else {
        await createStaff({ name, specialty, avatarUrl: avatarUrl ?? undefined })
      }
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-5 text-lg font-semibold text-foreground">
          {initial ? 'Editar profissional' : 'Novo profissional'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Foto de perfil */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted/40 transition-colors hover:border-primary/50 hover:bg-muted/60"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <>
                  <Image src={preview} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-xs font-medium text-white">Trocar</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                  <span className="text-xs">Adicionar foto</span>
                </div>
              )}

              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <svg className="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <p className="text-xs text-muted-foreground">
              JPG, PNG ou WEBP · máximo 5 MB
            </p>

            {uploadError && (
              <p className="text-xs text-destructive">{uploadError}</p>
            )}
          </div>

          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Nome *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João Silva"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Especialidade */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Especialidade</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ex: Barbeiro, Cabeleireiro..."
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending || uploading || !name.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ProfissionaisTable({ staff }: { staff: StaffItem[] }) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<StaffItem | undefined>()
  const [, startTransition] = useTransition()

  function openNew() {
    setEditing(undefined)
    setShowModal(true)
  }

  function openEdit(item: StaffItem) {
    setEditing(item)
    setShowModal(true)
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(() => toggleStaff(id, !current))
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Remover "${name}"? Os agendamentos existentes não serão apagados.`)) return
    startTransition(() => deleteStaff(id))
  }

  return (
    <>
      {showModal && (
        <StaffModal
          initial={editing}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-sm text-muted-foreground">
            {staff.length === 0
              ? 'Nenhum profissional cadastrado ainda.'
              : `${staff.length} profissional${staff.length !== 1 ? 'is' : ''}`}
          </p>
          <button
            onClick={openNew}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            + Adicionar
          </button>
        </div>

        {staff.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <p className="text-4xl mb-3">👤</p>
            <p className="font-medium">Adicione os profissionais da sua equipe.</p>
            <p className="mt-1">Eles aparecerão para o cliente escolher na hora do agendamento.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {staff.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                <Avatar avatarUrl={item.avatarUrl} name={item.name} active={item.active} />

                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${item.active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.specialty ?? 'Sem especialidade'} &middot;{' '}
                    {item._count.appointments} agendamento{item._count.appointments !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(item.id, item.active)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      item.active
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {item.active ? 'Ativo' : 'Inativo'}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="rounded-md border border-destructive/30 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

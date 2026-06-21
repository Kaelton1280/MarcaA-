'use client'

import { useState, useTransition } from 'react'
import { updatePerfil } from '@/app/(dashboard)/configuracoes/actions'

export function PerfilForm({
  initialName,
  initialSalonName,
  initialPhone,
  initialSlug,
  email,
  appUrl,
}: {
  initialName: string
  initialSalonName: string
  initialPhone: string
  initialSlug: string
  email: string
  appUrl: string
}) {
  const [name, setName] = useState(initialName)
  const [salonName, setSalonName] = useState(initialSalonName)
  const [phone, setPhone] = useState(initialPhone)
  const [slug, setSlug] = useState(initialSlug)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)

  function handleSlugChange(v: string) {
    setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    setSlugError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    setSlugError(null)
    startTransition(async () => {
      const result = await updatePerfil({ name, salonName, phone, slug })
      if (result?.error) {
        setSlugError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  const previewSlug = slug || '...'
  const previewUrl = `${appUrl}/agendar/${previewSlug}`

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Seção: Salão */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold text-foreground">Seu salão</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Nome do salão
            </label>
            <input
              type="text"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              placeholder="Ex: Barbearia do João, Studio Silva..."
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              Este nome aparece no topo da página de agendamento dos clientes.
              Se não preencher, aparece "MarcaAí".
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Link personalizado
            </label>
            <div className="flex items-center rounded-md border border-border bg-background overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <span className="px-3 py-2 text-sm text-muted-foreground bg-muted/40 border-r border-border whitespace-nowrap">
                /agendar/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="minha-barbearia"
                className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
              />
            </div>
            {slugError ? (
              <p className="text-xs text-destructive">{slugError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Somente letras minúsculas, números e hífens. Seu link ficará:{' '}
                <span className="font-medium text-foreground">{previewUrl}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Seção: Seus dados */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold text-foreground">Seus dados</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Seu nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">E-mail</label>
            <input
              type="email"
              value={email}
              disabled
              className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado aqui.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Telefone / WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? 'Salvando...' : 'Salvar alterações'}
        </button>
        {saved && (
          <p className="text-sm text-emerald-600 font-medium">✓ Salvo com sucesso!</p>
        )}
      </div>
    </form>
  )
}

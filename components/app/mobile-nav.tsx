'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CopyLinkButton } from '@/components/app/copy-link-button'
import { LogoutButton } from '@/components/app/logout-button'

const navItems = [
  { href: '/agenda', label: 'Agenda' },
  { href: '/profissionais', label: 'Profissionais' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/faturamento', label: 'Faturamento' },
  { href: '/configuracoes', label: 'Configurações' },
]

export function MobileNav({
  email,
  copyLinkUrl,
}: {
  email: string
  copyLinkUrl: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Barra superior mobile */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <span className="font-bold text-lg">MarcaAí ✂️</span>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          aria-label="Abrir menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Overlay escuro */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer lateral */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 ease-in-out md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-5">
          <span className="font-bold text-lg">MarcaAí ✂️</span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            aria-label="Fechar menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t border-border px-2 py-4">
          <p className="truncate px-3 text-xs text-muted-foreground">{email}</p>
          <CopyLinkButton url={copyLinkUrl} />
          <LogoutButton />
        </div>
      </aside>
    </>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { LogoutButton } from '@/components/app/logout-button'
import { CopyLinkButton } from '@/components/app/copy-link-button'
import { MobileNav } from '@/components/app/mobile-nav'

const navItems = [
  { href: '/agenda', label: 'Agenda' },
  { href: '/profissionais', label: 'Profissionais' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/faturamento', label: 'Faturamento' },
  { href: '/configuracoes', label: 'Configurações' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email!,
      name: (user.user_metadata?.name as string) ?? null,
    },
    update: { email: user.email! },
    select: { slug: true },
  })

  const slugOrId = dbUser.slug ?? user.id
  const copyLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/agendar/${slugOrId}`

  return (
    <div className="flex min-h-screen flex-col md:flex-row">

      {/* ── Mobile: hamburger + drawer ────────────────────────────────────── */}
      <MobileNav email={user.email!} copyLinkUrl={copyLinkUrl} />

      {/* ── Desktop: sidebar fixa ─────────────────────────────────────────── */}
      <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border px-4 py-5">
          <span className="font-bold text-lg">MarcaAí ✂️</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1 border-t border-border px-2 py-4">
          <p className="truncate px-3 text-xs text-muted-foreground">{user.email}</p>
          <CopyLinkButton url={copyLinkUrl} />
          <LogoutButton />
        </div>
      </aside>

      {/* ── Conteúdo principal ────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto bg-background p-4 md:p-6">
        {children}
      </main>

    </div>
  )
}

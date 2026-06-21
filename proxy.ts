import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set({ name, value })
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isAuthRoute = pathname === '/login' || pathname === '/signup'
  // Usar === ou startsWith com '/' no final para evitar falsos positivos
  // ex: /agendar/* NÃO deve ser bloqueado mesmo começando com /agenda
  const isDashboardRoute =
    pathname === '/agenda' ||
    pathname.startsWith('/agenda/') ||
    pathname === '/profissionais' ||
    pathname.startsWith('/profissionais/') ||
    pathname === '/servicos' ||
    pathname.startsWith('/servicos/') ||
    pathname === '/clientes' ||
    pathname.startsWith('/clientes/') ||
    pathname === '/faturamento' ||
    pathname.startsWith('/faturamento/') ||
    pathname === '/configuracoes' ||
    pathname.startsWith('/configuracoes/')

  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/agenda'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/cron|api/webhooks).*)'],
}

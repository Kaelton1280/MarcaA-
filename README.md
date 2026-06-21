# MarcaAí ✂️

Plataforma SaaS de agendamento online para barbearias, salões de beleza e profissionais da estética.

## Funcionalidades

- **Agendamento público** — link personalizado para os clientes agendarem sem precisar de conta
- **Gestão de profissionais** — cadastro da equipe com foto de perfil e especialidade
- **Gestão de serviços** — catálogo de serviços com duração e preço
- **Agenda** — visualização dos agendamentos do dia
- **Clientes** — histórico de clientes
- **Lembretes via WhatsApp** — notificações automáticas antes do horário marcado (Z-API)
- **Link personalizado** — URL amigável para compartilhar com clientes

## Stack

- [Next.js](https://nextjs.org/) — framework fullstack (App Router)
- [Supabase](https://supabase.com/) — autenticação e armazenamento de imagens
- [Prisma](https://www.prisma.io/) — ORM com PostgreSQL
- [Tailwind CSS](https://tailwindcss.com/) — estilização
- [Z-API](https://www.z-api.io/) — envio de lembretes via WhatsApp
- [Vercel](https://vercel.com/) — hospedagem

## Configuração local

### Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com/)

### Instalação

```bash
git clone https://github.com/Kaelton1280/MarcaA-.git
cd MarcaA-
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Banco de dados
DATABASE_URL=
DIRECT_URL=

# Z-API (WhatsApp)
ZAPI_INSTANCE_ID=
ZAPI_TOKEN=

# Cron
CRON_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Banco de dados

```bash
npx prisma db push
```

### Rodar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Deploy

O projeto está configurado para deploy na Vercel. Basta conectar o repositório e configurar as variáveis de ambiente no painel.

---

Desenvolvido por [Kaelton Dias](https://github.com/Kaelton1280)

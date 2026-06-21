import { defineConfig } from 'prisma/config'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Prisma CLI só lê .env — carrega .env.local manualmente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL,
  },
})
